import { createFileRoute } from "@tanstack/react-router";
import { socialPreview } from "@/lib/social-preview.server";

export const Route = createFileRoute("/channel/$handle/og.png")({
  server: {
    handlers: {
      GET: ({ params, request }) =>
        socialPreview.getOpenGraph({
          handle: params.handle,
          requestUrl: request.url,
        }),
      HEAD: ({ params, request }) =>
        socialPreview.getOpenGraphHead({
          handle: params.handle,
          requestUrl: request.url,
        }),
    },
  },
});
