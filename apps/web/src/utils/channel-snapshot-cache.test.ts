import { describe, expect, it } from "bun:test";

import type { ViewStatsChannelSnapshot } from "./channel-schema";
import { createChannelSnapshotCache } from "./channel-snapshot-cache";

const snapshot: ViewStatsChannelSnapshot = {
  avatarUrl: null,
  capturedAt: "2026-07-21T00:05:00.000Z",
  channelName: "Example",
  handle: "example",
  subscriberCount: 100_000,
  subsGained7Day: 700,
  subsGained28Day: 2800,
};

describe("createChannelSnapshotCache", () => {
  it("deduplicates concurrent requests and reuses successful results", async () => {
    const cache = createChannelSnapshotCache({ maxEntries: 10, ttlMs: 1000 });
    let loadCount = 0;
    const loader = () => {
      loadCount += 1;
      return Promise.resolve(snapshot);
    };

    const [first, second] = await Promise.all([
      cache.get("@example", loader),
      cache.get("@example", loader),
    ]);
    const third = await cache.get("@example", loader);

    expect(first).toBe(snapshot);
    expect(second).toBe(snapshot);
    expect(third).toBe(snapshot);
    expect(loadCount).toBe(1);
  });

  it("reloads snapshots after the TTL expires", async () => {
    let currentTime = 0;
    const cache = createChannelSnapshotCache({
      maxEntries: 10,
      now: () => currentTime,
      ttlMs: 1000,
    });
    let loadCount = 0;
    const loader = () => {
      loadCount += 1;
      return Promise.resolve(snapshot);
    };

    await cache.get("@example", loader);
    currentTime = 1001;
    await cache.get("@example", loader);

    expect(loadCount).toBe(2);
  });
});
