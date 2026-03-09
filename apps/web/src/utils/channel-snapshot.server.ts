import { env } from "@playbutton-tracker/env/server";
import { z } from "zod";

import {
  type ViewStatsChannelSnapshot,
  ViewStatsError,
} from "./channel-schema";

const JSON_CONTENT_TYPE = "application/json";
const LOG_PAYLOAD_PREVIEW_LIMIT = 1000;

const channelMetadataResponseSchema = z.object({
  data: z.object({
    avatarUrl: z.string().nullable(),
    displayName: z.string(),
    handle: z.string(),
    subscriberCount: z.number().nullable(),
  }),
});

const channelStatsPointSchema = z.object({
  date: z.string(),
  insertedAt: z.string(),
  subscriberCount: z.number(),
  subscriberCountDelta: z.number(),
});

const channelStatsResponseSchema = z.object({
  data: z.array(channelStatsPointSchema),
});

const normalizeRequestHandle = (handle: string): string => {
  return handle.startsWith("@") ? handle : `@${handle}`;
};

const extractSignedBytes = (source: string): ArrayBuffer => {
  const decoded = atob(source);
  const signedBytes = JSON.parse(decoded) as number[];
  const buffer = new ArrayBuffer(signedBytes.length);
  const bytes = new Uint8Array(buffer);

  for (const [index, value] of signedBytes.entries()) {
    bytes[index] = value < 0 ? value + 256 : value;
  }

  return buffer;
};

const VIEWSTATS_IV = extractSignedBytes(env.VIEWSTATS_IV_SOURCE);
const VIEWSTATS_KEY_BYTES = extractSignedBytes(env.VIEWSTATS_KEY_SOURCE);

let viewStatsCryptoKeyPromise: Promise<CryptoKey> | undefined;

const getViewStatsCryptoKey = (): Promise<CryptoKey> => {
  viewStatsCryptoKeyPromise ??= crypto.subtle.importKey(
    "raw",
    VIEWSTATS_KEY_BYTES,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  return viewStatsCryptoKeyPromise;
};

const calculateGain = (
  stats: z.infer<typeof channelStatsResponseSchema>
): number | null => {
  const firstPoint = stats.data[0];
  const lastPoint = stats.data.at(-1);

  if (firstPoint === undefined || lastPoint === undefined) {
    return null;
  }

  return lastPoint.subscriberCount - firstPoint.subscriberCount;
};

const parseViewStatsBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes(JSON_CONTENT_TYPE)) {
    return response.json();
  }

  const encryptedBody = await response.arrayBuffer();
  if (encryptedBody.byteLength === 0) {
    return null;
  }

  const cryptoKey = await getViewStatsCryptoKey();
  const decryptedBody = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: VIEWSTATS_IV,
    },
    cryptoKey,
    encryptedBody
  );

  const payload = new TextDecoder().decode(decryptedBody);
  return JSON.parse(payload);
};

const getPayloadPreview = (payload: unknown): string => {
  if (payload === null) {
    return "null";
  }

  if (payload === undefined) {
    return "undefined";
  }

  if (typeof payload === "string") {
    return payload.slice(0, LOG_PAYLOAD_PREVIEW_LIMIT);
  }

  try {
    return JSON.stringify(payload).slice(0, LOG_PAYLOAD_PREVIEW_LIMIT);
  } catch {
    return "[unserializable payload]";
  }
};

const fetchFromViewStats = async <T>(
  path: string,
  schema: z.ZodType<T>,
  searchParams?: Record<string, string>
): Promise<T> => {
  const url = new URL(path, env.VIEWSTATS_BASE_URL);

  if (searchParams !== undefined) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.VIEWSTATS_API_TOKEN}`,
      Referer: "https://www.viewstats.com/",
      "Content-Type": JSON_CONTENT_TYPE,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      "sec-ch-ua":
        '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
    },
  });

  let payload: unknown;

  try {
    payload = await parseViewStatsBody(response);
  } catch (error) {
    console.error("ViewStats response decode failed", {
      contentType: response.headers.get("content-type"),
      path,
      searchParams,
      status: response.status || 502,
    });
    throw new ViewStatsError(
      "Failed to decode ViewStats response",
      response.status || 502,
      error
    );
  }

  if (!response.ok) {
    console.error("ViewStats request failed", {
      contentType: response.headers.get("content-type"),
      path,
      payloadPreview: getPayloadPreview(payload),
      searchParams,
      status: response.status,
      statusText: response.statusText,
      url: url.toString(),
    });
    throw new ViewStatsError(
      "ViewStats request failed",
      response.status,
      payload
    );
  }

  try {
    return schema.parse(payload);
  } catch (error) {
    console.error("ViewStats response schema validation failed", {
      path,
      payloadPreview: getPayloadPreview(payload),
      searchParams,
      url: url.toString(),
    });
    throw error;
  }
};

export const getChannelSnapshot = async (
  handleInput: string
): Promise<ViewStatsChannelSnapshot> => {
  const normalizedHandle = normalizeRequestHandle(handleInput);
  const encodedHandle = encodeURIComponent(normalizedHandle);

  const [metadata, stats7Day, stats28Day] = await Promise.all([
    fetchFromViewStats(
      `/channels/${encodedHandle}`,
      channelMetadataResponseSchema
    ),
    fetchFromViewStats(
      `/channels/${encodedHandle}/stats`,
      channelStatsResponseSchema,
      {
        groupBy: "daily",
        range: "7",
        sortOrder: "ASC",
        withBreakdown: "false",
        withEvents: "false",
        withRevenue: "false",
        withToday: "false",
      }
    ),
    fetchFromViewStats(
      `/channels/${encodedHandle}/stats`,
      channelStatsResponseSchema,
      {
        groupBy: "daily",
        range: "28",
        sortOrder: "ASC",
        withBreakdown: "false",
        withEvents: "false",
        withRevenue: "false",
        withToday: "false",
      }
    ),
  ]);

  return {
    avatarUrl: metadata.data.avatarUrl,
    channelName: metadata.data.displayName,
    handle: metadata.data.handle,
    subscriberCount: metadata.data.subscriberCount,
    subsGained7Day: calculateGain(stats7Day),
    subsGained28Day: calculateGain(stats28Day),
  };
};
