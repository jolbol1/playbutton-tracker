import { describe, expect, it } from "bun:test";

import { createViewStatsChannelSnapshotSource } from "./viewstats-channel-snapshot-source.server";

const encryptPayload = async (
  payload: unknown,
  keyBytes: Uint8Array<ArrayBuffer>,
  iv: Uint8Array<ArrayBuffer>
): Promise<ArrayBuffer> => {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  return await crypto.subtle.encrypt(
    { iv, name: "AES-GCM" },
    key,
    new TextEncoder().encode(JSON.stringify(payload))
  );
};

describe("ViewStats Channel Snapshot source", () => {
  it("decrypts and validates encrypted metadata responses", async () => {
    const iv = new Uint8Array(new ArrayBuffer(12));
    const keyBytes = new Uint8Array(new ArrayBuffer(32));
    iv.fill(3);
    keyBytes.fill(7);
    const encryptedBody = await encryptPayload(
      {
        data: {
          avatarUrl: "https://example.com/avatar.png",
          displayName: "Example Channel",
          handle: "example",
          subscriberCount: 125_000,
        },
      },
      keyBytes,
      iv
    );
    const source = createViewStatsChannelSnapshotSource({
      apiToken: "secret-token",
      baseUrl: "https://api.example.com",
      fetcher: () =>
        Promise.resolve(
          new Response(encryptedBody, {
            headers: { "content-type": "application/octet-stream" },
          })
        ),
      iv,
      keyBytes,
    });

    const metadata = await source.getMetadata("@example");

    expect(metadata).toEqual({
      avatarUrl: "https://example.com/avatar.png",
      channelName: "Example Channel",
      handle: "example",
      subscriberCount: 125_000,
    });
  });

  it("requests and validates the selected history window", async () => {
    let requestedUrl: URL | undefined;
    let requestedInit: RequestInit | undefined;
    const source = createViewStatsChannelSnapshotSource({
      apiToken: "secret-token",
      baseUrl: "https://api.example.com",
      fetcher: (input, init) => {
        requestedUrl = new URL(input.toString());
        requestedInit = init;

        return Promise.resolve(
          Response.json({
            data: [
              {
                date: "2026-07-20",
                insertedAt: "2026-07-20T12:00:00.000Z",
                subscriberCount: 125_000,
                subscriberCountDelta: 750,
              },
            ],
          })
        );
      },
      iv: new Uint8Array(new ArrayBuffer(12)),
      keyBytes: new Uint8Array(new ArrayBuffer(32)),
    });

    const history = await source.getHistory("@example", 28);

    expect(history).toEqual([
      {
        subscriberCountDelta: 750,
      },
    ]);
    expect(requestedUrl?.pathname).toBe("/channels/%40example/stats");
    expect(Object.fromEntries(requestedUrl?.searchParams ?? [])).toEqual({
      groupBy: "daily",
      range: "28",
      sortOrder: "ASC",
      withBreakdown: "false",
      withEvents: "false",
      withRevenue: "false",
      withToday: "false",
    });
    expect(requestedInit?.headers).toMatchObject({
      Authorization: "Bearer secret-token",
    });
    expect(requestedInit?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    {
      createResponse: () =>
        Promise.resolve(new Response(null, { status: 404 })),
      reason: "not-found",
    },
    {
      createResponse: () => {
        const timeoutError = new Error("request timed out");
        timeoutError.name = "TimeoutError";
        return Promise.reject(timeoutError);
      },
      reason: "timeout",
    },
    {
      createResponse: () => {
        const timeoutError = new Error("body read timed out");
        timeoutError.name = "TimeoutError";
        const body = new ReadableStream({
          pull: (controller) => controller.error(timeoutError),
        });

        return Promise.resolve(
          new Response(body, {
            headers: { "content-type": "application/json" },
          })
        );
      },
      reason: "timeout",
    },
    {
      createResponse: () => Promise.reject(new Error("network failed")),
      reason: "upstream",
    },
    {
      createResponse: () =>
        Promise.resolve(
          new Response("not json", {
            headers: { "content-type": "application/json" },
          })
        ),
      reason: "decode",
    },
    {
      createResponse: () =>
        Promise.resolve(
          new Response(null, {
            headers: { "content-type": "application/json" },
          })
        ),
      reason: "empty-response",
    },
    {
      createResponse: () =>
        Promise.resolve(Response.json({ data: { displayName: "Incomplete" } })),
      reason: "schema",
    },
  ] as const)("classifies $reason failures", async ({
    createResponse,
    reason,
  }) => {
    const source = createViewStatsChannelSnapshotSource({
      apiToken: "secret-token",
      baseUrl: "https://api.example.com",
      fetcher: createResponse,
      iv: new Uint8Array(new ArrayBuffer(12)),
      keyBytes: new Uint8Array(new ArrayBuffer(32)),
    });

    await expect(source.getMetadata("@example")).rejects.toMatchObject({
      reason,
    });
  });
});
