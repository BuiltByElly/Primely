import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "../icons/plus";
import { getGradientClasses } from "../utils/gradient";
import { EyeOpen } from "#/icons/eye";
import { User } from "#/icons/user";
import { LogOut, XCircle } from "lucide-react";
import { authFetch } from "#/utils/authFetch";

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
  return (
    <div className="sticky top-0 w-full border-b border-border bg-background/60 backdrop-blur-md">
      <nav className="mx-auto flex w-full items-center justify-between px-6 py-3">
        <Link
          to="/"
          className="font-primely text-2xl tracking-wide transition-opacity text-primary"
        >
          Primely
        </Link>

        <div className="flex items-center gap-5 ">
          {activeButton === "view" ? (
            <Link to="/me/view">
              <button className="bg-accent text-foreground rounded-md p-2 text-xs flex gap-1 items-center justify-center hover:bg-accent-soft transition-colors">
                <EyeOpen stroke="currentColor" /> View Links
              </button>
            </Link>
          ) : activeButton === "dashboard" ? (
            <Link to="/me">
              <button className="bg-accent text-foreground rounded-md p-2 text-xs flex gap-1 items-center justify-center hover:bg-accent-soft transition-colors">
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
              <button className="bg-primary text-foreground rounded-md p-2 text-xs flex gap-1 items-center justify-center hover:bg-primary-hover transition-colors">
                <Plus fill="currentColor" /> Add Link
              </button>
            </Link>
          ) : (
            <Link to="/me/view">
              <button className="bg-red-600 text-foreground rounded-md p-2 text-xs flex gap-1 items-center justify-center hover:bg-red-600/80 transition-colors">
                <XCircle stroke="currentColor" width={18} height={18} /> Cancel
              </button>
            </Link>
          )}

          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 ${getGradientClasses(username)} rounded-full p-4`}
            ></div>
            <div>
              <div className="text-sm font-manrope text-foreground">
                {username.charAt(0).toUpperCase() + username.slice(1)}
              </div>
              <div className="text-xs text-neutral-light">{email}</div>
            </div>
          </div>
          <button
            className="text-red-600 p-2 rounded-full transition-colors hover:bg-red-600/20"
            onClick={async () => {
              const res = await authFetch("/api/auth/logout", {
                method: "DELETE",
              });
              if (res.ok) navigate({ to: "/login" });
            }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>
    </div>
  );
}
