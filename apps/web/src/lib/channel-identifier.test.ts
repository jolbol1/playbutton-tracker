import { describe, expect, it } from "bun:test";

import {
  extractChannelIdentifier,
  normalizeViewStatsIdentifier,
} from "./channel-identifier";

describe("extractChannelIdentifier", () => {
  it("extracts a channel ID from a YouTube channel URL", () => {
    expect(
      extractChannelIdentifier(
        "https://www.youtube.com/channel/UCkVfrGwV-iG9bSsgCbrNPxQ"
      )
    ).toBe("UCkVfrGwV-iG9bSsgCbrNPxQ");
  });

  it("extracts handles from direct input and YouTube URLs", () => {
    expect(extractChannelIdentifier("@betterstack")).toBe("betterstack");
    expect(
      extractChannelIdentifier("https://youtube.com/@betterstack/videos")
    ).toBe("betterstack");
  });
});

describe("normalizeViewStatsIdentifier", () => {
  it("preserves channel IDs", () => {
    expect(normalizeViewStatsIdentifier("UCkVfrGwV-iG9bSsgCbrNPxQ")).toBe(
      "UCkVfrGwV-iG9bSsgCbrNPxQ"
    );
  });

  it("prefixes handles for ViewStats", () => {
    expect(normalizeViewStatsIdentifier("betterstack")).toBe("@betterstack");
    expect(normalizeViewStatsIdentifier("@betterstack")).toBe("@betterstack");
  });
});
