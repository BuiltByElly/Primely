import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Nav from "#/components/Nav";
import { useUserStore } from "#/store/AuthStore";
import { capitalize } from "#/utils/capitalize";
import {
  BadgeInfo,
  CheckCircle,
  MoveLeft,
  MoveRight,
  TriangleAlertIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authFetchData } from "#/utils/authFetch";
import { validateLink } from "#/utils/validator";
import gsap from "gsap";
import Spinner from "#/components/Spinner";

export const Route = createFileRoute("/me/add/")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useUserStore((s) => s.user);
  if (!user) return;

  const containerRef = useRef<HTMLDivElement>(null!);

  const initialState: LinkCreate = {
    name: "",
    original_link: "",
    lifetime: 30,
  };
  const [formData, setFormData] = useState<LinkCreate>(initialState);

  const [index, setIndex] = useState(0);
  const [state, setState] = useState<"success" | "error" | "loading" | "none">(
    "none",
  );
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Build payload based on type

      await authFetchData("/api/me/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    onSuccess: () => {
      setFormData(initialState);
      setState("success");

      setTimeout(() => {
        navigate({ to: "/me/view" });
      }, 3000);
    },
    onError: () => {
      setState("error");
    },
  });

  const handleSubmit = () => {
    setState("loading");
    mutation.mutate(formData);
  };

  const slide = (nextIndex: number) => {
    const dir = nextIndex > index ? 1 : -1;
    gsap.to(containerRef.current, {
      x: `-${dir * 70}%`,
      opacity: 1,
      duration: 0.2,
      onComplete: () => {
        setIndex(nextIndex);
        gsap.set(containerRef.current, {
          x: `${dir * 70}%`,
          opacity: 0,
        });
        gsap.to(containerRef.current, {
          x: "0%",
          opacity: 1,
          duration: 0.2,
        });
      },
    });
  };
  return (
    <div className="overflow-x-hidden">
      <div>
        <Nav username={user.username} email={user.email} activeButton="add" />
        <div className="p-6 min-h-[90vh]">
          <p className="text-4xl font-manrope mb-4 p-5 pl-0">
            Hey {capitalize(user.username)},
            <span className="text-lg text-neutral mt-3 w-[50%] block">
              Let's walk you through creating a new link!
            </span>
          </p>
          <button
            className="mb-2  bg-neutral-lighter py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-20 disabled:hover:bg-neutral-lighter"
            disabled={index === 0}
            onClick={() => slide(index - 1)}
          >
            <MoveLeft />
          </button>

          <div ref={containerRef}>
            {index === 0 && (
              <div className="w-[50%] ml-15">
                <div className="text-6xl font-manrope font-extralight leading-20">
                  What will be the name of this new short link?
                </div>
                <div className="mt-10 flex gap-4 w-full">
                  <input
                    type="text"
                    required
                    placeholder="some-cool-name"
                    className="w-[90%] focus:outline-none text-foreground border border-foreground rounded-lg p-3 transition-colors duration-200 focus-within:border-primary bg-neutral-lighter/40"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }));
                    }}
                  />
                  <button
                    className=" bg-primary px-4 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-neutral-lighter"
                    disabled={
                      formData.name.trim() === "" ||
                      formData.name.trim().length > 50
                    }
                    onClick={() => slide(1)}
                  >
                    <MoveRight size={30} />
                  </button>
                </div>
                <p className="flex gap-2 mt-2 text-xs text-neutral-light items-center">
                  <BadgeInfo size={20} /> Should be less than 50 characters
                </p>
              </div>
            )}
            {index === 1 && (
              <div className="w-[50%] ml-15">
                <div className="text-6xl font-manrope font-extralight leading-20">
                  We will need the original link, please?
                </div>
                <div className="mt-10 flex gap-4 w-full">
                  <input
                    type="url"
                    value={formData.original_link}
                    required
                    placeholder="some-cool-long-link"
                    className="w-[90%] focus:outline-none text-foreground border border-foreground rounded-lg p-3 transition-colors duration-200 focus-within:border-primary bg-neutral-lighter/40"
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        original_link: e.target.value,
                      }));
                    }}
                  />
                  <button
                    className=" bg-primary px-4 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-neutral-lighter"
                    disabled={
                      formData.original_link === "" ||
                      !validateLink(formData.original_link)
                    }
                    onClick={() => slide(2)}
                  >
                    <MoveRight size={30} />
                  </button>
                </div>
                <p className="flex gap-2 mt-2 text-xs text-neutral-light items-center">
                  <BadgeInfo size={20} /> Should be a valid link
                  (https://example.com/)
                </p>
              </div>
            )}
            {index === 2 && (
              <div className="w-[50%] ml-15">
                <div className="text-6xl font-manrope font-extralight leading-20">
                  How long do you want this link to last?
                </div>
                <div className="mt-10 flex gap-4 w-full text-xl items-center">
                  <label className="">Expire in</label>
                  <select
                    value={formData.lifetime}
                    className="border border-foreground focus:outline-none focus-within:border-primary px-2 rounded-md"
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        lifetime: Number(e.target.value),
                      }));
                    }}
                  >
                    <option
                      value="30"
                      className="bg-surface outline-none border-none"
                    >
                      30
                    </option>
                    <option
                      value="20"
                      className="bg-surface outline-none border-none"
                    >
                      20
                    </option>
                    <option
                      value="10"
                      className="bg-surface outline-none border-none"
                    >
                      10
                    </option>
                    <option
                      value="5"
                      className="bg-surface outline-none border-none"
                    >
                      5
                    </option>
                    <option
                      value="1"
                      className="bg-surface outline-none border-none"
                    >
                      1
                    </option>
                  </select>
                  days
                  <button
                    className={`h-10 px-4 rounded-lg transition-colors
                      ${state === "none" && "bg-accent hover:bg-accent-soft"}
                      ${state === "error" && "bg-red-600 disabled:hover:bg-red-600"}
                      ${state === "success" && "bg-green-500 disabled:hover:bg-green-500"}
                      ${state === "loading" && "bg-neutral-lighter disabled:hover:bg-neutral-lighter"}
                      `}
                    onClick={handleSubmit}
                    disabled={state !== "none"}
                  >
                    {state === "none" && <MoveRight size={30} />}
                    {state === "loading" && (
                      <Spinner
                        innerClassName="border-t-accent"
                        trackClassName="bg-accent/20"
                        outerClassName="bg-neutral-lighter"
                        size="sm"
                        thickness={5}
                      />
                    )}
                    {state === "success" && <CheckCircle />}
                    {state === "error" && <TriangleAlertIcon />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
