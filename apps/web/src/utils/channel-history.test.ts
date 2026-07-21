import { describe, expect, it } from "bun:test";

import { calculateSubscriberGain } from "./channel-history";

describe("calculateSubscriberGain", () => {
  it("includes the delta from every day in the requested window", () => {
    const points = [
      { subscriberCountDelta: 1000 },
      { subscriberCountDelta: 1000 },
      { subscriberCountDelta: 0 },
      { subscriberCountDelta: 1000 },
      { subscriberCountDelta: 1000 },
      { subscriberCountDelta: 1000 },
      { subscriberCountDelta: 1000 },
    ];

    expect(calculateSubscriberGain(points)).toBe(6000);
  });

  it("uses the delta from a single available day", () => {
    expect(calculateSubscriberGain([{ subscriberCountDelta: 250 }])).toBe(250);
  });

  it("returns null when no history is available", () => {
    expect(calculateSubscriberGain([])).toBeNull();
  });
});
