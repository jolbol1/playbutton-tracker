import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });

const app = await alchemy("playbutton-tracker");
const {
  CORS_ORIGIN,
  VIEWSTATS_API_TOKEN,
  VIEWSTATS_BASE_URL,
  VIEWSTATS_IV_SOURCE,
  VIEWSTATS_KEY_SOURCE,
} = alchemy.env;

if (CORS_ORIGIN === undefined) {
  throw new Error("Missing CORS_ORIGIN for web bindings");
}

if (VIEWSTATS_API_TOKEN === undefined) {
  throw new Error("Missing VIEWSTATS_API_TOKEN for web bindings");
}

if (VIEWSTATS_BASE_URL === undefined) {
  throw new Error("Missing VIEWSTATS_BASE_URL for web bindings");
}

if (VIEWSTATS_IV_SOURCE === undefined) {
  throw new Error("Missing VIEWSTATS_IV_SOURCE for web bindings");
}

if (VIEWSTATS_KEY_SOURCE === undefined) {
  throw new Error("Missing VIEWSTATS_KEY_SOURCE for web bindings");
}

export const web = await TanStackStart("web", {
  cwd: "../../apps/web",
  bindings: {
    CORS_ORIGIN,
    VIEWSTATS_API_TOKEN,
    VIEWSTATS_BASE_URL,
    VIEWSTATS_IV_SOURCE,
    VIEWSTATS_KEY_SOURCE,
  },
});

console.log(`Web    -> ${web.url}`);

await app.finalize();
