import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/button";
import { Card, CardContent, CardHeader } from "@/components/card";
import { Input } from "@/components/input";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const DIRECT_HANDLE_REGEX = /^@?[A-Za-z0-9._-]+$/;
const LEADING_AT_REGEX = /^@/;

function HomeComponent() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const handle = extractChannelHandle(value);

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
    <div className="mx-auto flex h-dvh max-w-lg flex-col items-center justify-center gap-12 px-4">
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
          <p className="text-muted-foreground text-sm">
            Paste a YouTube channel URL or enter a handle like `@MrBeast`.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                aria-invalid={error !== null}
                autoComplete="off"
                className="h-11"
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
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function extractChannelHandle(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (DIRECT_HANDLE_REGEX.test(trimmedValue)) {
    return trimmedValue.replace(LEADING_AT_REGEX, "");
  }

  const normalizedValue = trimmedValue.startsWith("http")
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const url = new URL(normalizedValue);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const handleSegment = pathSegments.find((segment) =>
      segment.startsWith("@")
    );

    if (handleSegment) {
      return handleSegment.slice(1);
    }

    if (pathSegments[0] === "channel" && pathSegments[1]) {
      return pathSegments[1];
    }
  } catch {
    return null;
  }

  return null;
}
