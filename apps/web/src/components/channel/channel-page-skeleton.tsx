import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChannelPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-10 md:px-12">
      <div className="space-y-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex w-full flex-row items-center gap-4 sm:w-auto sm:flex-1">
            <Skeleton className="size-14 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-8 w-56 max-w-full" />
              <Skeleton className="h-4 w-48 max-w-full" />
            </div>
          </div>
          <Skeleton className="hidden h-10 w-36 rounded-full sm:block" />
        </div>

        <Card className="p-6">
          <CardContent className="p-0">
            <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
              <Skeleton className="h-64 w-64 rounded-none" />

              <div className="w-full flex-1 space-y-12 md:space-y-6">
                <div className="space-y-2 text-center md:text-left">
                  <Skeleton className="mx-auto h-8 w-56 md:mx-0" />
                  <Skeleton className="mx-auto h-5 w-64 md:mx-0" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>

                  <div className="relative">
                    <Skeleton className="h-6 w-full rounded-full" />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>

                  <Skeleton className="mx-auto h-4 w-56" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          {[0, 1].map((index) => (
            <Card key={`prediction-skeleton-${index}`}>
              <CardHeader>
                <CardTitle className="font-medium text-muted-foreground text-sm">
                  <Skeleton className="h-4 w-36" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[0, 1, 2].map((metricIndex) => (
                  <div className="flex items-center gap-4" key={metricIndex}>
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-7 w-32" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
