import Form from "#/components/Form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="relative max-w-screen min-h-screen p-3 overflow-x-hidden ">
      <Form type="register" />
    </div>
  );
}
