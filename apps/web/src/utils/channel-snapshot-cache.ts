import type { ViewStatsChannelSnapshot } from "./channel-schema";

interface ChannelSnapshotCacheOptions {
  maxEntries: number;
  now?: () => number;
  ttlMs: number;
}

interface CachedChannelSnapshot {
  expiresAt: number;
  snapshot: ViewStatsChannelSnapshot;
}

type ChannelSnapshotLoader = () => Promise<ViewStatsChannelSnapshot>;

export const createChannelSnapshotCache = ({
  maxEntries,
  now = Date.now,
  ttlMs,
}: ChannelSnapshotCacheOptions) => {
  const entries = new Map<string, CachedChannelSnapshot>();
  const pendingRequests = new Map<string, Promise<ViewStatsChannelSnapshot>>();

  const storeSnapshot = (
    identifier: string,
    snapshot: ViewStatsChannelSnapshot
  ): void => {
    if (!entries.has(identifier) && entries.size >= maxEntries) {
      const oldestIdentifier = entries.keys().next().value;

      if (oldestIdentifier !== undefined) {
        entries.delete(oldestIdentifier);
      }
    }

    entries.delete(identifier);
    entries.set(identifier, {
      expiresAt: now() + ttlMs,
      snapshot,
    });
  };

  const loadSnapshot = async (
    identifier: string,
    loader: ChannelSnapshotLoader
  ): Promise<ViewStatsChannelSnapshot> => {
    try {
      const snapshot = await loader();
      storeSnapshot(identifier, snapshot);
      return snapshot;
    } finally {
      pendingRequests.delete(identifier);
    }
  };

  return {
    get: (
      identifier: string,
      loader: ChannelSnapshotLoader
    ): Promise<ViewStatsChannelSnapshot> => {
      const cachedSnapshot = entries.get(identifier);

      if (cachedSnapshot !== undefined && cachedSnapshot.expiresAt > now()) {
        entries.delete(identifier);
        entries.set(identifier, cachedSnapshot);
        return Promise.resolve(cachedSnapshot.snapshot);
      }

      entries.delete(identifier);

      const pendingRequest = pendingRequests.get(identifier);
      if (pendingRequest !== undefined) {
        return pendingRequest;
      }

      const request = loadSnapshot(identifier, loader);
      pendingRequests.set(identifier, request);
      return request;
    },
  };
};
