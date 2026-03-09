import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Github } from "lucide-react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import appCss from "../index.css?url";

export type RouterAppContext = Record<string, never>;

const APP_TITLE = "Play Button Tracker";
const APP_DESCRIPTION =
  "Track YouTube channel subscriber progress toward creator awards, estimate milestone timelines, and view recent growth trends.";

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: APP_TITLE,
      },
      {
        name: "description",
        content: APP_DESCRIPTION,
      },
      {
        name: "robots",
        content: "index,follow",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:title",
        content: APP_TITLE,
      },
      {
        property: "og:description",
        content: APP_DESCRIPTION,
      },
      {
        name: "twitter:card",
        content: "summary",
      },
      {
        name: "twitter:title",
        content: APP_TITLE,
      },
      {
        name: "twitter:description",
        content: APP_DESCRIPTION,
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  return (
    <html className="dark" lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>
          <div className="flex min-h-dvh flex-col">
            <main className="flex flex-1 flex-col">
              <Outlet />
            </main>
            <footer className="flex items-center justify-center gap-2 px-4 pb-6 text-muted-foreground text-sm">
              <a
                aria-label="View the Play Button Tracker source on GitHub"
                className="transition-opacity hover:opacity-80"
                href="https://github.com/jolbol1/playbutton-tracker"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                className="transition-opacity hover:opacity-80"
                href="https://www.jamesshopland.com/"
                rel="noopener noreferrer"
                target="_blank"
              >
                Made by James Shopland
              </a>
            </footer>
          </div>
        </TooltipProvider>
        <Toaster richColors />
        <TanStackRouterDevtools position="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}
