import { env } from "@playbutton-tracker/env/server";
import { createGetChannelSnapshot } from "./channel-snapshot";
import { createViewStatsChannelSnapshotSource } from "./viewstats-channel-snapshot-source.server";

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
