import { describe, expect, it } from "bun:test";
import { isNotFound } from "@tanstack/react-router";

import type { ChannelSnapshot } from "./channel-snapshot";
import { resolveChannelSnapshotOutcome } from "./channel-snapshot-route";

const snapshot: ChannelSnapshot = {
  avatarUrl: null,
  capturedAt: "2026-07-21T12:34:56.000Z",
  channelName: "Example Channel",
  handle: "example",
  subscriberCount: 125_000,
  subsGained7Day: 700,
  subsGained28Day: 2800,
};

describe("Channel Snapshot route adapter", () => {
  it("unwraps a successful provider-neutral outcome", () => {
    expect(resolveChannelSnapshotOutcome({ snapshot, status: "success" })).toBe(
      snapshot
    );
  });

  it("maps a provider-neutral not-found outcome to the framework", () => {
    let thrownValue: unknown;

    try {
      resolveChannelSnapshotOutcome({
        reason: "not-found",
        status: "failure",
      });
    } catch (error) {
      thrownValue = error;
    }

    expect(isNotFound(thrownValue)).toBeTrue();
  });

  it("maps other provider-neutral failures without provider details", () => {
    expect(() =>
      resolveChannelSnapshotOutcome({
        reason: "decode",
        status: "failure",
      })
    ).toThrow("Channel snapshot unavailable (decode)");
  });
});
