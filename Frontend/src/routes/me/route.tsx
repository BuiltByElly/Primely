import { useUserStore } from "#/store/AuthStore";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      // fetch user data
      try {
        if (!user) {
          const res = await authFetch("/api/me");

          if (!res.ok) {
            throw new Error("Error fetching user");
          }

          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        if (hasNotifiedRef.current) {
          return;
        }

        hasNotifiedRef.current = true;
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
