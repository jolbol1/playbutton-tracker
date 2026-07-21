import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { extractChannelIdentifier } from "@/lib/channel-identifier";
import { getSocialPreviewMetadata } from "@/lib/social-preview";

export const Route = createFileRoute("/")({
  component: HomeComponent,
  head: () => getSocialPreviewMetadata({ page: "default" }),
});

function HomeComponent() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const handle = extractChannelIdentifier(value);

    if (handle === null) {
      setError("Enter a YouTube channel URL or @handle.");
      return;
    }

    setError(null);
    navigate({
      params: { handle },
      to: "/channel/$handle",
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-12 px-4 py-8">
      <div className="space-y-2">
        <svg
          aria-label="Play Button Tracker"
          className="mx-auto mb-6 h-24"
          preserveAspectRatio="xMidYMid"
          viewBox="0 0 256 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M250.346 28.075A32.18 32.18 0 0 0 227.69 5.418C207.824 0 127.87 0 127.87 0S47.912.164 28.046 5.582A32.18 32.18 0 0 0 5.39 28.24c-6.009 35.298-8.34 89.084.165 122.97a32.18 32.18 0 0 0 22.656 22.657c19.866 5.418 99.822 5.418 99.822 5.418s79.955 0 99.82-5.418a32.18 32.18 0 0 0 22.657-22.657c6.338-35.348 8.291-89.1-.164-123.134Z"
            fill="red"
          />
          <path d="m102.421 128.06 66.328-38.418-66.328-38.418z" fill="#FFF" />
        </svg>

        <h1 className="text-center font-bold text-4xl tracking-tight">
          Play Button Tracker
        </h1>
        <p className="text-balance text-center text-zinc-400">
          Check how close a YouTube channel is to earning their next Play Button
        </p>
      </div>
      <Card className="w-full border-none shadow-xl">
        <CardHeader className="space-y-2">
          <label
            className="text-muted-foreground text-sm"
            htmlFor="channel-identifier"
          >
            Paste a YouTube channel URL or enter a handle like `@MrBeast`.
          </label>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                aria-describedby={
                  error ? "channel-identifier-error" : undefined
                }
                aria-invalid={error !== null}
                autoComplete="off"
                className="h-11"
                id="channel-identifier"
                onChange={(event) => {
                  setError(null);
                  setValue(event.target.value);
                }}
                placeholder="https://youtube.com/@channel or @channel"
                value={value}
              />
              <Button className="h-11 px-5" size="lg" type="submit">
                Track Channel
              </Button>
            </div>
            {error ? (
              <p
                className="text-destructive text-sm"
                id="channel-identifier-error"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
