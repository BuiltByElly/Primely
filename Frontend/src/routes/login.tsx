import Background from "#/components/Background";
import { createFileRoute } from "@tanstack/react-router";
import Form from "#/components/Form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="relative max-w-screen min-h-screen p-3 overflow-x-hidden">
      <img
        src="/images/login-img.png"
        alt="login"
        className="brightness-70 fixed w-full h-full -z-1 top-0 right-0"
      />
      <Form />

      {/*<Background />*/}
    </div>
  );
}
