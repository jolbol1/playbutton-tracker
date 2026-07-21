import { beforeEach, describe, expect, it, mock } from "bun:test";

const getOpenGraph = mock(async () => new Response("png"));
const getOpenGraphHead = mock(
  async () =>
    new Response(null, {
      headers: { "Content-Type": "image/png" },
    })
);

mock.module("@/lib/social-preview.server", () => ({
  socialPreview: {
    getMetadata: () => ({ links: [], meta: [] }),
    getOpenGraph,
    getOpenGraphHead,
  },
}));

const { Route } = await import("./channel.$handle.og[.]png");

describe("Channel Open Graph route", () => {
  beforeEach(() => {
    getOpenGraph.mockClear();
    getOpenGraphHead.mockClear();
  });

  it("delegates HEAD directly to the Social Preview HEAD interface", async () => {
    const request = new Request(
      "https://www.playbuttontracker.com/channel/betterstack/og.png",
      { method: "HEAD" }
    );
    const server = Route.options.server;

    if (server === undefined || typeof server === "function") {
      throw new Error("Expected static route server options");
    }

    const handlers = server.handlers;

    if (handlers === undefined || typeof handlers === "function") {
      throw new Error("Expected static route handlers");
    }

    const headHandler = handlers.HEAD;

    if (headHandler === undefined) {
      throw new Error("Expected a HEAD route handler");
    }

    const response = await headHandler({
      context: undefined,
      next: () => {
        throw new Error("HEAD handler unexpectedly delegated to next");
      },
      params: { handle: "betterstack" },
      pathname: "/og.png",
      request,
    });

    if (!(response instanceof Response)) {
      throw new Error("Expected the HEAD handler to return a Response");
    }

    expect(getOpenGraphHead).toHaveBeenCalledWith({
      handle: "betterstack",
      requestUrl: request.url,
    });
    expect(getOpenGraph).not.toHaveBeenCalled();
    expect(response.headers.get("Content-Type")).toBe("image/png");
  });
});
