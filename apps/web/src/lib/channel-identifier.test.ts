import { describe, expect, it } from "bun:test";

import { extractChannelIdentifier } from "./channel-identifier";

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
