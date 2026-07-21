import { describe, expect, it, mock } from "bun:test";
import { file } from "bun";
import { getSocialPreviewMetadata } from "./social-preview";
import { createSocialPreview } from "./social-preview-open-graph";

const OPEN_GRAPH_IMAGE_HEIGHT = 630;
const OPEN_GRAPH_IMAGE_WIDTH = 1200;
const PNG_HEIGHT_BYTE_OFFSET = 20;
const PNG_WIDTH_BYTE_OFFSET = 16;
const TEMPORARY_REDIRECT_STATUS = 307;
const TEST_FONT_URL = new URL(
  "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  import.meta.url
);
const TEST_WASM_URL = new URL(
  "../../node_modules/@takumi-rs/wasm/pkg/takumi_wasm_bg.wasm",
  import.meta.url
);
const testWasmModule = await WebAssembly.compile(
  await file(TEST_WASM_URL).arrayBuffer()
);

mock.module("@takumi-rs/wasm/next", () => ({ default: testWasmModule }));

const loadTestFont = async (): Promise<ArrayBuffer> =>
  await file(TEST_FONT_URL).arrayBuffer();

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

describe("Social Preview Open Graph GET", () => {
  it("delivers a cached 1200 by 630 PNG for a Channel Snapshot", async () => {
    const socialPreview = createSocialPreview({
      getChannelSnapshot: async () => ({
        snapshot: ordinaryChannel,
        status: "success",
      }),
      loadFont: loadTestFont,
      now: () => 100,
      reportDiagnostic: () => undefined,
    });

    const response = await socialPreview.getOpenGraph({
      handle: "betterstack",
      requestUrl:
        "https://www.playbuttontracker.com/channel/betterstack/og.png",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=900, s-maxage=900, stale-while-revalidate=86400"
    );

    const image = new DataView(await response.arrayBuffer());
    expect(image.getUint32(PNG_WIDTH_BYTE_OFFSET)).toBe(OPEN_GRAPH_IMAGE_WIDTH);
    expect(image.getUint32(PNG_HEIGHT_BYTE_OFFSET)).toBe(
      OPEN_GRAPH_IMAGE_HEIGHT
    );
  });

  it("classifies a missing channel and redirects to the static preview", async () => {
    const diagnostics: unknown[] = [];
    let fontLoadCount = 0;
    const socialPreview = createSocialPreview({
      getChannelSnapshot: async () => ({
        reason: "not-found",
        status: "failure",
      }),
      loadFont: () => {
        fontLoadCount += 1;
        return Promise.resolve(new ArrayBuffer(0));
      },
      now: () => 125,
      reportDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    });

    const response = await socialPreview.getOpenGraph({
      handle: "missing-channel",
      requestUrl:
        "https://www.playbuttontracker.com/channel/missing-channel/og.png",
    });

    expect(response.status).toBe(TEMPORARY_REDIRECT_STATUS);
    expect(response.headers.get("Location")).toBe(
      "https://www.playbuttontracker.com/og.png"
    );
    expect(fontLoadCount).toBe(0);
    expect(diagnostics).toEqual([
      {
        cause: { reason: "not-found", status: "failure" },
        fallback: "/og.png",
        fontUrl:
          "https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@5.2.8/files/inter-latin-wght-normal.woff2",
        handle: "missing-channel",
        ok: false,
        reason: "channel_not_found",
        requestUrl:
          "https://www.playbuttontracker.com/channel/missing-channel/og.png",
        tookMs: 0,
      },
    ]);
  });

  it("classifies a general snapshot failure and redirects to the static preview", async () => {
    const diagnostics: Array<{ reason: string }> = [];
    const socialPreview = createSocialPreview({
      getChannelSnapshot: async () => ({
        reason: "timeout",
        status: "failure",
      }),
      loadFont: async () => new ArrayBuffer(0),
      now: () => 200,
      reportDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    });

    const response = await socialPreview.getOpenGraph({
      handle: "slow-channel",
      requestUrl:
        "https://www.playbuttontracker.com/channel/slow-channel/og.png",
    });

    expect(response.status).toBe(TEMPORARY_REDIRECT_STATUS);
    expect(response.headers.get("Location")).toBe(
      "https://www.playbuttontracker.com/og.png"
    );
    expect(diagnostics.map(({ reason }) => reason)).toEqual([
      "generation_failed",
    ]);
  });

  it("evicts a rejected font promise so a later request can retry", async () => {
    const diagnostics: Array<{ reason: string }> = [];
    let fontLoadCount = 0;
    const socialPreview = createSocialPreview({
      getChannelSnapshot: async () => ({
        snapshot: ordinaryChannel,
        status: "success",
      }),
      loadFont: async () => {
        fontLoadCount += 1;

        if (fontLoadCount === 1) {
          throw new Error("Font CDN unavailable");
        }

        return await loadTestFont();
      },
      now: () => 300,
      reportDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    });
    const request = {
      handle: "betterstack",
      requestUrl:
        "https://www.playbuttontracker.com/channel/betterstack/og.png",
    };

    const failedResponse = await socialPreview.getOpenGraph(request);
    const retriedResponse = await socialPreview.getOpenGraph(request);

    expect(failedResponse.status).toBe(TEMPORARY_REDIRECT_STATUS);
    expect(retriedResponse.status).toBe(200);
    expect(fontLoadCount).toBe(2);
    expect(diagnostics.map(({ reason }) => reason)).toEqual([
      "generation_failed",
    ]);
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
