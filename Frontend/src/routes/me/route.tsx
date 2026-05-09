import { useUserStore } from "#/store/AuthStore";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authFetch } from "#/utils/authFetch";
import Footer from "#/components/Footer";
import Toasts from "#/components/Toasts";

export const Route = createFileRoute("/me")({
  component: MeLayout,
});

function MeLayout() {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);
  const user = useUserStore((s) => s.user);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      // fetch user data
      try {
        if (!user) {
          const res = await authFetch("/api/me");

          if (!res.ok) {
            throw new Error("Failed to fetch user");
          }

          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate({ to: "/login" });
      } finally {
        setIsReady(true);
      }
    };

    init();
  }, []);

  if (!isReady) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <Outlet />
      <Toasts />
      <Footer />
    </div>
  );
}
