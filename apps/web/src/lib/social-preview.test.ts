import { describe, expect, it } from "bun:test";

import { getSocialPreviewMetadata } from "./social-preview";

const ordinaryChannel = {
  avatarUrl: null,
  capturedAt: "2026-07-21T00:05:00.000Z",
  channelName: "Better Stack",
  handle: "betterstack",
  subscriberCount: 90_000,
  subsGained7Day: 700,
  subsGained28Day: 2800,
};

describe("getSocialPreviewMetadata", () => {
  it("produces complete default-page metadata", () => {
    expect(getSocialPreviewMetadata({ page: "default" })).toEqual({
      links: [
        {
          href: "https://www.playbuttontracker.com/",
          rel: "canonical",
        },
      ],
      meta: [
        {
          title: "Play Button Tracker",
        },
        {
          content:
            "Track YouTube channel subscriber progress toward creator awards, estimate milestone timelines, and view recent growth trends.",
          name: "description",
        },
        {
          content: "website",
          property: "og:type",
        },
        {
          content: "Play Button Tracker",
          property: "og:title",
        },
        {
          content:
            "Track YouTube channel subscriber progress toward creator awards, estimate milestone timelines, and view recent growth trends.",
          property: "og:description",
        },
        {
          content: "https://www.playbuttontracker.com/og.png",
          property: "og:image",
        },
        {
          content: "Play Button Tracker social preview",
          property: "og:image:alt",
        },
        {
          content: "https://www.playbuttontracker.com/",
          property: "og:url",
        },
        {
          content: "summary_large_image",
          name: "twitter:card",
        },
        {
          content: "Play Button Tracker",
          name: "twitter:title",
        },
        {
          content:
            "Track YouTube channel subscriber progress toward creator awards, estimate milestone timelines, and view recent growth trends.",
          name: "twitter:description",
        },
        {
          content: "https://www.playbuttontracker.com/og.png",
          name: "twitter:image",
        },
        {
          content: "Play Button Tracker social preview",
          name: "twitter:image:alt",
        },
      ],
    });
  });

  it("describes ordinary Channel progress from the shared projection", () => {
    const metadata = getSocialPreviewMetadata({
      channel: ordinaryChannel,
      page: "channel",
    });

    expect(metadata.links).toEqual([
      {
        href: "https://www.playbuttontracker.com/channel/betterstack",
        rel: "canonical",
      },
    ]);
    expect(readMeta(metadata.meta, "title")).toBe(
      "Better Stack (@betterstack) | Silver Play Button Progress"
    );
    expect(readMeta(metadata.meta, "description")).toBe(
      "Better Stack (@betterstack) has 90K subscribers and needs 10K more for the Silver Play Button."
    );
  });

  it("describes unavailable subscriber data without treating it as zero", () => {
    const metadata = getSocialPreviewMetadata({
      channel: {
        ...ordinaryChannel,
        subscriberCount: null,
      },
      page: "channel",
    });

    expect(readMeta(metadata.meta, "title")).toBe(
      "Better Stack (@betterstack) | Silver Play Button Progress"
    );
    expect(readMeta(metadata.meta, "description")).toBe(
      "Track Better Stack (@betterstack) on Play Button Tracker and see progress toward the Silver Play Button."
    );
  });

  it("describes completion of the final tracked award", () => {
    const metadata = getSocialPreviewMetadata({
      channel: {
        ...ordinaryChannel,
        subscriberCount: 100_000_000,
      },
      page: "channel",
    });

    expect(readMeta(metadata.meta, "title")).toBe(
      "Better Stack (@betterstack) | Red Diamond Play Button Progress"
    );
    expect(readMeta(metadata.meta, "description")).toBe(
      "Better Stack (@betterstack) has reached every tracked play button milestone on Play Button Tracker."
    );
  });

  it("normalizes and encodes special-character handles in canonical and image URLs", () => {
    const metadata = getSocialPreviewMetadata({
      channel: {
        ...ordinaryChannel,
        handle: "  @@Crème & Co  ",
      },
      page: "channel",
    });

    expect(metadata.links).toEqual([
      {
        href: "https://www.playbuttontracker.com/channel/cr%C3%A8me%20%26%20co",
        rel: "canonical",
      },
    ]);
    expect(readMeta(metadata.meta, "title")).toBe(
      "Better Stack (@crème & co) | Silver Play Button Progress"
    );
    expect(readMeta(metadata.meta, "og:image")).toBe(
      "https://www.playbuttontracker.com/channel/cr%C3%A8me%20%26%20co/og.png"
    );
  });

  it("keeps complete Open Graph and Twitter fields in parity", () => {
    const metadata = getSocialPreviewMetadata({
      channel: ordinaryChannel,
      page: "channel",
    });

    expect(readMeta(metadata.meta, "og:title")).toBe(
      readMeta(metadata.meta, "twitter:title")
    );
    expect(readMeta(metadata.meta, "og:description")).toBe(
      readMeta(metadata.meta, "twitter:description")
    );
    expect(readMeta(metadata.meta, "og:image")).toBe(
      readMeta(metadata.meta, "twitter:image")
    );
    expect(readMeta(metadata.meta, "og:image:alt")).toBe(
      "Better Stack (@betterstack) has 90K subscribers and needs 10K more for the Silver Play Button."
    );
    expect(readMeta(metadata.meta, "twitter:image:alt")).toBe(
      readMeta(metadata.meta, "og:image:alt")
    );
  });
});

type MetaEntry =
  | { content: string; name: string }
  | { content: string; property: string }
  | { title: string };

const readMeta = (meta: readonly MetaEntry[], key: string): string => {
  const entry = meta.find((candidate) => {
    if ("title" in candidate) {
      return key === "title";
    }

    return (
      ("name" in candidate && candidate.name === key) ||
      ("property" in candidate && candidate.property === key)
    );
  });

  if (entry === undefined) {
    throw new Error(`Missing metadata entry: ${key}`);
  }

  return "title" in entry ? entry.title : entry.content;
};
