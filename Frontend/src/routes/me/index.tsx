import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "#/store/AuthStore";

export const Route = createFileRoute("/me/")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return <div>Hello "/me"! {user.public_id}</div>;
}
