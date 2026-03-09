import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getChannelSnapshotInputSchema,
  ViewStatsError,
} from "./channel-schema";
import { getChannelSnapshot } from "./channel-snapshot.server";

export const getChannelSnapshotFn = createServerFn({ method: "GET" })
  .inputValidator(getChannelSnapshotInputSchema)
  .handler(async ({ data }) => {
    try {
      return await getChannelSnapshot(data.handle);
    } catch (error) {
      if (error instanceof ViewStatsError && error.status === 404) {
        throw notFound();
      }

      if (error instanceof z.ZodError) {
        throw new Error("Unexpected ViewStats response shape");
      }

      throw new Error("Failed to fetch channel snapshot", {
        cause: error,
      });
    }
  });
