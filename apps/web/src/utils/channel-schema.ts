import type { ChannelSnapshot } from "./channel-snapshot";

/** @deprecated Use the provider-neutral ChannelSnapshot type. */
export type ViewStatsChannelSnapshot = ChannelSnapshot;

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
