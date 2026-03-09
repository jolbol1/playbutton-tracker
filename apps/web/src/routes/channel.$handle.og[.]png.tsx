import interLatinFontUrl from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import { ImageResponse } from "@takumi-rs/image-response/wasm";
import module from "@takumi-rs/wasm/next";
import { createFileRoute } from "@tanstack/react-router";
import {
  CHANNEL_OG_IMAGE_CONTENT_TYPE,
  CHANNEL_OG_IMAGE_SIZE,
  ChannelOgImage,
} from "@/lib/channel-og";
import { ViewStatsError } from "@/utils/channel-schema";
import { getChannelSnapshot } from "@/utils/channel-snapshot.server";

const CACHE_CONTROL_HEADER =
  "public, max-age=900, s-maxage=900, stale-while-revalidate=86400";
const OG_FONT_NAME = "Inter Variable";

const interFontDataPromises = new Map<string, Promise<ArrayBuffer>>();

const getInterFontData = (requestUrl: string): Promise<ArrayBuffer> => {
  const fontUrl = new URL(interLatinFontUrl, requestUrl).toString();
  const existingPromise = interFontDataPromises.get(fontUrl);

  if (existingPromise !== undefined) {
    return existingPromise;
  }

  const fontDataPromise = fetch(fontUrl).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load OG font asset: ${response.status}`);
    }

    return response.arrayBuffer();
  });

  interFontDataPromises.set(fontUrl, fontDataPromise);
  return fontDataPromise;
};

const getStaticOgImageResponse = (
  requestUrl: string,
  status: number
): Response => {
  return Response.redirect(new URL("/og.png", requestUrl), status);
};

export const Route = createFileRoute("/channel/$handle/og.png")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const [fontData, snapshot] = await Promise.all([
            getInterFontData(request.url),
            getChannelSnapshot(params.handle),
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
            return getStaticOgImageResponse(request.url, 307);
          }

          console.error("Channel og:image generation failed", {
            error,
            handle: params.handle,
          });

          return getStaticOgImageResponse(request.url, 307);
        }
      },
    },
  },
});
