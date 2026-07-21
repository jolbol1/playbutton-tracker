import { describe, expect, it } from "bun:test";

import type { ViewStatsChannelSnapshot } from "../utils/channel-schema";
import { createPrediction, PLAY_BUTTONS } from "./channel-helpers";

const snapshot: ViewStatsChannelSnapshot = {
  avatarUrl: null,
  capturedAt: "2026-07-21T00:05:00.000Z",
  channelName: "Example",
  handle: "example",
  subscriberCount: 90_000,
  subsGained7Day: 700,
  subsGained28Day: 2800,
};

describe("createPrediction", () => {
  it("uses the serialized snapshot time and UTC for the estimated date", () => {
    const prediction = createPrediction(
      snapshot,
      PLAY_BUTTONS[0],
      7,
      "Based on last 7 days"
    );

    expect(prediction.estimatedDateLabel).toBe("October 29, 2026");
  });
});
