import { notFound } from "@tanstack/react-router";

import type {
  ChannelSnapshot,
  ChannelSnapshotOutcome,
} from "./channel-snapshot";

export const resolveChannelSnapshotOutcome = (
  outcome: ChannelSnapshotOutcome
): ChannelSnapshot => {
  if (outcome.status === "success") {
    return outcome.snapshot;
  }

  if (outcome.reason === "not-found") {
    throw notFound();
  }

  throw new Error(`Channel snapshot unavailable (${outcome.reason})`);
};
