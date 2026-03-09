import type { CSSProperties, ReactNode } from "react";
import {
  createPrediction,
  formatCompactNumber,
  getInitials,
  getTrackedPlayButton,
} from "@/lib/channel-helpers";
import type { ViewStatsChannelSnapshot } from "@/utils/channel-schema";

const SITE_URL = "https://www.playbuttontracker.com";
const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");
const LEADING_AT_REGEX = /^@+/;

const COLORS = {
  accent: "#ff0000",
  backgroundEnd: "#09090b",
  backgroundStart: "#18181b",
  border: "rgba(255, 255, 255, 0.1)",
  card: "#27272a",
  cardMuted: "#18181b",
  foreground: "#fafafa",
  muted: "#a1a1aa",
} as const;

export const CHANNEL_OG_IMAGE_ALT = "Play Button Tracker channel share preview";
export const CHANNEL_OG_IMAGE_CONTENT_TYPE = "image/png";
export const CHANNEL_OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;

export function getDefaultOgImageUrl(origin?: string): string {
  return `${getBaseUrl(origin)}/og.png`;
}

export function getChannelPageUrl(handle: string, origin?: string): string {
  const normalizedHandle = normalizeHandle(handle);
  return `${getBaseUrl(origin)}/channel/${encodeURIComponent(normalizedHandle)}`;
}

export function getChannelOgImageUrl(handle: string, origin?: string): string {
  return `${getChannelPageUrl(handle, origin)}/og.png`;
}

export function getChannelSeoMeta(
  snapshot: ViewStatsChannelSnapshot,
  origin?: string
): {
  description: string;
  imageUrl: string;
  pageUrl: string;
  title: string;
} {
  const normalizedHandle = normalizeHandle(snapshot.handle);
  const trackedPlayButton = getTrackedPlayButton(snapshot.subscriberCount);

  return {
    description: getChannelSeoDescription(snapshot),
    imageUrl: getChannelOgImageUrl(normalizedHandle, origin),
    pageUrl: getChannelPageUrl(normalizedHandle, origin),
    title: `${snapshot.channelName} (@${normalizedHandle}) | ${trackedPlayButton.name} Progress`,
  };
}

export function ChannelOgImage({
  snapshot,
}: {
  snapshot: ViewStatsChannelSnapshot;
}) {
  const normalizedHandle = normalizeHandle(snapshot.handle);
  const trackedPlayButton = getTrackedPlayButton(snapshot.subscriberCount);
  const currentSubscribers = snapshot.subscriberCount;
  const remainingSubscribers =
    currentSubscribers === null
      ? null
      : Math.max(trackedPlayButton.threshold - currentSubscribers, 0);
  const hasReachedAllMilestones =
    trackedPlayButton.variant === "red-diamond" && remainingSubscribers === 0;
  const progressPercentage =
    currentSubscribers === null
      ? 0
      : Math.min((currentSubscribers / trackedPlayButton.threshold) * 100, 100);
  const predictions = [
    createPrediction(snapshot, trackedPlayButton, 7, "7 day trend"),
    createPrediction(snapshot, trackedPlayButton, 28, "28 day trend"),
  ];

  const subscriberCountLabel =
    currentSubscribers === null
      ? "Subscriber count unavailable"
      : `${NUMBER_FORMATTER.format(currentSubscribers)} subscribers`;
  let heroTitle = `Tracking progress to ${trackedPlayButton.name}`;
  let heroSubtitle =
    "Subscriber count is currently unavailable, but recent trend data is still shown below.";

  if (hasReachedAllMilestones) {
    heroTitle = "All tracked play buttons unlocked";
    heroSubtitle =
      "This channel has already reached the final tracked milestone.";
  } else if (remainingSubscribers !== null) {
    heroTitle = `${formatCompactNumber(remainingSubscribers)} subscribers to ${
      trackedPlayButton.name
    }`;
    heroSubtitle = `Currently ${progressPercentage.toFixed(1)}% of the way to ${NUMBER_FORMATTER.format(
      trackedPlayButton.threshold
    )}.`;
  }

  return (
    <OgFrame>
      <div style={styles.panel}>
        <div style={styles.panelTopContent}>
          <div style={styles.panelHeader}>
            <div style={styles.profileRow}>
              <Avatar
                fallback={getInitials(snapshot.channelName)}
                src={snapshot.avatarUrl}
              />
              <div style={styles.profileText}>
                <div style={styles.channelName}>{snapshot.channelName}</div>
                <div style={styles.handle}>@{normalizedHandle}</div>
              </div>
            </div>
            <MetricBadge label="Subscribers" value={subscriberCountLabel} />
          </div>

          <div style={styles.heroSection}>
            <div style={styles.heroCopy}>
              <div style={styles.heroLabel}>{trackedPlayButton.name}</div>
              <div style={styles.heroTitle}>{heroTitle}</div>
              <div style={styles.heroSubtitle}>{heroSubtitle}</div>
            </div>
            <div
              style={{
                ...styles.playButtonCard,
                background: trackedPlayButton.buttonColor,
                color:
                  trackedPlayButton.variant === "diamond" ? "#111827" : "#fff",
              }}
            >
              <div style={styles.playButtonCardLabel}>Next award</div>
              <div style={styles.playButtonCardTitle}>
                {trackedPlayButton.name}
              </div>
              <div style={styles.playButtonCardValue}>
                {NUMBER_FORMATTER.format(trackedPlayButton.threshold)}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.metricsRow}>
          {predictions.map((prediction) => {
            return (
              <PredictionCard
                key={prediction.period}
                label={prediction.period}
                primaryValue={prediction.dailyGrowthLabel}
                secondaryValue={prediction.daysToGoalLabel}
                tertiaryValue={prediction.estimatedDateLabel}
              />
            );
          })}
        </div>
      </div>
    </OgFrame>
  );
}

function Avatar({ fallback, src }: { fallback: string; src: string | null }) {
  return src ? (
    <img alt="" height="96" src={src} style={styles.avatarImage} width="96" />
  ) : (
    <div style={styles.avatarFallback}>{fallback}</div>
  );
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricBadge}>
      <div style={styles.metricBadgeLabel}>{label}</div>
      <div style={styles.metricBadgeValue}>{value}</div>
    </div>
  );
}

function OgFrame({ children }: { children: ReactNode }) {
  return (
    <div style={styles.frame}>
      <div style={styles.frameGlow} />
      {children}
    </div>
  );
}

function PredictionCard({
  label,
  primaryValue,
  secondaryValue,
  tertiaryValue,
}: {
  label: string;
  primaryValue: string;
  secondaryValue: string;
  tertiaryValue: string;
}) {
  return (
    <div style={styles.predictionCard}>
      <div style={styles.predictionLabel}>{label}</div>
      <div style={styles.predictionMetricGroup}>
        <div style={styles.predictionPrimary}>{primaryValue}</div>
      </div>
      <div style={styles.predictionMetricGroup}>
        <div style={styles.predictionMetricLabel}>Time to goal</div>
        <div style={styles.predictionSecondary}>{secondaryValue}</div>
      </div>
      <div style={styles.predictionMetricGroup}>
        <div style={styles.predictionMetricLabel}>Estimated date</div>
        <div style={styles.predictionTertiary}>{tertiaryValue}</div>
      </div>
    </div>
  );
}

function getChannelSeoDescription(snapshot: ViewStatsChannelSnapshot): string {
  const trackedPlayButton = getTrackedPlayButton(snapshot.subscriberCount);

  if (snapshot.subscriberCount === null) {
    return `Track ${snapshot.channelName} (@${normalizeHandle(
      snapshot.handle
    )}) on Play Button Tracker and see progress toward the ${
      trackedPlayButton.name
    }.`;
  }

  const remainingSubscribers = Math.max(
    trackedPlayButton.threshold - snapshot.subscriberCount,
    0
  );

  if (
    trackedPlayButton.variant === "red-diamond" &&
    remainingSubscribers === 0
  ) {
    return `${snapshot.channelName} (@${normalizeHandle(
      snapshot.handle
    )}) has reached every tracked play button milestone on Play Button Tracker.`;
  }

  return `${snapshot.channelName} (@${normalizeHandle(
    snapshot.handle
  )}) has ${formatCompactNumber(
    snapshot.subscriberCount
  )} subscribers and needs ${formatCompactNumber(
    remainingSubscribers
  )} more for the ${trackedPlayButton.name}.`;
}

function normalizeHandle(handle: string): string {
  return handle.replace(LEADING_AT_REGEX, "").trim().toLowerCase();
}

function getBaseUrl(_origin?: string): string {
  return SITE_URL;
}

const styles = {
  avatarFallback: {
    alignItems: "center",
    background: COLORS.cardMuted,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "9999px",
    color: COLORS.foreground,
    display: "flex",
    fontSize: 30,
    fontWeight: 700,
    height: 80,
    justifyContent: "center",
    width: 80,
  } satisfies CSSProperties,
  avatarImage: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: "9999px",
    height: 80,
    objectFit: "cover",
    width: 80,
  } satisfies CSSProperties,
  brandBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    background: "rgba(24, 24, 27, 0.9)",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "9999px",
    display: "flex",
    gap: 12,
    padding: "8px 14px 8px 10px",
  } satisfies CSSProperties,
  brandIcon: {
    alignItems: "center",
    background: COLORS.accent,
    borderRadius: "9999px",
    display: "flex",
    height: 28,
    justifyContent: "center",
    width: 28,
  } satisfies CSSProperties,
  brandPlayTriangle: {
    borderBottom: "6px solid transparent",
    borderLeft: "10px solid white",
    borderTop: "6px solid transparent",
    height: 0,
    marginLeft: 2,
    width: 0,
  } satisfies CSSProperties,
  brandText: {
    color: COLORS.foreground,
    display: "flex",
    fontSize: 18,
    fontWeight: 600,
  } satisfies CSSProperties,
  channelName: {
    color: COLORS.foreground,
    display: "flex",
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1.1,
    maxWidth: 500,
  } satisfies CSSProperties,
  fallbackBody: {
    alignItems: "center",
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: 20,
    justifyContent: "center",
    textAlign: "center",
  } satisfies CSSProperties,
  frame: {
    background: `linear-gradient(135deg, ${COLORS.backgroundStart} 0%, ${COLORS.backgroundEnd} 70%)`,
    color: COLORS.foreground,
    display: "flex",
    fontFamily: '"Inter Variable", Inter, ui-sans-serif, system-ui, sans-serif',
    height: "100%",
    padding: 28,
    position: "relative",
    width: "100%",
  } satisfies CSSProperties,
  frameGlow: {
    background:
      "radial-gradient(circle at top right, rgba(255, 0, 0, 0.28), transparent 40%)",
    inset: 0,
    position: "absolute",
  } satisfies CSSProperties,
  handle: {
    color: COLORS.muted,
    display: "flex",
    fontSize: 20,
    fontWeight: 500,
  } satisfies CSSProperties,
  heroCopy: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: 8,
  } satisfies CSSProperties,
  heroLabel: {
    color: COLORS.accent,
    display: "flex",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  } satisfies CSSProperties,
  heroSection: {
    alignItems: "stretch",
    display: "flex",
    gap: 32,
  } satisfies CSSProperties,
  heroSubtitle: {
    color: COLORS.muted,
    display: "flex",
    fontSize: 18,
    lineHeight: 1.3,
    maxWidth: 640,
  } satisfies CSSProperties,
  heroTitle: {
    color: COLORS.foreground,
    display: "flex",
    fontSize: 42,
    fontWeight: 800,
    lineHeight: 1,
    maxWidth: 620,
  } satisfies CSSProperties,
  metricBadge: {
    background: COLORS.cardMuted,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 250,
    padding: "16px 20px",
  } satisfies CSSProperties,
  metricBadgeLabel: {
    color: COLORS.muted,
    display: "flex",
    fontSize: 16,
    fontWeight: 500,
  } satisfies CSSProperties,
  metricBadgeValue: {
    color: COLORS.foreground,
    display: "flex",
    fontSize: 22,
    fontWeight: 700,
  } satisfies CSSProperties,
  metricsRow: {
    display: "flex",
    gap: 12,
    marginTop: "auto",
    paddingBottom: 2,
  } satisfies CSSProperties,
  panel: {
    background: "rgba(24, 24, 27, 0.9)",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 32,
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: 18,
    padding: "24px 24px 6px",
    position: "relative",
    zIndex: 1,
  } satisfies CSSProperties,
  panelTopContent: {
    display: "flex",
    flexDirection: "column",
    gap: 48,
  } satisfies CSSProperties,
  panelHeader: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  } satisfies CSSProperties,
  playButtonCard: {
    borderRadius: 28,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    justifyContent: "center",
    minWidth: 240,
    padding: "18px 20px",
  } satisfies CSSProperties,
  playButtonCardLabel: {
    display: "flex",
    fontSize: 16,
    fontWeight: 600,
    opacity: 0.8,
  } satisfies CSSProperties,
  playButtonCardTitle: {
    display: "flex",
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1.1,
  } satisfies CSSProperties,
  playButtonCardValue: {
    display: "flex",
    fontSize: 20,
    fontWeight: 600,
  } satisfies CSSProperties,
  predictionCard: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: 10,
    minHeight: 132,
    padding: "18px 20px 16px",
  } satisfies CSSProperties,
  predictionLabel: {
    color: COLORS.muted,
    display: "flex",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } satisfies CSSProperties,
  predictionPrimary: {
    color: COLORS.foreground,
    display: "flex",
    fontSize: 30,
    fontWeight: 800,
  } satisfies CSSProperties,
  predictionMetricGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  } satisfies CSSProperties,
  predictionMetricLabel: {
    color: COLORS.muted,
    display: "flex",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } satisfies CSSProperties,
  predictionSecondary: {
    color: "rgba(250, 250, 250, 0.9)",
    display: "flex",
    fontSize: 16,
    fontWeight: 500,
  } satisfies CSSProperties,
  predictionTertiary: {
    color: "rgba(250, 250, 250, 0.82)",
    display: "flex",
    fontSize: 15,
    fontWeight: 500,
  } satisfies CSSProperties,
  profileRow: {
    alignItems: "center",
    display: "flex",
    gap: 20,
  } satisfies CSSProperties,
  profileText: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  } satisfies CSSProperties,
  progressFill: {
    background: `linear-gradient(90deg, ${COLORS.accent} 0%, #ff5a5f 100%)`,
    borderRadius: "9999px",
    display: "flex",
    height: "100%",
  } satisfies CSSProperties,
  progressTrack: {
    background: COLORS.cardMuted,
    borderRadius: "9999px",
    display: "flex",
    height: 18,
    overflow: "hidden",
    width: "100%",
  } satisfies CSSProperties,
} satisfies Record<string, CSSProperties>;
