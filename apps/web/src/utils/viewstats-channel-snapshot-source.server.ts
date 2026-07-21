import { z } from "zod";

import {
  type ChannelSnapshotSource,
  ChannelSnapshotSourceError,
  type ChannelSnapshotSourceFailureReason,
} from "./channel-snapshot-source";

const JSON_CONTENT_TYPE = "application/json";
const HTTP_STATUS_NOT_FOUND = 404;
const VIEWSTATS_REQUEST_TIMEOUT_MS = 10_000;

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

interface ViewStatsChannelSnapshotSourceOptions {
  apiToken: string;
  baseUrl: string;
  fetcher?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  iv: Uint8Array<ArrayBuffer>;
  keyBytes: Uint8Array<ArrayBuffer>;
}

const isTimeoutError = (error: unknown): boolean =>
  error instanceof Error &&
  (error.name === "AbortError" || error.name === "TimeoutError");

export const createViewStatsChannelSnapshotSource = ({
  apiToken,
  baseUrl,
  fetcher = fetch,
  iv,
  keyBytes,
}: ViewStatsChannelSnapshotSourceOptions): ChannelSnapshotSource => {
  let cryptoKeyPromise: Promise<CryptoKey> | undefined;

  const getCryptoKey = (): Promise<CryptoKey> => {
    cryptoKeyPromise ??= crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    return cryptoKeyPromise;
  };

  const parseBody = async (response: Response): Promise<unknown> => {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes(JSON_CONTENT_TYPE)) {
      const body = await response.text();
      return body.trim() === "" ? null : JSON.parse(body);
    }

    const encryptedBody = await response.arrayBuffer();
    if (encryptedBody.byteLength === 0) {
      return null;
    }

    const cryptoKey = await getCryptoKey();
    const decryptedBody = await crypto.subtle.decrypt(
      { iv, name: "AES-GCM" },
      cryptoKey,
      encryptedBody
    );

    return JSON.parse(new TextDecoder().decode(decryptedBody));
  };

  const createRequestUrl = (
    path: string,
    searchParams?: Record<string, string>
  ): URL => {
    const url = new URL(path, baseUrl);

    if (searchParams !== undefined) {
      for (const [key, value] of Object.entries(searchParams)) {
        url.searchParams.set(key, value);
      }
    }

    return url;
  };

  const fetchResponse = async (url: URL): Promise<Response> => {
    try {
      const response = await fetcher(url, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Referer: "https://www.viewstats.com/",
          "Content-Type": JSON_CONTENT_TYPE,
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          "sec-ch-ua":
            '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
        },
        signal: AbortSignal.timeout(VIEWSTATS_REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const reason =
          response.status === HTTP_STATUS_NOT_FOUND ? "not-found" : "upstream";
        throw new ChannelSnapshotSourceError(reason, {
          status: response.status,
          statusText: response.statusText,
          url: url.toString(),
        });
      }

      return response;
    } catch (error) {
      if (error instanceof ChannelSnapshotSourceError) {
        throw error;
      }

      const reason: ChannelSnapshotSourceFailureReason = isTimeoutError(error)
        ? "timeout"
        : "upstream";
      throw new ChannelSnapshotSourceError(reason, error);
    }
  };

  const decodeResponse = async (response: Response): Promise<unknown> => {
    let payload: unknown;

    try {
      payload = await parseBody(response);
    } catch (error) {
      const reason = isTimeoutError(error) ? "timeout" : "decode";
      throw new ChannelSnapshotSourceError(reason, error);
    }

    if (payload === null) {
      throw new ChannelSnapshotSourceError("empty-response");
    }

    return payload;
  };

  const request = async <Output>(
    path: string,
    schema: z.ZodType<Output>,
    searchParams?: Record<string, string>
  ): Promise<Output> => {
    const url = createRequestUrl(path, searchParams);
    const response = await fetchResponse(url);
    const payload = await decodeResponse(response);

    try {
      return schema.parse(payload);
    } catch (error) {
      throw new ChannelSnapshotSourceError("schema", error);
    }
  };

  return {
    getHistory: async (identifier, days) => {
      const encodedIdentifier = encodeURIComponent(identifier);
      const response = await request(
        `/channels/${encodedIdentifier}/stats`,
        channelStatsResponseSchema,
        {
          groupBy: "daily",
          range: String(days),
          sortOrder: "ASC",
          withBreakdown: "false",
          withEvents: "false",
          withRevenue: "false",
          withToday: "false",
        }
      );

      return response.data.map(({ subscriberCountDelta }) => ({
        subscriberCountDelta,
      }));
    },
    getMetadata: async (identifier) => {
      const encodedIdentifier = encodeURIComponent(identifier);
      const response = await request(
        `/channels/${encodedIdentifier}`,
        channelMetadataResponseSchema
      );

      return {
        avatarUrl: response.data.avatarUrl,
        channelName: response.data.displayName,
        handle: response.data.handle,
        subscriberCount: response.data.subscriberCount,
      };
    },
  };
};
