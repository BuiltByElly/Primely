import { createFileRoute } from "@tanstack/react-router";
import Form from "#/components/Form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="relative max-w-screen min-h-screen p-3 overflow-x-hidden ">
      <Form />
    </div>
  );
}
