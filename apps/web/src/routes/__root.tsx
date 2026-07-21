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

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    links: [
      {
        href: appCss,
        rel: "stylesheet",
      },
      {
        href: "/favicon.ico",
        rel: "icon",
      },
    ],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        content: "width=device-width, initial-scale=1",
        name: "viewport",
      },
      {
        content: "index,follow",
        name: "robots",
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
