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

      if (error instanceof ViewStatsError) {
        console.error("Channel snapshot request failed", {
          details: error.details,
          handle: data.handle,
          message: error.message,
          status: error.status,
        });
        throw new Error(`Failed to fetch channel snapshot (${error.status})`, {
          cause: error,
        });
      }

      if (error instanceof z.ZodError) {
        console.error("Channel snapshot response validation failed", {
          handle: data.handle,
          issues: error.issues,
        });
        throw new Error("Unexpected ViewStats response shape");
      }

      console.error("Channel snapshot request failed with unexpected error", {
        error,
        handle: data.handle,
      });
      throw new Error("Failed to fetch channel snapshot", {
        cause: error,
      });
    }
  });
