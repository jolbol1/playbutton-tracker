import type { ChannelSnapshot } from "../utils/channel-snapshot";
import {
  getPlayButtonProgress,
  type PlayButtonProgressProjection,
} from "./play-button-progress";

const PRODUCTION_ORIGIN = "https://www.playbuttontracker.com";
const DEFAULT_TITLE = "Play Button Tracker";
const DEFAULT_DESCRIPTION =
  "Track YouTube channel subscriber progress toward creator awards, estimate milestone timelines, and view recent growth trends.";
const DEFAULT_IMAGE_ALT = "Play Button Tracker social preview";
const LEADING_AT_REGEX = /^@+/;
const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});

interface SocialPreviewChannel extends ChannelSnapshot {
  channelName: string;
  handle: string;
}

type SocialPreviewRequest =
  | { page: "channel"; channel: SocialPreviewChannel }
  | { page: "default" };

interface SocialPreviewLink {
  href: string;
  rel: "canonical";
}

type SocialPreviewMeta =
  | { content: string; name: string }
  | { content: string; property: string }
  | { title: string };

export interface SocialPreviewMetadata {
  links: SocialPreviewLink[];
  meta: SocialPreviewMeta[];
}

interface SocialPreviewContent {
  description: string;
  imageAlt: string;
  imageUrl: string;
  pageUrl: string;
  title: string;
}

export const getSocialPreviewMetadata = (
  request: SocialPreviewRequest
): SocialPreviewMetadata => {
  const content =
    request.page === "default"
      ? getDefaultSocialPreviewContent()
      : getChannelSocialPreviewContent(request.channel);

  return {
    links: [
      {
        href: content.pageUrl,
        rel: "canonical",
      },
    ],
    meta: [
      {
        title: content.title,
      },
      {
        content: content.description,
        name: "description",
      },
      {
        content: "website",
        property: "og:type",
      },
      {
        content: content.title,
        property: "og:title",
      },
      {
        content: content.description,
        property: "og:description",
      },
      {
        content: content.imageUrl,
        property: "og:image",
      },
      {
        content: content.imageAlt,
        property: "og:image:alt",
      },
      {
        content: content.pageUrl,
        property: "og:url",
      },
      {
        content: "summary_large_image",
        name: "twitter:card",
      },
      {
        content: content.title,
        name: "twitter:title",
      },
      {
        content: content.description,
        name: "twitter:description",
      },
      {
        content: content.imageUrl,
        name: "twitter:image",
      },
      {
        content: content.imageAlt,
        name: "twitter:image:alt",
      },
    ],
  };
};

const getDefaultSocialPreviewContent = (): SocialPreviewContent => ({
  description: DEFAULT_DESCRIPTION,
  imageAlt: DEFAULT_IMAGE_ALT,
  imageUrl: `${PRODUCTION_ORIGIN}/og.png`,
  pageUrl: `${PRODUCTION_ORIGIN}/`,
  title: DEFAULT_TITLE,
});

const getChannelSocialPreviewContent = (
  channel: SocialPreviewChannel
): SocialPreviewContent => {
  const normalizedHandle = normalizeHandle(channel.handle);
  const encodedHandle = encodeURIComponent(normalizedHandle);
  const pageUrl = `${PRODUCTION_ORIGIN}/channel/${encodedHandle}`;
  const progress = getPlayButtonProgress(channel);
  const description = getChannelDescription(
    channel,
    normalizedHandle,
    progress
  );

  return {
    description,
    imageAlt: description,
    imageUrl: `${pageUrl}/og.png`,
    pageUrl,
    title: `${channel.channelName} (@${normalizedHandle}) | ${progress.playButton.name} Progress`,
  };
};

const getChannelDescription = (
  channel: SocialPreviewChannel,
  normalizedHandle: string,
  progress: PlayButtonProgressProjection
): string => {
  const channelIdentity = `${channel.channelName} (@${normalizedHandle})`;

  if (progress.state === "all-milestones-reached") {
    return `${channelIdentity} has reached every tracked play button milestone on Play Button Tracker.`;
  }

  const subscriberCountLabel = progress.current.subscriberCountLabel;
  const remainingSubscriberCount = progress.remaining.subscriberCount;

  if (
    progress.state === "unavailable" ||
    subscriberCountLabel === null ||
    remainingSubscriberCount === null
  ) {
    return `Track ${channelIdentity} on Play Button Tracker and see progress toward the ${progress.playButton.name}.`;
  }

  return `${channelIdentity} has ${subscriberCountLabel} subscribers and needs ${COMPACT_NUMBER_FORMATTER.format(remainingSubscriberCount)} more for the ${progress.playButton.name}.`;
};

const normalizeHandle = (handle: string): string =>
  handle.trim().replace(LEADING_AT_REGEX, "").toLowerCase();
