import { useRememberMeStore, useAuthStore } from "#/store/AuthStore";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const getAccessToken = async () => {
  const res = await fetch(
    `/api/auth/refresh?remember_me=${useRememberMeStore.getState().rememberMe}`,
    { method: "POST", credentials: "include" },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token as string;
};

export const Route = createFileRoute("/me")({
  component: MeLayout,
});

function MeLayout() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      let token = accessToken;

      if (!token) {
        token = await getAccessToken();
        setAccessToken(token);
        if (!token) {
          navigate({ to: "/login" });
          return;
        }
      }

      // fetch user data
      try {
        const res = await fetch(`/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
        setAccessToken(null);
        navigate({ to: "/login" });
      } finally {
        setIsReady(true);
      }
    };

    init();
  }, []);

  if (!isReady) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  );
}
