import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    VIEWSTATS_BASE_URL: z.url(),
    VIEWSTATS_IV_SOURCE: z.string().min(1),
    VIEWSTATS_KEY_SOURCE: z.string().min(1),
    VIEWSTATS_API_TOKEN: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
