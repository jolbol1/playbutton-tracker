interface ChannelSnapshotCacheOptions {
  maxEntries: number;
  now?: () => number;
  ttlMs: number;
}

interface CachedChannelSnapshot<Snapshot> {
  expiresAt: number;
  snapshot: Snapshot;
}

type ChannelSnapshotLoader<Snapshot> = () => Promise<Snapshot>;

export const createChannelSnapshotCache = <Snapshot>({
  maxEntries,
  now = Date.now,
  ttlMs,
}: ChannelSnapshotCacheOptions) => {
  const entries = new Map<string, CachedChannelSnapshot<Snapshot>>();
  const pendingRequests = new Map<string, Promise<Snapshot>>();

  const storeSnapshot = (identifier: string, snapshot: Snapshot): void => {
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
    loader: ChannelSnapshotLoader<Snapshot>
  ): Promise<Snapshot> => {
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
      loader: ChannelSnapshotLoader<Snapshot>
    ): Promise<Snapshot> => {
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
