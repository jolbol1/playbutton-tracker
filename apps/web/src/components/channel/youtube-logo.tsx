interface YouTubeLogoProps {
  className?: string;
}

export function YouTubeLogo({ className }: YouTubeLogoProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 28 20"
    >
      <rect fill="currentColor" height="20" rx="5" width="28" />
      <path d="M11 6L19 10L11 14V6Z" fill="white" />
    </svg>
  );
}
