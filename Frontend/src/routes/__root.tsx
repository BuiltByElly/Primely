import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import appCss from "../styles.css?url";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import Toasts from "#/components/Toasts";
import { DefaultErrorComponent } from "#/components/Error";
import NotFound from "#/components/NotFound";

const base = import.meta.env.VITE_BASE_URL;
export const Route = createRootRoute({
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
        title: "Primely - URL Shortner",
      },
      {
        name: "description",
        content:
          "A full stack URL Shortner with automatic malware scanning, click event analytics, and a personal dashboard.",
      },
      {
        property: "og:title",
        content: "Primely - URL Shortner",
      },
      {
        property: "og:description",
        content:
          "A full stack URL Shortner with automatic malware scanning, click event analytics, and a personal dashboard.",
      },
      {
        property: "og:image",
        content: `${base}/images/primely.png`,
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:url",
        content: base,
      },
      {
        name: "twitter:description",
        content:
          "A full stack URL Shortner with automatic malware scanning, click event analytics, and a personal dashboard.",
      },
      {
        name: "twitter:image",
        content: `${base}/images/primely.png`,
      },
      {
        name: "twitter:card",
        content: `summary_large_image`,
      },
      {
        name: "twitter:title",
        content: `Primely - URL Shortner`,
      },
      { name: "twitter:url", content: base },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: DefaultErrorComponent,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        throwOnError: true,
      },
    },
  });

  useEffect(() => {
    //@ts-ignore-next-line
    window.__TANSTACK_QUERY_CLIENT__ = queryClient;
  });

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-inter antialiased">
        <QueryClientProvider client={queryClient}>
          {children}
          <Toasts />
        </QueryClientProvider>

        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
