import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "../icons/plus";
import { getGradientClasses } from "../utils/gradient";
import { EyeOpen } from "#/icons/eye";
import { User } from "#/icons/user";
import { LogOut, Menu, XCircle } from "lucide-react";
import { authFetch } from "#/utils/authFetch";
import { useToastStore } from "#/store/ToastStore";
import { useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function Nav({
  username,
  email,
  activeButton = "view",
}: {
  username: string;
  email: string;
  activeButton?: "view" | "dashboard" | "add";
}) {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [menu, setMenu] = useState(false);

  useGSAP(
    () => {
      if (menu) {
        gsap.fromTo(
          ".dropdown",
          { y: -20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.2,
          },
        );
      }
    },
    {
      dependencies: [menu],
    },
  );

  const toggle = (m: boolean) => {
    if (!m) {
      gsap.to(".dropdown", {
        y: -20,
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          setMenu(m);
        },
      });
    } else {
      setMenu(m);
    }
  };
  return (
    <div className="sticky top-0 w-full border-b border-border bg-background/60 backdrop-blur-md z-40">
      <nav className="mx-auto flex w-full items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="font-primely text-2xl tracking-wide transition-opacity text-primary"
        >
          Primely
        </Link>

        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 ${getGradientClasses(username)} rounded-full p-4`}
          />
          <div
            onClick={() => toggle(!menu)}
            className="p-1 border border-border rounded-md hover:bg-foreground/10 transition-colors"
          >
            <Menu />
          </div>
        </div>

        {menu && (
          <div className="absolute top-15 w-[70%] right-5  min-h-10 bg-surface p-2 rounded-md flex flex-col gap-1 dropdown xl:w-sm">
            <p className="text-xs text-neutral-light">{email}</p>
            {activeButton === "view" ? (
              <Link to="/me/view">
                <button className=" w-full text-foreground rounded-md p-2 text-sm flex gap-2 items-center justify-start hover:bg-accent-soft transition-colors">
                  <EyeOpen stroke="currentColor" /> View Links
                </button>
              </Link>
            ) : activeButton === "dashboard" ? (
              <Link to="/me">
                <button className="w-full text-foreground rounded-md p-2 text-sm flex gap-2 items-center justify-start hover:bg-accent-soft transition-colors">
                  <User
                    stroke="currentColor"
                    fill="currentColor"
                    width={18}
                    height={18}
                  />
                  Dashboard
                </button>
              </Link>
            ) : null}

            {activeButton !== "add" ? (
              <Link to="/me/add">
                <button className="w-full text-foreground rounded-md p-2 text-sm flex gap-2 items-center justify-start hover:bg-primary/60 transition-colors">
                  <Plus fill="currentColor" /> Add Link
                </button>
              </Link>
            ) : (
              <Link to="/me/view">
                <button className="w-full text-foreground rounded-md p-2 text-sm flex gap-2 items-center justify-start hover:bg-red-600/60 transition-colors">
                  <XCircle stroke="currentColor" width={18} height={18} />{" "}
                  Cancel
                </button>
              </Link>
            )}
            <hr className="opacity-30" />

            <button
              className="text-red-600 flex items-center justify-start gap-2 p-2 rounded-md transition-colors hover:bg-red-600/20"
              onClick={async () => {
                const res = await authFetch("/api/auth/logout", {
                  method: "DELETE",
                });
                if (res.ok) {
                  navigate({ to: "/login" });
                  addToast({
                    state: "success",
                    text: "Logged out successfully",
                  });
                }
              }}
            >
              <LogOut size={20} /> Log out
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}
