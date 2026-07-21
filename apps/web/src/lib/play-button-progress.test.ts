import { describe, expect, it } from "bun:test";

import {
  type ChannelSnapshot,
  getPlayButtonProgress,
} from "./play-button-progress";

const snapshot: ChannelSnapshot = {
  capturedAt: "2026-07-21T00:05:00.000Z",
  subscriberCount: 90_000,
  subsGained7Day: 700,
  subsGained28Day: 2800,
};

describe("getPlayButtonProgress", () => {
  it("projects an approaching milestone and both growth windows", () => {
    const progress = getPlayButtonProgress(snapshot);

    expect(progress.state).toBe("in-progress");
    expect(progress.playButton).toEqual({
      buttonColor: "#AEAFB3",
      milestoneLabel: "100,000 subscriber milestone",
      name: "Silver Play Button",
      threshold: 100_000,
      variant: "silver",
    });
    expect(progress.current).toEqual({
      progressLabel: "90K / 100K",
      progressPercentage: 90,
      progressPercentageLabel: "90.0%",
      subscriberCountLabel: "90K",
    });
    expect(progress.remaining).toEqual({
      label: "10K more subscribers needed",
      subscriberCount: 10_000,
    });
    expect(progress.predictions).toEqual([
      {
        dailyGrowthLabel: "+100 subs/day",
        daysToGoalLabel: "100 days",
        estimatedDateLabel: "October 29, 2026",
        growthRoundingExplanation: null,
        period: "Based on last 7 days",
        periodDays: 7,
        state: "projected",
      },
      {
        dailyGrowthLabel: "+100 subs/day",
        daysToGoalLabel: "100 days",
        estimatedDateLabel: "October 29, 2026",
        growthRoundingExplanation: null,
        period: "Based on last 28 days",
        periodDays: 28,
        state: "projected",
      },
    ]);
  });

  it("returns one unavailable state when the subscriber count is unavailable", () => {
    const progress = getPlayButtonProgress({
      ...snapshot,
      subscriberCount: null,
    });

    expect(progress.state).toBe("unavailable");
    expect(progress.playButton.name).toBe("Silver Play Button");
    expect(progress.current).toEqual({
      progressLabel: "Subscriber count unavailable",
      progressPercentage: 0,
      progressPercentageLabel: "--",
      subscriberCountLabel: null,
    });
    expect(progress.remaining).toEqual({
      label: "Unable to calculate remaining subscribers",
      subscriberCount: null,
    });
    expect(progress.predictions).toEqual([
      {
        dailyGrowthLabel: "Unavailable",
        daysToGoalLabel: "Unavailable",
        estimatedDateLabel: "Unavailable",
        growthRoundingExplanation: null,
        period: "Based on last 7 days",
        periodDays: 7,
        state: "unavailable",
      },
      {
        dailyGrowthLabel: "Unavailable",
        daysToGoalLabel: "Unavailable",
        estimatedDateLabel: "Unavailable",
        growthRoundingExplanation: null,
        period: "Based on last 28 days",
        periodDays: 28,
        state: "unavailable",
      },
    ]);
  });

  it("selects the next incomplete milestone at exact and between thresholds", () => {
    const cases = [
      {
        expectedMilestoneLabel: "1,000,000 subscriber milestone",
        expectedName: "Gold Play Button",
        expectedRemaining: 900_000,
        subscriberCount: 100_000,
      },
      {
        expectedMilestoneLabel: "1,000,000 subscriber milestone",
        expectedName: "Gold Play Button",
        expectedRemaining: 500_000,
        subscriberCount: 500_000,
      },
      {
        expectedMilestoneLabel:
          "50,000,000 subscriber milestone (Ruby-style custom award)",
        expectedName: "Custom Creator Award",
        expectedRemaining: 40_000_000,
        subscriberCount: 10_000_000,
      },
    ] as const;

    for (const testCase of cases) {
      const progress = getPlayButtonProgress({
        ...snapshot,
        subscriberCount: testCase.subscriberCount,
      });

      expect(progress.state).toBe("in-progress");
      expect(progress.playButton.name).toBe(testCase.expectedName);
      expect(progress.playButton.milestoneLabel).toBe(
        testCase.expectedMilestoneLabel
      );
      expect(progress.remaining.subscriberCount).toBe(
        testCase.expectedRemaining
      );
    }
  });

  it("returns a completed final-milestone state at and above the last threshold", () => {
    for (const subscriberCount of [100_000_000, 125_000_000]) {
      const progress = getPlayButtonProgress({
        ...snapshot,
        subscriberCount,
      });

      expect(progress.state).toBe("all-milestones-reached");
      expect(progress.playButton.name).toBe("Red Diamond Play Button");
      expect(progress.current.progressPercentage).toBe(100);
      expect(progress.current.progressPercentageLabel).toBe("100.0%");
      expect(progress.remaining).toEqual({
        label:
          "This channel has already reached every tracked play button milestone",
        subscriberCount: 0,
      });

      for (const prediction of progress.predictions) {
        expect(prediction.state).toBe("all-milestones-reached");
        expect(prediction.daysToGoalLabel).toBe("All milestones reached");
        expect(prediction.estimatedDateLabel).toBe("Reached");
      }
    }
  });

  it("does not project a date from zero growth in either window", () => {
    const progress = getPlayButtonProgress({
      ...snapshot,
      subsGained7Day: 0,
      subsGained28Day: 0,
    });

    for (const prediction of progress.predictions) {
      expect(prediction.state).toBe("not-growing");
      expect(prediction.dailyGrowthLabel).toBe("0 subs/day");
      expect(prediction.daysToGoalLabel).toBe("Not Available");
      expect(prediction.estimatedDateLabel).toBe("Not Available");
      expect(prediction.growthRoundingExplanation).toBe(
        `YouTube rounds public subscriber counts, so smaller changes may not appear in the ${prediction.periodDays}-day trend.`
      );
    }
  });

  it("explains positive sub-one daily growth for both prediction windows", () => {
    const progress = getPlayButtonProgress({
      ...snapshot,
      subsGained7Day: 1,
      subsGained28Day: 1,
    });

    expect(progress.predictions[0]).toMatchObject({
      dailyGrowthLabel: "0 subs/day",
      daysToGoalLabel: "70,000 days",
      growthRoundingExplanation:
        "1 subscribers gained over the last 7 days averages less than 1 subscriber per day.",
      periodDays: 7,
      state: "projected",
    });
    expect(progress.predictions[1]).toMatchObject({
      dailyGrowthLabel: "0 subs/day",
      daysToGoalLabel: "280,000 days",
      growthRoundingExplanation:
        "1 subscribers gained over the last 28 days averages less than 1 subscriber per day.",
      periodDays: 28,
      state: "projected",
    });
  });

  it("keeps an unavailable history window separate from an available one", () => {
    const progress = getPlayButtonProgress({
      ...snapshot,
      subsGained7Day: null,
    });

    expect(progress.state).toBe("in-progress");
    expect(progress.predictions[0].state).toBe("unavailable");
    expect(progress.predictions[0].dailyGrowthLabel).toBe("Unavailable");
    expect(progress.predictions[1].state).toBe("projected");
    expect(progress.predictions[1].dailyGrowthLabel).toBe("+100 subs/day");
  });

  it("does not project a date from negative growth in either window", () => {
    const progress = getPlayButtonProgress({
      ...snapshot,
      subsGained7Day: -700,
      subsGained28Day: -2800,
    });

    for (const prediction of progress.predictions) {
      expect(prediction.state).toBe("not-growing");
      expect(prediction.dailyGrowthLabel).toBe("-100 subs/day");
      expect(prediction.daysToGoalLabel).toBe("Not Available");
      expect(prediction.estimatedDateLabel).toBe("Not Available");
      expect(prediction.growthRoundingExplanation).toBeNull();
    }
  });

  it("explains negative sub-one daily growth for both prediction windows", () => {
    const progress = getPlayButtonProgress({
      ...snapshot,
      subsGained7Day: -1,
      subsGained28Day: -1,
    });

    for (const prediction of progress.predictions) {
      expect(prediction.state).toBe("not-growing");
      expect(prediction.dailyGrowthLabel).toBe("0 subs/day");
      expect(prediction.growthRoundingExplanation).toBe(
        `1 subscribers lost over the last ${prediction.periodDays} days averages less than 1 subscriber per day.`
      );
    }
  });

  it("keeps completed milestone projections coherent when history is unavailable", () => {
    const progress = getPlayButtonProgress({
      ...snapshot,
      subscriberCount: 100_000_000,
      subsGained7Day: null,
      subsGained28Day: null,
    });

    expect(progress.state).toBe("all-milestones-reached");

    for (const prediction of progress.predictions) {
      expect(prediction).toMatchObject({
        dailyGrowthLabel: "Unavailable",
        daysToGoalLabel: "All milestones reached",
        estimatedDateLabel: "Reached",
        growthRoundingExplanation: null,
        state: "all-milestones-reached",
      });
    }
  });
});
