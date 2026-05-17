import { defineConfig, loadEnv } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const config = defineConfig(({ mode }) => {
  const VITE_BACKEND = loadEnv(mode, process.cwd(), "").VITE_BACKEND_URL;
  return {
    resolve: {
      tsconfigPaths: true,
      alias: {
        "#": path.resolve(__dirname),
      },
    },

    plugins: [
      devtools(),
      nitro({
        rollupConfig: { external: [/^@sentry\//] },
        routeRules: {
          "/api/**": { proxy: `${VITE_BACKEND}/api/**` },
          "/r/**": {
            proxy: {
              to: `${VITE_BACKEND}/r/**`,
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
  };
});

export default config;
