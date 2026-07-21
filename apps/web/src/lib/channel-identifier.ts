const CHANNEL_ID_REGEX = /^UC[A-Za-z0-9_-]{22}$/;
const DIRECT_HANDLE_REGEX = /^@?[A-Za-z0-9._-]+$/;
const LEADING_AT_REGEX = /^@/;

export const extractChannelIdentifier = (value: string): string | null => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (DIRECT_HANDLE_REGEX.test(trimmedValue)) {
    return trimmedValue.replace(LEADING_AT_REGEX, "");
  }

  const normalizedValue = trimmedValue.startsWith("http")
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const url = new URL(normalizedValue);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const handleSegment = pathSegments.find((segment) =>
      segment.startsWith("@")
    );

    if (handleSegment && handleSegment.length > 1) {
      return handleSegment.slice(1);
    }

    const channelId = pathSegments[0] === "channel" ? pathSegments[1] : null;
    return channelId && CHANNEL_ID_REGEX.test(channelId) ? channelId : null;
  } catch {
    return null;
  }
};
