import { z } from "zod";

import { calculateSubscriberGain } from "./channel-history";
import { createChannelSnapshotCache } from "./channel-snapshot-cache";
import {
  type ChannelSnapshotSource,
  ChannelSnapshotSourceError,
  type ChannelSnapshotSourceFailureReason,
} from "./channel-snapshot-source";

const CHANNEL_ID_REGEX = /^UC[A-Za-z0-9_-]{22}$/;
const SNAPSHOT_CACHE_MAX_ENTRIES = 250;
const SNAPSHOT_CACHE_TTL_MS = 5 * 60 * 1000;

export interface ChannelSnapshot {
  avatarUrl: string | null;
  capturedAt: string;
  channelName: string;
  handle: string;
  subscriberCount: number | null;
  subsGained7Day: number | null;
  subsGained28Day: number | null;
}

export interface ChannelSnapshotSuccess {
  snapshot: ChannelSnapshot;
  status: "success";
}

export interface ChannelSnapshotFailure {
  reason: "invalid-identifier" | ChannelSnapshotSourceFailureReason;
  status: "failure";
}

export type ChannelSnapshotOutcome =
  | ChannelSnapshotFailure
  | ChannelSnapshotSuccess;

interface CreateGetChannelSnapshotOptions {
  clock: () => Date;
  reportFailure?: (diagnostic: {
    cause: unknown;
    reason: ChannelSnapshotSourceFailureReason;
  }) => void;
  source: ChannelSnapshotSource;
}

const channelIdentifierSchema = z.string().trim().min(1).max(100);

const normalizeChannelIdentifier = (identifier: string): string => {
  if (identifier.startsWith("@") || CHANNEL_ID_REGEX.test(identifier)) {
    return identifier;
  }

  return `@${identifier}`;
};

export const createGetChannelSnapshot = ({
  clock,
  reportFailure = () => undefined,
  source,
}: CreateGetChannelSnapshotOptions) => {
  const cache = createChannelSnapshotCache<ChannelSnapshot>({
    maxEntries: SNAPSHOT_CACHE_MAX_ENTRIES,
    now: () => clock().getTime(),
    ttlMs: SNAPSHOT_CACHE_TTL_MS,
  });

  return async (identifierInput: string): Promise<ChannelSnapshotOutcome> => {
    const parsedIdentifier = channelIdentifierSchema.safeParse(identifierInput);

    if (!parsedIdentifier.success) {
      return {
        reason: "invalid-identifier",
        status: "failure",
      };
    }

    const identifier = normalizeChannelIdentifier(parsedIdentifier.data);
    try {
      const snapshot = await cache.get(identifier, async () => {
        const metadata = await source.getMetadata(identifier);
        const [history7Day, history28Day] = await Promise.all([
          source.getHistory(identifier, 7),
          source.getHistory(identifier, 28),
        ]);

        return {
          ...metadata,
          capturedAt: clock().toISOString(),
          subsGained7Day: calculateSubscriberGain(history7Day),
          subsGained28Day: calculateSubscriberGain(history28Day),
        };
      });

      return {
        snapshot,
        status: "success",
      };
    } catch (error) {
      if (error instanceof ChannelSnapshotSourceError) {
        reportFailure({ cause: error.cause, reason: error.reason });

        return {
          reason: error.reason,
          status: "failure",
        };
      }

      reportFailure({ cause: error, reason: "upstream" });

      return {
        reason: "upstream",
        status: "failure",
      };
    }
  };
};
