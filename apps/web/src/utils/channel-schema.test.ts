import { describe, expect, it } from "bun:test";

import { getChannelSnapshotInputSchema } from "./channel-schema";

describe("getChannelSnapshotInputSchema", () => {
  it("rejects identifiers that are large enough to amplify request abuse", () => {
    const result = getChannelSnapshotInputSchema.safeParse({
      handle: "x".repeat(101),
    });

    expect(result.success).toBeFalse();
  });
});
