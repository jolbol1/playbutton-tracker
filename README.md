# Play Button Tracker

Track a YouTube channel's progress toward its next creator award and estimate milestone timelines from recent subscriber growth.

## Stack

- TanStack Start
- React 19
- Tailwind CSS
- Cloudflare Workers
- Bun + Turborepo

## Local Development

```bash
bun install
bun run dev
```

The web app runs at `http://localhost:3001`.

## Required Environment Variables

- `VIEWSTATS_BASE_URL`
- `VIEWSTATS_IV_SOURCE`
- `VIEWSTATS_KEY_SOURCE`
- `VIEWSTATS_API_TOKEN`

For local development, put them in `apps/web/.env`.
For production, configure them in Cloudflare Workers. Keep sensitive values as Worker secrets.

## Useful Commands

```bash
bun run dev
bun run build
bun run deploy
```

If you want to work directly in the web app package:

```bash
cd apps/web
bun run dev
bun run preview
bun run deploy
```
