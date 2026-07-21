interface ChannelSnapshotMetadata {
  avatarUrl: string | null;
  channelName: string;
  handle: string;
  subscriberCount: number | null;
}

interface ChannelSnapshotHistoryPoint {
  subscriberCountDelta: number;
}

type ChannelSnapshotHistoryWindow = 7 | 28;

export interface ChannelSnapshotSource {
  getHistory: (
    identifier: string,
    days: ChannelSnapshotHistoryWindow
  ) => Promise<readonly ChannelSnapshotHistoryPoint[]>;
  getMetadata: (identifier: string) => Promise<ChannelSnapshotMetadata>;
}

export type ChannelSnapshotSourceFailureReason =
  | "decode"
  | "empty-response"
  | "not-found"
  | "schema"
  | "timeout"
  | "upstream";

export class ChannelSnapshotSourceError extends Error {
  readonly reason: ChannelSnapshotSourceFailureReason;

  constructor(reason: ChannelSnapshotSourceFailureReason, cause?: unknown) {
    super(`Channel snapshot source failed: ${reason}`, { cause });
    this.name = "ChannelSnapshotSourceError";
    this.reason = reason;
  }
}
