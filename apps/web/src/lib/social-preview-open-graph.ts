import type {
  ChannelSnapshot,
  ChannelSnapshotOutcome,
} from "../utils/channel-snapshot";
import {
  getPlayButtonProgress,
  type PlayButtonProgressProjection,
} from "./play-button-progress";
import {
  getSocialPreviewMetadata,
  type SocialPreview,
  type SocialPreviewOpenGraphRequest,
} from "./social-preview";

const OPEN_GRAPH_CACHE_CONTROL =
  "public, max-age=900, s-maxage=900, stale-while-revalidate=86400";
const OPEN_GRAPH_FALLBACK_PATH = "/og.png";
const OPEN_GRAPH_FONT_NAME = "Inter Variable";
const OPEN_GRAPH_FONT_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@5.2.8/files/inter-latin-wght-normal.woff2";
const OPEN_GRAPH_IMAGE_CONTENT_TYPE = "image/png";
const OPEN_GRAPH_IMAGE_SIZE = {
  height: 630,
  width: 1200,
} as const;
const OPEN_GRAPH_IMAGE_HEADERS = {
  "Cache-Control": OPEN_GRAPH_CACHE_CONTROL,
  "Content-Type": OPEN_GRAPH_IMAGE_CONTENT_TYPE,
  "X-Image-Height": `${OPEN_GRAPH_IMAGE_SIZE.height}`,
  "X-Image-Width": `${OPEN_GRAPH_IMAGE_SIZE.width}`,
} as const;
const TEMPORARY_REDIRECT_STATUS = 307;

export interface SocialPreviewOpenGraphDiagnostic {
  cause: unknown;
  fallback: typeof OPEN_GRAPH_FALLBACK_PATH;
  fontUrl: typeof OPEN_GRAPH_FONT_URL;
  handle: string;
  ok: false;
  reason: "channel_not_found" | "generation_failed";
  requestUrl: string;
  tookMs: number;
}

interface CreateSocialPreviewOptions {
  getChannelSnapshot: (identifier: string) => Promise<ChannelSnapshotOutcome>;
  loadFont: (fontUrl: string) => Promise<ArrayBuffer>;
  now: () => number;
  reportDiagnostic: (diagnostic: SocialPreviewOpenGraphDiagnostic) => void;
}

type OpenGraphSnapshotResolution =
  | { response: Response; status: "failure" }
  | { snapshot: ChannelSnapshot; status: "success" };

export const createSocialPreview = ({
  getChannelSnapshot,
  loadFont,
  now,
  reportDiagnostic,
}: CreateSocialPreviewOptions): SocialPreview => {
  let fontDataPromise: Promise<ArrayBuffer> | undefined;

  const getFontData = async (): Promise<ArrayBuffer> => {
    if (fontDataPromise === undefined) {
      fontDataPromise = loadFont(OPEN_GRAPH_FONT_URL);
    }

    const currentFontDataPromise = fontDataPromise;

    try {
      return await currentFontDataPromise;
    } catch (error) {
      if (fontDataPromise === currentFontDataPromise) {
        fontDataPromise = undefined;
      }

      throw error;
    }
  };

  const createFailureResponse = ({
    cause,
    handle,
    reason,
    requestUrl,
    startedAt,
  }: {
    cause: unknown;
    handle: string;
    reason: SocialPreviewOpenGraphDiagnostic["reason"];
    requestUrl: string;
    startedAt: number;
  }): Response => {
    reportDiagnostic({
      cause,
      fallback: OPEN_GRAPH_FALLBACK_PATH,
      fontUrl: OPEN_GRAPH_FONT_URL,
      handle,
      ok: false,
      reason,
      requestUrl,
      tookMs: now() - startedAt,
    });

    return createStaticOpenGraphRedirectResponse(requestUrl);
  };

  const resolveOpenGraphSnapshot = async (
    { handle, requestUrl }: SocialPreviewOpenGraphRequest,
    startedAt: number
  ): Promise<OpenGraphSnapshotResolution> => {
    try {
      const outcome = await getChannelSnapshot(handle);

      if (outcome.status === "success") {
        return outcome;
      }

      const reason =
        outcome.reason === "not-found"
          ? "channel_not_found"
          : "generation_failed";

      return {
        response: createFailureResponse({
          cause: outcome,
          handle,
          reason,
          requestUrl,
          startedAt,
        }),
        status: "failure",
      };
    } catch (error) {
      return {
        response: createFailureResponse({
          cause: error,
          handle,
          reason: "generation_failed",
          requestUrl,
          startedAt,
        }),
        status: "failure",
      };
    }
  };

  const getOpenGraph = async (
    request: SocialPreviewOpenGraphRequest
  ): Promise<Response> => {
    const startedAt = now();
    const resolution = await resolveOpenGraphSnapshot(request, startedAt);

    if (resolution.status === "failure") {
      return resolution.response;
    }

    try {
      const progress = getPlayButtonProgress(resolution.snapshot);
      const fontData = await getFontData();

      return await renderOpenGraphImage(
        resolution.snapshot,
        progress,
        fontData
      );
    } catch (error) {
      return createFailureResponse({
        cause: error,
        handle: request.handle,
        reason: "generation_failed",
        requestUrl: request.requestUrl,
        startedAt,
      });
    }
  };

  const getOpenGraphHead = async (
    request: SocialPreviewOpenGraphRequest
  ): Promise<Response> => {
    const startedAt = now();
    const resolution = await resolveOpenGraphSnapshot(request, startedAt);

    if (resolution.status === "failure") {
      return resolution.response;
    }

    return new Response(null, {
      headers: OPEN_GRAPH_IMAGE_HEADERS,
    });
  };

  return {
    getMetadata: getSocialPreviewMetadata,
    getOpenGraph,
    getOpenGraphHead,
  };
};

const renderOpenGraphImage = async (
  snapshot: ChannelSnapshot,
  progress: PlayButtonProgressProjection,
  fontData: ArrayBuffer
): Promise<Response> => {
  const [
    { ImageResponse },
    { default: importedWasmModule },
    { ChannelOgImage },
    React,
  ] = await Promise.all([
    import("@takumi-rs/image-response/wasm"),
    import("@takumi-rs/wasm/next"),
    import("./channel-og"),
    import("react"),
  ]);
  const wasmModule: unknown = importedWasmModule;

  if (!(wasmModule instanceof WebAssembly.Module)) {
    throw new Error("Open Graph renderer did not load a WebAssembly module");
  }

  return new ImageResponse(
    React.createElement(ChannelOgImage, { progress, snapshot }),
    {
      ...OPEN_GRAPH_IMAGE_SIZE,
      fonts: [
        {
          data: fontData,
          name: OPEN_GRAPH_FONT_NAME,
          style: "normal",
          weight: 400,
        },
      ],
      format: "png",
      headers: OPEN_GRAPH_IMAGE_HEADERS,
      module: wasmModule,
    }
  );
};

const createStaticOpenGraphRedirectResponse = (requestUrl: string): Response =>
  Response.redirect(
    new URL(OPEN_GRAPH_FALLBACK_PATH, requestUrl),
    TEMPORARY_REDIRECT_STATUS
  );
