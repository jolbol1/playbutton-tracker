import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
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
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-8">
      <Card className="w-full border-none shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Track a YouTube Channel</CardTitle>
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
