import { getChannelSnapshot } from "@/utils/channel-snapshot.server";
import {
  createSocialPreview,
  type SocialPreviewOpenGraphDiagnostic,
} from "./social-preview-open-graph";

const FONT_REQUEST_TIMEOUT_MS = 10_000;

const loadFontFromCdn = async (fontUrl: string): Promise<ArrayBuffer> => {
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

const reportOpenGraphDiagnostic = (
  diagnostic: SocialPreviewOpenGraphDiagnostic
): void => {
  const { cause, ...details } = diagnostic;
  const reportedDetails = {
    ...details,
    error: getErrorDetails(cause),
  };

  if (diagnostic.reason === "channel_not_found") {
    console.warn(
      "OG image channel not found, falling back to static image",
      reportedDetails
    );
    return;
  }

  console.error(
    "Channel og:image generation failed, falling back to static image",
    reportedDetails
  );
};

export const socialPreview = createSocialPreview({
  getChannelSnapshot,
  loadFont: loadFontFromCdn,
  now: Date.now,
  reportDiagnostic: reportOpenGraphDiagnostic,
});
