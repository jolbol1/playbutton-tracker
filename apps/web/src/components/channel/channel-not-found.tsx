import { Link } from "@tanstack/react-router";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ChannelNotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-8">
      <Card className="w-full border-none shadow-xl">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <h1 className="font-semibold text-2xl">Channel not found</h1>
          <p className="text-muted-foreground">
            The channel could not be found.
          </p>
          <Link className={buttonVariants({ size: "lg" })} to="/">
            Back Home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
