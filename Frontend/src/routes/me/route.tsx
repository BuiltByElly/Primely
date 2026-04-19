import { useAuthStore } from "#/store/AuthStore";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

const apiUrl = "/api";

export const getAccessToken = async () => {
  const res = await fetch(
    `${apiUrl}/auth/refresh?remember_me=${useAuthStore.getState().rememberMe}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) return null;

  const data = await res.json();
  useAuthStore.getState().setAccessToken(data.access_token);
  return data.access_token as string;
};

export const Route = createFileRoute("/me")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    let accessToken = useAuthStore.getState().accessToken;
    console.log(accessToken);

    if (!accessToken) {
      accessToken = await getAccessToken();
      if (!accessToken) throw redirect({ to: "/login" });
    }
  },
  loader: async () => {
    if (typeof window === "undefined") return;

    const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`/api/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return { user: data };
  },
  component: MeLayout,
});

function MeLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  );
}
