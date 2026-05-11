import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const BACKEND_URL = "http:localhost:8000";

const config = defineConfig({
  resolve: { tsconfigPaths: true },

  plugins: [
    devtools(),
    nitro({
      rollupConfig: { external: [/^@sentry\//] },
      routeRules: {
        "/api/**": { proxy: `${BACKEND_URL}/api/**` },
        "/r/**": {
          proxy: {
            to: `${BACKEND_URL}/r/**`,
            fetchOptions: {
              redirect: "manual",
            },
          },
        },
      },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
