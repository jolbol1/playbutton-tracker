import type { ViewStatsChannelSnapshot } from "../utils/channel-schema";

export interface PlayButton {
  buttonColor: string;
  name: string;
  threshold: number;
  variant: "silver" | "gold" | "diamond" | "custom" | "red-diamond";
}

export interface Prediction {
  dailyGrowthLabel: string;
  daysToGoalLabel: string;
  estimatedDateLabel: string;
  period: string;
  showRoundedGrowthTooltip: boolean;
}

export interface ProgressMetrics {
  progressLabel: string;
  progressPercentage: number;
  progressPercentageLabel: string;
  subscribersNeededLabel: string;
}

export const PLAY_BUTTONS = [
  {
    buttonColor: "#AEAFB3",
    name: "Silver Play Button",
    threshold: 100_000,
    variant: "silver",
  },
  {
    buttonColor: "#D4AF37",
    name: "Gold Play Button",
    threshold: 1_000_000,
    variant: "gold",
  },
  {
    buttonColor: "#B9F2FF",
    name: "Diamond Play Button",
    threshold: 10_000_000,
    variant: "diamond",
  },
  {
    buttonColor: "#E0115F",
    name: "Custom Creator Award",
    threshold: 50_000_000,
    variant: "custom",
  },
  {
    buttonColor: "#FF3333",
    name: "Red Diamond Play Button",
    threshold: 100_000_000,
    variant: "red-diamond",
  },
] satisfies readonly PlayButton[];

const FINAL_PLAY_BUTTON = PLAY_BUTTONS.at(-1) ?? PLAY_BUTTONS[0];
const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});
const WHITESPACE_REGEX = /\s+/;

export function createPrediction(
  snapshot: ViewStatsChannelSnapshot,
  playButton: PlayButton,
  periodDays: 7 | 28,
  period: string
): Prediction {
  const gain =
    periodDays === 7 ? snapshot.subsGained7Day : snapshot.subsGained28Day;

  if (snapshot.subscriberCount === null || gain === null) {
    return {
      dailyGrowthLabel: "Unavailable",
      daysToGoalLabel: "Unavailable",
      estimatedDateLabel: "Unavailable",
      period,
      showRoundedGrowthTooltip: false,
    };
  }

  const subscribersNeeded = Math.max(
    playButton.threshold - snapshot.subscriberCount,
    0
  );
  const dailyGrowth = gain / periodDays;

  if (playButton === FINAL_PLAY_BUTTON && subscribersNeeded === 0) {
    return {
      dailyGrowthLabel: formatDailyGrowth(dailyGrowth),
      daysToGoalLabel: "All milestones reached",
      estimatedDateLabel: "Reached",
      period,
      showRoundedGrowthTooltip:
        Math.round(dailyGrowth) === 0 && dailyGrowth <= 0,
    };
  }

  if (dailyGrowth <= 0) {
    return {
      dailyGrowthLabel: formatDailyGrowth(dailyGrowth),
      daysToGoalLabel: "Not Available",
      estimatedDateLabel: "Not Available",
      period,
      showRoundedGrowthTooltip:
        Math.round(dailyGrowth) === 0 && dailyGrowth <= 0,
    };
  }

  const daysToGoal = Math.ceil(subscribersNeeded / dailyGrowth);
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysToGoal);

  return {
    dailyGrowthLabel: formatDailyGrowth(dailyGrowth),
    daysToGoalLabel: `${NUMBER_FORMATTER.format(daysToGoal)} days`,
    estimatedDateLabel: DATE_FORMATTER.format(estimatedDate),
    period,
    showRoundedGrowthTooltip: Math.round(dailyGrowth) === 0 && dailyGrowth <= 0,
  };
}

export function formatCompactNumber(value: number): string {
  return COMPACT_NUMBER_FORMATTER.format(value);
}

export function formatPlayButtonMilestone(playButton: PlayButton): string {
  if (playButton.variant === "custom") {
    return `${NUMBER_FORMATTER.format(playButton.threshold)} subscriber milestone (Ruby-style custom award)`;
  }

  return `${NUMBER_FORMATTER.format(playButton.threshold)} subscriber milestone`;
}

export function getInitials(value: string): string {
  const letters = value
    .split(WHITESPACE_REGEX)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "");

  return letters.join("") || "?";
}

export function getProgressMetrics(
  snapshot: ViewStatsChannelSnapshot,
  playButton: PlayButton
): ProgressMetrics {
  const currentSubscribers = snapshot.subscriberCount;

  if (currentSubscribers === null) {
    return {
      progressLabel: "Subscriber count unavailable",
      progressPercentage: 0,
      progressPercentageLabel: "--",
      subscribersNeededLabel: "Unable to calculate remaining subscribers",
    };
  }

  const subscribersNeeded = Math.max(
    playButton.threshold - currentSubscribers,
    0
  );
  const progressPercentage = Math.min(
    (currentSubscribers / playButton.threshold) * 100,
    100
  );

  return {
    progressLabel: `${formatCompactNumber(currentSubscribers)} / ${formatCompactNumber(playButton.threshold)}`,
    progressPercentage,
    progressPercentageLabel: `${progressPercentage.toFixed(1)}%`,
    subscribersNeededLabel: getSubscribersNeededLabel(
      playButton,
      subscribersNeeded
    ),
  };
}

export function getTrackedPlayButton(
  subscriberCount: number | null
): PlayButton {
  if (subscriberCount === null) {
    return PLAY_BUTTONS[0];
  }

  return (
    PLAY_BUTTONS.find((playButton) => subscriberCount < playButton.threshold) ??
    FINAL_PLAY_BUTTON
  );
}

function formatDailyGrowth(value: number): string {
  const roundedValue = Math.round(value);
  const sign = roundedValue > 0 ? "+" : "";
  return `${sign}${NUMBER_FORMATTER.format(roundedValue)} subs/day`;
}

function getSubscribersNeededLabel(
  playButton: PlayButton,
  subscribersNeeded: number
): string {
  if (subscribersNeeded > 0) {
    return `${formatCompactNumber(subscribersNeeded)} more subscribers needed`;
  }

  if (playButton === FINAL_PLAY_BUTTON) {
    return "This channel has already reached every tracked play button milestone";
  }

  return `This channel has already reached the ${playButton.name} milestone`;
}
