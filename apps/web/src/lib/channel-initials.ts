const WHITESPACE_REGEX = /\s+/;

export const getChannelInitials = (channelName: string): string => {
  const letters = channelName
    .split(WHITESPACE_REGEX)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "");

  return letters.join("") || "?";
};
