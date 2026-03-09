import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
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
          <Outlet />
        </TooltipProvider>
        <Toaster richColors />
        <TanStackRouterDevtools position="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}
