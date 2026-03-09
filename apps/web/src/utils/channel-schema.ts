import { z } from "zod";

export const getChannelSnapshotInputSchema = z.object({
  handle: z.string().trim().min(1),
});

export interface ViewStatsChannelSnapshot {
  avatarUrl: string | null;
  channelName: string;
  handle: string;
  subscriberCount: number | null;
  subsGained7Day: number | null;
  subsGained28Day: number | null;
}

export class ViewStatsError extends Error {
  readonly details?: unknown;
  readonly status: number;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ViewStatsError";
    this.status = status;
    this.details = details;
  }
}
