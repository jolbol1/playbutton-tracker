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

const getInterFontData = (requestUrl: string): Promise<ArrayBuffer> => {
  const fontUrl = new URL(interLatinFontUrl, requestUrl).toString();
  const existingPromise = interFontDataPromises.get(fontUrl);

  if (existingPromise !== undefined) {
    console.info("OG image font cache hit", { fontUrl });
    return existingPromise;
  }

  const fontDataPromise = fetch(fontUrl).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load OG font asset: ${response.status}`);
    }

    return response.arrayBuffer();
  });

  interFontDataPromises.set(fontUrl, fontDataPromise);
  console.info("OG image font fetch started", { fontUrl });
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
        const startedAt = Date.now();

        console.info("OG image request started", {
          handle: params.handle,
          requestUrl: request.url,
        });

        try {
          const [fontData, snapshot] = await Promise.all([
            getInterFontData(request.url),
            getChannelSnapshot(params.handle),
          ]);

          console.info("OG image data loaded", {
            fontBytes: fontData.byteLength,
            handle: params.handle,
            requestUrl: request.url,
            resolvedHandle: snapshot.handle,
            subscriberCount: snapshot.subscriberCount,
            tookMs: Date.now() - startedAt,
          });

          const response = new ImageResponse(
            <ChannelOgImage snapshot={snapshot} />,
            {
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
            }
          );

          console.info("OG image response generated", {
            handle: params.handle,
            requestUrl: request.url,
            tookMs: Date.now() - startedAt,
          });

          return response;
        } catch (error) {
          if (error instanceof ViewStatsError && error.status === 404) {
            console.warn(
              "OG image channel not found, falling back to static image",
              {
                error: getErrorDetails(error),
                handle: params.handle,
                requestUrl: request.url,
                tookMs: Date.now() - startedAt,
              }
            );
            return getStaticOgImageResponse(request.url, 307);
          }

          console.error(
            "Channel og:image generation failed, falling back to static image",
            {
              error: getErrorDetails(error),
              handle: params.handle,
              requestUrl: request.url,
              tookMs: Date.now() - startedAt,
            }
          );

          return getStaticOgImageResponse(request.url, 307);
        }
      },
    },
  },
});
