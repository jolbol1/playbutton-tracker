import { ImageResponse } from "@takumi-rs/image-response/wasm";
import module from "@takumi-rs/wasm/next";
import { createFileRoute } from "@tanstack/react-router";
import {
  CHANNEL_OG_IMAGE_CONTENT_TYPE,
  CHANNEL_OG_IMAGE_SIZE,
  ChannelOgImage,
} from "@/lib/channel-og";
import { ViewStatsError } from "@/utils/channel-schema";
import { getLegacyViewStatsChannelSnapshot } from "@/utils/channel-snapshot.server";

const CACHE_CONTROL_HEADER =
  "public, max-age=900, s-maxage=900, stale-while-revalidate=86400";
const INTER_FONT_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@5.2.8/files/inter-latin-wght-normal.woff2";
const FONT_REQUEST_TIMEOUT_MS = 10_000;
const OG_FONT_NAME = "Inter Variable";

const interFontDataPromises = new Map<string, Promise<ArrayBuffer>>();

const loadInterFontData = async (fontUrl: string): Promise<ArrayBuffer> => {
  const response = await fetch(fontUrl, {
    signal: AbortSignal.timeout(FONT_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Failed to load OG font asset: ${response.status}`);
  }

  return await response.arrayBuffer();
};

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return { value: error };
};

const getInterFontData = async (): Promise<ArrayBuffer> => {
  const fontUrl = INTER_FONT_URL;
  const existingPromise = interFontDataPromises.get(fontUrl);

  if (existingPromise !== undefined) {
    return await existingPromise;
  }

  const fontDataPromise = loadInterFontData(fontUrl);

  interFontDataPromises.set(fontUrl, fontDataPromise);

  try {
    return await fontDataPromise;
  } catch (error) {
    if (interFontDataPromises.get(fontUrl) === fontDataPromise) {
      interFontDataPromises.delete(fontUrl);
    }

    throw error;
  }
};

const getStaticOgImageResponse = (
  requestUrl: string,
  status: number
): Response => {
  return Response.redirect(new URL("/og.png", requestUrl), status);
};

interface ChannelOgRequest {
  handle: string;
  requestUrl: string;
}

const getChannelOgImageResponse = async ({
  handle,
  requestUrl,
}: ChannelOgRequest): Promise<Response> => {
  const startedAt = Date.now();

  try {
    const [fontData, snapshot] = await Promise.all([
      getInterFontData(),
      getLegacyViewStatsChannelSnapshot(handle),
    ]);

    return new ImageResponse(<ChannelOgImage snapshot={snapshot} />, {
      ...CHANNEL_OG_IMAGE_SIZE,
      format: "png",
      fonts: [
        {
          data: fontData,
          name: OG_FONT_NAME,
          style: "normal",
          weight: 400,
        },
      ],
      headers: {
        "Cache-Control": CACHE_CONTROL_HEADER,
        "Content-Type": CHANNEL_OG_IMAGE_CONTENT_TYPE,
      },
      module,
    });
  } catch (error) {
    if (error instanceof ViewStatsError && error.status === 404) {
      const details = {
        error: getErrorDetails(error),
        fallback: "/og.png",
        fontUrl: INTER_FONT_URL,
        handle,
        ok: false,
        reason: "channel_not_found",
        requestUrl,
        tookMs: Date.now() - startedAt,
      };

      console.warn(
        "OG image channel not found, falling back to static image",
        details
      );

      return getStaticOgImageResponse(requestUrl, 307);
    }

    const details = {
      error: getErrorDetails(error),
      fallback: "/og.png",
      fontUrl: INTER_FONT_URL,
      handle,
      ok: false,
      reason: "generation_failed",
      requestUrl,
      tookMs: Date.now() - startedAt,
    };

    console.error(
      "Channel og:image generation failed, falling back to static image",
      details
    );

    return getStaticOgImageResponse(requestUrl, 307);
  }
};

const getChannelOgHeadResponse = async (
  request: ChannelOgRequest
): Promise<Response> => {
  const response = await getChannelOgImageResponse(request);

  return new Response(null, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
};

export const Route = createFileRoute("/channel/$handle/og.png")({
  server: {
    handlers: {
      GET: ({ params, request }) =>
        getChannelOgImageResponse({
          handle: params.handle,
          requestUrl: request.url,
        }),
      HEAD: ({ params, request }) =>
        getChannelOgHeadResponse({
          handle: params.handle,
          requestUrl: request.url,
        }),
    },
  },
});
