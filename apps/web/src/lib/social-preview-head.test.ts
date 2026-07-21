import { describe, expect, it, mock } from "bun:test";

let renderCount = 0;
const emptyWasmModule = new WebAssembly.Module(
  new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])
);

mock.module("@takumi-rs/image-response/wasm", () => ({
  ImageResponse: class extends Response {
    constructor() {
      renderCount += 1;
      super(new Uint8Array());
    }
  },
}));
mock.module("@takumi-rs/wasm/next", () => ({ default: emptyWasmModule }));

const { createSocialPreview } = await import("./social-preview-open-graph");

const ordinaryChannel = {
  avatarUrl: null,
  capturedAt: "2026-07-21T00:05:00.000Z",
  channelName: "Better Stack",
  handle: "betterstack",
  subscriberCount: 90_000,
  subsGained7Day: 700,
  subsGained28Day: 2800,
};

describe("Social Preview Open Graph HEAD", () => {
  it("returns cached PNG metadata without a body, font load, or render", async () => {
    let fontLoadCount = 0;
    const socialPreview = createSocialPreview({
      getChannelSnapshot: async () => ({
        snapshot: ordinaryChannel,
        status: "success",
      }),
      loadFont: () => {
        fontLoadCount += 1;
        return Promise.resolve(new ArrayBuffer(0));
      },
      now: () => 100,
      reportDiagnostic: () => undefined,
    });

    const response = await socialPreview.getOpenGraphHead({
      handle: "betterstack",
      requestUrl:
        "https://www.playbuttontracker.com/channel/betterstack/og.png",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=900, s-maxage=900, stale-while-revalidate=86400"
    );
    expect(response.headers.get("X-Image-Width")).toBe("1200");
    expect(response.headers.get("X-Image-Height")).toBe("630");
    expect((await response.arrayBuffer()).byteLength).toBe(0);
    expect(fontLoadCount).toBe(0);
    expect(renderCount).toBe(0);
  });

  it("classifies a missing channel without a body, font load, or render", async () => {
    const diagnostics: unknown[] = [];
    let fontLoadCount = 0;
    const renderCountBeforeRequest = renderCount;
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

    const response = await socialPreview.getOpenGraphHead({
      handle: "missing-channel",
      requestUrl:
        "https://www.playbuttontracker.com/channel/missing-channel/og.png",
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(
      "https://www.playbuttontracker.com/og.png"
    );
    expect((await response.arrayBuffer()).byteLength).toBe(0);
    expect(fontLoadCount).toBe(0);
    expect(renderCount).toBe(renderCountBeforeRequest);
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
});
