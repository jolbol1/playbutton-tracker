# playbutton-tracker

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Self, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the fullstack application.

## Deployment (Cloudflare Workers)

- Dev: `cd apps/web && bun run dev`
- Preview production build: `cd apps/web && bun run preview`
- Deploy: `cd apps/web && bun run deploy`
- Generate Worker env types: `cd apps/web && bun run cf-typegen`

This app now uses Cloudflare's native TanStack Start deployment flow with `wrangler` and `@cloudflare/vite-plugin`.
See the [Cloudflare TanStack Start guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/) for CI/build settings and custom domain configuration.

## Project Structure

```
playbutton-tracker/
├── apps/
│   └── web/         # Fullstack application (React + TanStack Start)
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run deploy`: Build and deploy the web app to Cloudflare Workers
- `bun run check-types`: Check TypeScript types across all apps
