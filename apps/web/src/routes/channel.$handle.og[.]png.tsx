import { createFileRoute } from "@tanstack/react-router";
import { socialPreview } from "@/lib/social-preview.server";

interface ChannelOgRequest {
  handle: string;
  requestUrl: string;
}

const getChannelOgHeadResponse = async (
  request: ChannelOgRequest
): Promise<Response> => {
  const response = await socialPreview.getOpenGraph(request);

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
        socialPreview.getOpenGraph({
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
