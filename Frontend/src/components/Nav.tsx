import { Link } from "@tanstack/react-router";
import { Plus } from "../icons/plus";
import { getGradientClasses } from "../utils/gradient";
import { EyeOpen } from "#/icons/eye";
import { User } from "#/icons/user";

export default function Nav({
  username,
  email,
  activeButton = "view",
}: {
  username: string;
  email: string;
  activeButton?: "view" | "dashboard";
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/60 backdrop-blur-md">
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
                <User stroke="currentColor" fill="currentColor" /> Dashboard
              </button>
            </Link>
          ) : null}

          <button className="bg-primary text-foreground rounded-md p-2 text-xs flex gap-1 items-center justify-center hover:bg-primary-hover transition-colors">
            <Plus fill="currentColor" /> Add Link
          </button>

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
        </div>
      </nav>
    </header>
  );
}
