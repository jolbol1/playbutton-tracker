import { describe, expect, it } from "bun:test";

import type { ChannelSnapshot } from "../utils/channel-snapshot";
import { createPrediction, PLAY_BUTTONS } from "./channel-helpers";

const snapshot: ChannelSnapshot = {
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

  it("explains a small positive rate using the selected period", () => {
    const prediction = createPrediction(
      { ...snapshot, subsGained28Day: 1 },
      PLAY_BUTTONS[0],
      28,
      "Based on last 28 days"
    );

    expect(prediction.dailyGrowthLabel).toBe("0 subs/day");
    expect(prediction.growthRoundingExplanation).toContain("gained");
    expect(prediction.growthRoundingExplanation).toContain("28 days");
  });

  it("does not describe a small decline as hidden growth", () => {
    const prediction = createPrediction(
      { ...snapshot, subsGained7Day: -1 },
      PLAY_BUTTONS[0],
      7,
      "Based on last 7 days"
    );

    expect(prediction.dailyGrowthLabel).toBe("0 subs/day");
    expect(prediction.growthRoundingExplanation).toContain("lost");
  });
});
