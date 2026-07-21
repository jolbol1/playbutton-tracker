import { createFileRoute } from "@tanstack/react-router";
import { Calendar, CircleAlert, Clock, TrendingUp, Users } from "lucide-react";
import { ChannelNotFound } from "@/components/channel/channel-not-found";
import { ChannelPageSkeleton } from "@/components/channel/channel-page-skeleton";
import { MetricRow } from "@/components/channel/metric-row";
import { PlayButtonContent } from "@/components/channel/play-button-content";
import { ProgressBar } from "@/components/channel/progress-bar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getChannelInitials } from "@/lib/channel-initials";
import { getPlayButtonProgress } from "@/lib/play-button-progress";
import { getSocialPreviewMetadata } from "@/lib/social-preview";
import { cn } from "@/lib/utils";
import type { ChannelSnapshot } from "@/utils/channel-snapshot";
import { getChannelSnapshotFn } from "../utils/channel-snapshot.functions";

export const Route = createFileRoute("/channel/$handle")({
  loader: ({ params }) =>
    getChannelSnapshotFn({ data: { handle: params.handle } }),
  head: ({ loaderData }) => {
    if (loaderData === undefined) {
      return {};
    }

    return getSocialPreviewMetadata({
      channel: loaderData,
      page: "channel",
    });
  },
  component: ChannelPage,
  notFoundComponent: ChannelNotFound,
  pendingComponent: ChannelPageSkeleton,
});

function ChannelPage() {
  const snapshot = Route.useLoaderData();

  return <ChannelPageView snapshot={snapshot} />;
}

interface ChannelPageViewProps {
  snapshot: ChannelSnapshot;
}

function ChannelPageView({ snapshot }: ChannelPageViewProps) {
  const progress = getPlayButtonProgress(snapshot);
  const channelUrl = `https://youtube.com/@${snapshot.handle}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-10 md:px-12">
      <div className="space-y-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-row items-center gap-4">
            <Avatar className="size-14">
              <AvatarImage
                alt={`${snapshot.channelName} avatar`}
                src={snapshot.avatarUrl ?? undefined}
              />
              <AvatarFallback className="font-semibold text-lg">
                {getChannelInitials(snapshot.channelName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-semibold text-foreground text-xl md:text-2xl">
                  <a
                    className="transition-opacity hover:opacity-80"
                    href={channelUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {snapshot.channelName}
                  </a>
                </h1>
              </div>
              <p className="text-muted-foreground text-sm">
                @{snapshot.handle}
                {progress.current.subscriberCountLabel !== null
                  ? ` · ${progress.current.subscriberCountLabel} subscribers`
                  : ""}
              </p>
            </div>
          </div>
          <a
            className={cn(
              buttonVariants({ size: "lg" }),
              "hidden rounded-full sm:inline-flex"
            )}
            href={channelUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Visit Channel
          </a>
        </div>

        <Card className="p-6">
          <CardContent className="p-0">
            <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
              <PlayButtonContent
                buttonColor={progress.playButton.buttonColor}
                channelTitle={snapshot.channelName}
                threshold={progress.playButton.threshold}
              />

              <div className="w-full flex-1 space-y-12 md:space-y-6">
                <div className="text-center md:text-left">
                  <h2 className="mb-1 font-bold text-2xl text-foreground">
                    {progress.playButton.name}
                  </h2>
                  <p className="text-muted-foreground">
                    {progress.playButton.milestoneLabel}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">
                        Current Progress
                      </span>
                    </div>
                    <span className="font-bold text-2xl text-primary">
                      {progress.current.progressPercentageLabel}
                    </span>
                  </div>

                  <div className="relative">
                    <ProgressBar
                      ariaLabel={`Progress toward ${progress.playButton.name}`}
                      className="h-6 bg-secondary"
                      value={progress.current.progressPercentage}
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="px-2 text-center font-medium text-[11px] text-foreground drop-shadow sm:text-xs">
                        {progress.current.progressLabel}
                      </span>
                    </div>
                  </div>

                  <p className="text-center text-muted-foreground text-sm">
                    {progress.remaining.label}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          {progress.predictions.map((prediction) => {
            return (
              <Card key={prediction.period}>
                <CardHeader>
                  <CardTitle className="font-medium text-muted-foreground text-sm">
                    {prediction.period}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MetricRow
                    icon={<TrendingUp className="h-6 w-6 text-[#FF2956]" />}
                    iconClassName="bg-[#341019]"
                    label="Daily Growth"
                    labelSuffix={
                      prediction.growthRoundingExplanation ? (
                        <Tooltip>
                          <TooltipTrigger className="inline-flex items-center">
                            <CircleAlert
                              aria-label="Daily growth rounding info"
                              className="h-3.5 w-3.5 text-muted-foreground"
                            />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm text-pretty p-4 normal-case tracking-normal">
                            {prediction.growthRoundingExplanation}
                          </TooltipContent>
                        </Tooltip>
                      ) : undefined
                    }
                    value={prediction.dailyGrowthLabel}
                  />
                  <MetricRow
                    icon={<Clock className="h-6 w-6 text-[#FFC400]" />}
                    iconClassName="bg-[#342E10]"
                    label="Time to Goal"
                    value={prediction.daysToGoalLabel}
                  />
                  <MetricRow
                    icon={<Calendar className="h-6 w-6 text-[#12D7E7]" />}
                    iconClassName="bg-[#082A30]"
                    label="Achievement Date"
                    value={prediction.estimatedDateLabel}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
