import { createFileRoute } from "@tanstack/react-router";
import Hero from "./_sections/-Hero";
import { ExternalLink } from "lucide-react";
import { Github } from "#/icons/github";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="w-full h-full">
      <nav className="z-2 flex justify-between items-center px-5 py-3 border-b border-b-border fixed w-full bg-background top-0 left-0">
        <h1 className="font-primely text-[1.7rem] tracking-wide text-primary">
          Primely
        </h1>
        <a href="https://github.com/BuiltByElly/Primely">
          <button className="w-fit text-primary p-2 flex gap-2 rounded-lg transition-colors text-sm items-center bg-primary-soft hover:bg-primary-hover/30">
            <Github
              width={22}
              height={22}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={1.5}
            />{" "}
            Github
            <ExternalLink width={18} height={18} />
          </button>
        </a>
      </nav>
      <Hero />
    </div>
  );
}
