import { env } from "@playbutton-tracker/env/server";
import {
  type ViewStatsChannelSnapshot,
  ViewStatsError,
} from "./channel-schema";
import {
  type ChannelSnapshotFailure,
  createGetChannelSnapshot,
} from "./channel-snapshot";
import { createViewStatsChannelSnapshotSource } from "./viewstats-channel-snapshot-source.server";

const HTTP_STATUS = {
  BAD_GATEWAY: 502,
  BAD_REQUEST: 400,
  GATEWAY_TIMEOUT: 504,
  NOT_FOUND: 404,
} as const;
const MIN_SIGNED_BYTE = -128;
const MAX_UNSIGNED_BYTE = 255;

const isEncodedByte = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= MIN_SIGNED_BYTE &&
  value <= MAX_UNSIGNED_BYTE;

const extractSignedBytes = (source: string): Uint8Array<ArrayBuffer> => {
  const decoded = atob(source);
  const parsedBytes: unknown = JSON.parse(decoded);

  if (!(Array.isArray(parsedBytes) && parsedBytes.every(isEncodedByte))) {
    throw new Error("ViewStats key material must contain encoded bytes");
  }

  const signedBytes = parsedBytes;
  const bytes = new Uint8Array(new ArrayBuffer(signedBytes.length));

  for (const [index, value] of signedBytes.entries()) {
    bytes[index] = value < 0 ? value + 256 : value;
  }

  return bytes;
};

const viewStatsSource = createViewStatsChannelSnapshotSource({
  apiToken: env.VIEWSTATS_API_TOKEN,
  baseUrl: env.VIEWSTATS_BASE_URL,
  iv: extractSignedBytes(env.VIEWSTATS_IV_SOURCE),
  keyBytes: extractSignedBytes(env.VIEWSTATS_KEY_SOURCE),
});

export const getChannelSnapshot = createGetChannelSnapshot({
  clock: () => new Date(),
  reportFailure: ({ cause, reason }) => {
    if (reason !== "not-found") {
      console.error("Channel snapshot source failed", { cause, reason });
    }
  },
  source: viewStatsSource,
});

const getLegacyFailureStatus = (
  reason: ChannelSnapshotFailure["reason"]
): number => {
  if (reason === "invalid-identifier") {
    return HTTP_STATUS.BAD_REQUEST;
  }

  if (reason === "not-found") {
    return HTTP_STATUS.NOT_FOUND;
  }

  if (reason === "timeout") {
    return HTTP_STATUS.GATEWAY_TIMEOUT;
  }

  return HTTP_STATUS.BAD_GATEWAY;
};

/** @deprecated Use the provider-neutral getChannelSnapshot outcome. */
export const getLegacyViewStatsChannelSnapshot = async (
  identifier: string
): Promise<ViewStatsChannelSnapshot> => {
  const outcome = await getChannelSnapshot(identifier);

  if (outcome.status === "success") {
    return outcome.snapshot;
  }

  throw new ViewStatsError(
    "ViewStats channel snapshot request failed",
    getLegacyFailureStatus(outcome.reason),
    { reason: outcome.reason }
  );
};
