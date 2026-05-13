import { useUserStore } from "#/store/AuthStore";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authFetch } from "#/utils/authFetch";
import Footer from "#/components/Footer";
import Loading from "#/components/Loading";
import { useToastStore } from "#/store/ToastStore";

export const Route = createFileRoute("/me")({
  component: MeLayout,
});

function MeLayout() {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);
  const user = useUserStore((s) => s.user);
  const [isReady, setIsReady] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    const init = async () => {
      // fetch user data
      try {
        if (!user) {
          const res = await authFetch("/api/me");


          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 500);
        addToast({
          state: "error",
          text: "Oops, seems the system does not know who you are. Try logging in.",
        });
      } finally {
        setIsReady(true);
      }
    };

    init();
  }, []);

  if (!isReady) return <Loading />;

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <Outlet />
      <Footer />
    </div>
  );
}
