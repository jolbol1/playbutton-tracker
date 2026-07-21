import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getChannelSnapshot } from "./channel-snapshot.server";
import { resolveChannelSnapshotOutcome } from "./channel-snapshot-route";

const channelSnapshotRequestSchema = z.object({
  handle: z.string(),
});

export const getChannelSnapshotFn = createServerFn({ method: "GET" })
  .inputValidator(channelSnapshotRequestSchema)
  .handler(async ({ data }) => {
    const outcome = await getChannelSnapshot(data.handle);

    if (outcome.status === "failure" && outcome.reason !== "not-found") {
      console.error("Channel snapshot request failed", {
        handle: data.handle,
        reason: outcome.reason,
      });
    }

    return resolveChannelSnapshotOutcome(outcome);
  });
