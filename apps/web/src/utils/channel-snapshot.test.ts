import { describe, expect, it } from "bun:test";

import { createGetChannelSnapshot } from "./channel-snapshot";
import {
  type ChannelSnapshotSource,
  ChannelSnapshotSourceError,
} from "./channel-snapshot-source";

describe("Channel Snapshot", () => {
  it("returns a complete provider-neutral snapshot", async () => {
    const requestedIdentifiers: string[] = [];
    const requestedHistoryWindows: number[] = [];
    const source: ChannelSnapshotSource = {
      getHistory: (_identifier, days) => {
        requestedHistoryWindows.push(days);
        const subscriberCountDelta = days === 7 ? 700 : 2800;

        return Promise.resolve([
          { subscriberCountDelta },
          { subscriberCountDelta: -100 },
        ]);
      },
      getMetadata: (identifier) => {
        requestedIdentifiers.push(identifier);

        return Promise.resolve({
          avatarUrl: "https://example.com/avatar.png",
          channelName: "Example Channel",
          handle: "example",
          subscriberCount: 125_000,
        });
      },
    };
    const getChannelSnapshot = createGetChannelSnapshot({
      clock: () => new Date("2026-07-21T12:34:56.000Z"),
      source,
    });

    const outcome = await getChannelSnapshot(" example ");

    expect(outcome).toEqual({
      snapshot: {
        avatarUrl: "https://example.com/avatar.png",
        capturedAt: "2026-07-21T12:34:56.000Z",
        channelName: "Example Channel",
        handle: "example",
        subscriberCount: 125_000,
        subsGained7Day: 600,
        subsGained28Day: 2700,
      },
      status: "success",
    });
    expect(requestedIdentifiers).toEqual(["@example"]);
    expect(requestedHistoryWindows).toEqual([7, 28]);
  });

  it("preserves channel IDs and represents unavailable history", async () => {
    const requestedIdentifiers: string[] = [];
    const source: ChannelSnapshotSource = {
      getHistory: () => Promise.resolve([]),
      getMetadata: (identifier) => {
        requestedIdentifiers.push(identifier);

        return Promise.resolve({
          avatarUrl: null,
          channelName: "Example Channel",
          handle: "example",
          subscriberCount: 125_000,
        });
      },
    };
    const getChannelSnapshot = createGetChannelSnapshot({
      clock: () => new Date("2026-07-21T12:34:56.000Z"),
      source,
    });

    const outcome = await getChannelSnapshot("UCkVfrGwV-iG9bSsgCbrNPxQ");

    expect(requestedIdentifiers).toEqual(["UCkVfrGwV-iG9bSsgCbrNPxQ"]);
    expect(outcome).toMatchObject({
      snapshot: {
        subsGained7Day: null,
        subsGained28Day: null,
      },
      status: "success",
    });
  });

  it("deduplicates concurrent equivalent identifiers and reuses the snapshot", async () => {
    const metadata = Promise.withResolvers<{
      avatarUrl: null;
      channelName: string;
      handle: string;
      subscriberCount: number;
    }>();
    let metadataRequestCount = 0;
    const source: ChannelSnapshotSource = {
      getHistory: () => Promise.resolve([]),
      getMetadata: () => {
        metadataRequestCount += 1;
        return metadata.promise;
      },
    };
    const getChannelSnapshot = createGetChannelSnapshot({
      clock: () => new Date("2026-07-21T12:34:56.000Z"),
      source,
    });

    const firstRequest = getChannelSnapshot("example");
    const secondRequest = getChannelSnapshot("@example");
    metadata.resolve({
      avatarUrl: null,
      channelName: "Example Channel",
      handle: "example",
      subscriberCount: 125_000,
    });
    const [first, second] = await Promise.all([firstRequest, secondRequest]);
    const third = await getChannelSnapshot("example");

    expect(first).toEqual(second);
    expect(second).toEqual(third);
    expect(metadataRequestCount).toBe(1);
  });

  it("refreshes a successful snapshot after its five-minute lifetime", async () => {
    let currentTime = Date.parse("2026-07-21T12:00:00.000Z");
    let metadataRequestCount = 0;
    const source: ChannelSnapshotSource = {
      getHistory: () => Promise.resolve([]),
      getMetadata: () => {
        metadataRequestCount += 1;

        return Promise.resolve({
          avatarUrl: null,
          channelName: "Example Channel",
          handle: "example",
          subscriberCount: 125_000,
        });
      },
    };
    const getChannelSnapshot = createGetChannelSnapshot({
      clock: () => new Date(currentTime),
      source,
    });

    await getChannelSnapshot("example");
    currentTime += 5 * 60 * 1000 - 1;
    await getChannelSnapshot("example");
    currentTime += 1;
    const refreshed = await getChannelSnapshot("example");

    expect(metadataRequestCount).toBe(2);
    expect(refreshed).toMatchObject({
      snapshot: { capturedAt: "2026-07-21T12:05:00.000Z" },
      status: "success",
    });
  });

  it("keeps 250 snapshots and refreshes least-recently-used entries", async () => {
    const metadataRequestCounts = new Map<string, number>();
    const source: ChannelSnapshotSource = {
      getHistory: () => Promise.resolve([]),
      getMetadata: (identifier) => {
        metadataRequestCounts.set(
          identifier,
          (metadataRequestCounts.get(identifier) ?? 0) + 1
        );

        return Promise.resolve({
          avatarUrl: null,
          channelName: identifier,
          handle: identifier.slice(1),
          subscriberCount: 125_000,
        });
      },
    };
    const getChannelSnapshot = createGetChannelSnapshot({
      clock: () => new Date("2026-07-21T12:34:56.000Z"),
      source,
    });

    for (let index = 0; index < 250; index += 1) {
      await getChannelSnapshot(`channel-${index}`);
    }

    await getChannelSnapshot("channel-0");
    await getChannelSnapshot("channel-250");
    await getChannelSnapshot("channel-0");
    await getChannelSnapshot("channel-1");

    expect(metadataRequestCounts.get("@channel-0")).toBe(1);
    expect(metadataRequestCounts.get("@channel-1")).toBe(2);
    expect(
      [...metadataRequestCounts.values()].reduce(
        (requestCount, count) => requestCount + count,
        0
      )
    ).toBe(252);
  });

  it("returns a provider-neutral failure for an invalid identifier", async () => {
    let metadataRequestCount = 0;
    const source: ChannelSnapshotSource = {
      getHistory: () => Promise.resolve([]),
      getMetadata: () => {
        metadataRequestCount += 1;
        return Promise.reject(new Error("should not load"));
      },
    };
    const getChannelSnapshot = createGetChannelSnapshot({
      clock: () => new Date("2026-07-21T12:34:56.000Z"),
      source,
    });

    const outcome = await getChannelSnapshot(" ");

    expect(outcome).toEqual({
      reason: "invalid-identifier",
      status: "failure",
    });
    expect(metadataRequestCount).toBe(0);
  });

  it.each([
    "not-found",
    "timeout",
    "decode",
    "schema",
    "empty-response",
    "upstream",
  ] as const)("preserves the %s source outcome without provider details", async (reason) => {
    const source: ChannelSnapshotSource = {
      getHistory: () => Promise.resolve([]),
      getMetadata: () =>
        Promise.reject(
          new ChannelSnapshotSourceError(
            reason,
            new Error("provider-specific details")
          )
        ),
    };
    const getChannelSnapshot = createGetChannelSnapshot({
      clock: () => new Date("2026-07-21T12:34:56.000Z"),
      source,
    });

    const outcome = await getChannelSnapshot("example");

    expect(outcome).toEqual({
      reason,
      status: "failure",
    });
  });

  it("contains unexpected source errors as a general upstream failure", async () => {
    const source: ChannelSnapshotSource = {
      getHistory: () => Promise.resolve([]),
      getMetadata: () => Promise.reject(new Error("unexpected provider error")),
    };
    const getChannelSnapshot = createGetChannelSnapshot({
      clock: () => new Date("2026-07-21T12:34:56.000Z"),
      source,
    });

    const outcome = await getChannelSnapshot("example");

    expect(outcome).toEqual({
      reason: "upstream",
      status: "failure",
    });
  });

  it("retains source diagnostics inside module construction", async () => {
    const providerCause = new Error("provider-specific details");
    const reportedDiagnostics: unknown[] = [];
    const source: ChannelSnapshotSource = {
      getHistory: () => Promise.resolve([]),
      getMetadata: () =>
        Promise.reject(new ChannelSnapshotSourceError("decode", providerCause)),
    };
    const getChannelSnapshot = createGetChannelSnapshot({
      clock: () => new Date("2026-07-21T12:34:56.000Z"),
      reportFailure: (diagnostic) => reportedDiagnostics.push(diagnostic),
      source,
    });

    const outcome = await getChannelSnapshot("example");

    expect(outcome).toEqual({ reason: "decode", status: "failure" });
    expect(reportedDiagnostics).toEqual([
      { cause: providerCause, reason: "decode" },
    ]);
  });
});
