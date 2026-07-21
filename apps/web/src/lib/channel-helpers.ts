import type { ChannelSnapshot } from "../utils/channel-snapshot";
import {
  formatCompactNumber as formatProjectedCompactNumber,
  getTrackedPlayButton as getProjectedPlayButton,
  PLAY_BUTTONS as PLAY_BUTTON_CATALOG,
  type PlayButton as ProgressPlayButton,
  type Prediction as ProgressPrediction,
  createPrediction as projectPrediction,
} from "./play-button-progress";

export type PlayButton = ProgressPlayButton;
export type Prediction = Omit<ProgressPrediction, "periodDays" | "state">;

export const PLAY_BUTTONS = PLAY_BUTTON_CATALOG satisfies readonly PlayButton[];

const WHITESPACE_REGEX = /\s+/;

/** @deprecated Use getPlayButtonProgress for new callers. */
export const createPrediction = (
  snapshot: ChannelSnapshot,
  playButton: PlayButton,
  periodDays: 7 | 28,
  period: string
): Prediction => projectPrediction(snapshot, playButton, periodDays, period);

/** @deprecated Use labels from getPlayButtonProgress for new callers. */
export const formatCompactNumber = (value: number): string =>
  formatProjectedCompactNumber(value);

export const getInitials = (value: string): string => {
  const letters = value
    .split(WHITESPACE_REGEX)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "");

  return letters.join("") || "?";
};

/** @deprecated Use playButton from getPlayButtonProgress. */
export const getTrackedPlayButton = (
  subscriberCount: number | null
): PlayButton => getProjectedPlayButton(subscriberCount);
