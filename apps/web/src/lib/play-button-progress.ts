export interface ChannelSnapshot {
  capturedAt: string;
  subscriberCount: number | null;
  subsGained7Day: number | null;
  subsGained28Day: number | null;
}

export interface PlayButton {
  buttonColor: string;
  name: string;
  threshold: number;
  variant: "silver" | "gold" | "diamond" | "custom" | "red-diamond";
}

interface ProjectedPlayButton extends PlayButton {
  milestoneLabel: string;
}

export interface Prediction {
  dailyGrowthLabel: string;
  daysToGoalLabel: string;
  estimatedDateLabel: string;
  growthRoundingExplanation: string | null;
  period: string;
  periodDays: 7 | 28;
  state: "all-milestones-reached" | "not-growing" | "projected" | "unavailable";
}

export interface ProgressMetrics {
  progressLabel: string;
  progressPercentage: number;
  progressPercentageLabel: string;
  subscribersNeededLabel: string;
}

export interface PlayButtonProgressProjection {
  current: {
    progressLabel: string;
    progressPercentage: number;
    progressPercentageLabel: string;
    subscriberCountLabel: string | null;
  };
  playButton: ProjectedPlayButton;
  predictions: readonly [Prediction, Prediction];
  remaining: {
    label: string;
    subscriberCount: number | null;
  };
  state: "all-milestones-reached" | "in-progress" | "unavailable";
}

export const PLAY_BUTTONS = [
  {
    buttonColor: "#AEAFB3",
    milestoneLabel: "100,000 subscriber milestone",
    name: "Silver Play Button",
    threshold: 100_000,
    variant: "silver",
  },
  {
    buttonColor: "#D4AF37",
    milestoneLabel: "1,000,000 subscriber milestone",
    name: "Gold Play Button",
    threshold: 1_000_000,
    variant: "gold",
  },
  {
    buttonColor: "#B9F2FF",
    milestoneLabel: "10,000,000 subscriber milestone",
    name: "Diamond Play Button",
    threshold: 10_000_000,
    variant: "diamond",
  },
  {
    buttonColor: "#E0115F",
    milestoneLabel: "50,000,000 subscriber milestone (Ruby-style custom award)",
    name: "Custom Creator Award",
    threshold: 50_000_000,
    variant: "custom",
  },
  {
    buttonColor: "#FF3333",
    milestoneLabel: "100,000,000 subscriber milestone",
    name: "Red Diamond Play Button",
    threshold: 100_000_000,
    variant: "red-diamond",
  },
] as const satisfies readonly ProjectedPlayButton[];

const FIRST_PLAY_BUTTON = PLAY_BUTTONS[0];
const FINAL_PLAY_BUTTON = PLAY_BUTTONS.at(-1) ?? FIRST_PLAY_BUTTON;
const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});
const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});
const PROGRESS_PREDICTION_WINDOWS = [
  { period: "Based on last 7 days", periodDays: 7 },
  { period: "Based on last 28 days", periodDays: 28 },
] as const;

export const getPlayButtonProgress = (
  snapshot: ChannelSnapshot
): PlayButtonProgressProjection => {
  const playButton = getTrackedPlayButton(snapshot.subscriberCount);
  const progressMetrics = getProgressMetrics(snapshot, playButton);
  const predictions = createProgressPredictions(snapshot, playButton);
  const subscriberCount = snapshot.subscriberCount;

  if (subscriberCount === null) {
    return {
      current: {
        progressLabel: progressMetrics.progressLabel,
        progressPercentage: progressMetrics.progressPercentage,
        progressPercentageLabel: progressMetrics.progressPercentageLabel,
        subscriberCountLabel: null,
      },
      playButton,
      predictions,
      remaining: {
        label: progressMetrics.subscribersNeededLabel,
        subscriberCount: null,
      },
      state: "unavailable",
    };
  }

  const remainingSubscriberCount = Math.max(
    playButton.threshold - subscriberCount,
    0
  );
  const hasReachedAllMilestones =
    playButton === FINAL_PLAY_BUTTON && remainingSubscriberCount === 0;

  return {
    current: {
      progressLabel: progressMetrics.progressLabel,
      progressPercentage: progressMetrics.progressPercentage,
      progressPercentageLabel: progressMetrics.progressPercentageLabel,
      subscriberCountLabel: formatCompactNumber(subscriberCount),
    },
    playButton,
    predictions,
    remaining: {
      label: progressMetrics.subscribersNeededLabel,
      subscriberCount: remainingSubscriberCount,
    },
    state: hasReachedAllMilestones ? "all-milestones-reached" : "in-progress",
  };
};

const createProgressPredictions = (
  snapshot: ChannelSnapshot,
  playButton: PlayButton
): readonly [Prediction, Prediction] => {
  const [sevenDayWindow, twentyEightDayWindow] = PROGRESS_PREDICTION_WINDOWS;

  return [
    createPrediction(
      snapshot,
      playButton,
      sevenDayWindow.periodDays,
      sevenDayWindow.period
    ),
    createPrediction(
      snapshot,
      playButton,
      twentyEightDayWindow.periodDays,
      twentyEightDayWindow.period
    ),
  ];
};

/** @deprecated Use getPlayButtonProgress for new callers. */
export const createPrediction = (
  snapshot: ChannelSnapshot,
  playButton: PlayButton,
  periodDays: 7 | 28,
  period: string
): Prediction => {
  const subscriberCount = snapshot.subscriberCount;
  const subscriberGain =
    periodDays === 7 ? snapshot.subsGained7Day : snapshot.subsGained28Day;

  if (subscriberCount === null) {
    return createUnavailablePrediction(periodDays, period);
  }

  const remainingSubscriberCount = Math.max(
    playButton.threshold - subscriberCount,
    0
  );
  const hasReachedAllMilestones =
    playButton.variant === "red-diamond" && remainingSubscriberCount === 0;

  return createPredictionForWindow({
    capturedAt: snapshot.capturedAt,
    hasReachedAllMilestones,
    period,
    periodDays,
    remainingSubscriberCount,
    subscriberGain,
  });
};

/** @deprecated Use labels from getPlayButtonProgress for new callers. */
export const formatCompactNumber = (value: number): string =>
  COMPACT_NUMBER_FORMATTER.format(value);

/** @deprecated Use playButton.milestoneLabel from getPlayButtonProgress. */
export const formatPlayButtonMilestone = (playButton: PlayButton): string => {
  if (playButton.variant === "custom") {
    return `${NUMBER_FORMATTER.format(playButton.threshold)} subscriber milestone (Ruby-style custom award)`;
  }

  return `${NUMBER_FORMATTER.format(playButton.threshold)} subscriber milestone`;
};

/** @deprecated Use current and remaining from getPlayButtonProgress. */
export const getProgressMetrics = (
  snapshot: ChannelSnapshot,
  playButton: PlayButton
): ProgressMetrics => {
  const subscriberCount = snapshot.subscriberCount;

  if (subscriberCount === null) {
    return {
      progressLabel: "Subscriber count unavailable",
      progressPercentage: 0,
      progressPercentageLabel: "--",
      subscribersNeededLabel: "Unable to calculate remaining subscribers",
    };
  }

  const remainingSubscriberCount = Math.max(
    playButton.threshold - subscriberCount,
    0
  );
  const progressPercentage = Math.min(
    (subscriberCount / playButton.threshold) * 100,
    100
  );

  return {
    progressLabel: `${formatCompactNumber(subscriberCount)} / ${formatCompactNumber(playButton.threshold)}`,
    progressPercentage,
    progressPercentageLabel: `${progressPercentage.toFixed(1)}%`,
    subscribersNeededLabel: getSubscribersNeededLabel(
      playButton,
      remainingSubscriberCount
    ),
  };
};

/** @deprecated Use playButton from getPlayButtonProgress. */
export const getTrackedPlayButton = (
  subscriberCount: number | null
): ProjectedPlayButton => {
  if (subscriberCount === null) {
    return FIRST_PLAY_BUTTON;
  }

  return (
    PLAY_BUTTONS.find((playButton) => subscriberCount < playButton.threshold) ??
    FINAL_PLAY_BUTTON
  );
};

interface PredictionWindowInput {
  capturedAt: string;
  hasReachedAllMilestones: boolean;
  period: string;
  periodDays: 7 | 28;
  remainingSubscriberCount: number;
  subscriberGain: number | null;
}

const createPredictionForWindow = ({
  capturedAt,
  hasReachedAllMilestones,
  period,
  periodDays,
  remainingSubscriberCount,
  subscriberGain,
}: PredictionWindowInput): Prediction => {
  if (hasReachedAllMilestones) {
    if (subscriberGain === null) {
      return {
        dailyGrowthLabel: "Unavailable",
        daysToGoalLabel: "All milestones reached",
        estimatedDateLabel: "Reached",
        growthRoundingExplanation: null,
        period,
        periodDays,
        state: "all-milestones-reached",
      };
    }

    const dailyGrowth = subscriberGain / periodDays;

    return {
      dailyGrowthLabel: formatDailyGrowth(dailyGrowth),
      daysToGoalLabel: "All milestones reached",
      estimatedDateLabel: "Reached",
      growthRoundingExplanation: getGrowthRoundingExplanation(
        subscriberGain,
        dailyGrowth,
        periodDays
      ),
      period,
      periodDays,
      state: "all-milestones-reached",
    };
  }

  if (subscriberGain === null) {
    return createUnavailablePrediction(periodDays, period);
  }

  const dailyGrowth = subscriberGain / periodDays;

  if (dailyGrowth <= 0) {
    return {
      dailyGrowthLabel: formatDailyGrowth(dailyGrowth),
      daysToGoalLabel: "Not Available",
      estimatedDateLabel: "Not Available",
      growthRoundingExplanation: getGrowthRoundingExplanation(
        subscriberGain,
        dailyGrowth,
        periodDays
      ),
      period,
      periodDays,
      state: "not-growing",
    };
  }

  const daysToGoal = Math.ceil(remainingSubscriberCount / dailyGrowth);

  return {
    dailyGrowthLabel: formatDailyGrowth(dailyGrowth),
    daysToGoalLabel: `${NUMBER_FORMATTER.format(daysToGoal)} days`,
    estimatedDateLabel: getEstimatedDateLabel(capturedAt, daysToGoal),
    growthRoundingExplanation: getGrowthRoundingExplanation(
      subscriberGain,
      dailyGrowth,
      periodDays
    ),
    period,
    periodDays,
    state: "projected",
  };
};

const createUnavailablePrediction = (
  periodDays: 7 | 28,
  period: string
): Prediction => ({
  dailyGrowthLabel: "Unavailable",
  daysToGoalLabel: "Unavailable",
  estimatedDateLabel: "Unavailable",
  growthRoundingExplanation: null,
  period,
  periodDays,
  state: "unavailable",
});

const formatDailyGrowth = (value: number): string => {
  const roundedValue = Math.round(value);

  if (roundedValue === 0) {
    return "0 subs/day";
  }

  const sign = roundedValue > 0 ? "+" : "";
  return `${sign}${NUMBER_FORMATTER.format(roundedValue)} subs/day`;
};

const getGrowthRoundingExplanation = (
  subscriberGain: number,
  dailyGrowth: number,
  periodDays: 7 | 28
): string | null => {
  if (Math.round(dailyGrowth) !== 0) {
    return null;
  }

  if (subscriberGain > 0) {
    return `${NUMBER_FORMATTER.format(subscriberGain)} subscribers gained over the last ${periodDays} days averages less than 1 subscriber per day.`;
  }

  if (subscriberGain < 0) {
    return `${NUMBER_FORMATTER.format(Math.abs(subscriberGain))} subscribers lost over the last ${periodDays} days averages less than 1 subscriber per day.`;
  }

  return `YouTube rounds public subscriber counts, so smaller changes may not appear in the ${periodDays}-day trend.`;
};

const getEstimatedDateLabel = (
  capturedAt: string,
  daysToGoal: number
): string => {
  const estimatedDate = new Date(capturedAt);
  estimatedDate.setUTCDate(estimatedDate.getUTCDate() + daysToGoal);

  return Number.isNaN(estimatedDate.getTime())
    ? "Not Available"
    : DATE_FORMATTER.format(estimatedDate);
};

const getSubscribersNeededLabel = (
  playButton: PlayButton,
  remainingSubscriberCount: number
): string => {
  if (remainingSubscriberCount > 0) {
    return `${formatCompactNumber(remainingSubscriberCount)} more subscribers needed`;
  }

  if (playButton.variant === "red-diamond") {
    return "This channel has already reached every tracked play button milestone";
  }

  return `This channel has already reached the ${playButton.name} milestone`;
};
