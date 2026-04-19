import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/me/")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = Route.useLoaderData();
  if (!user) return null;

  return <div>Hello "/me" {user}!</div>;
}
