import Nav from "#/components/Nav";
import { useAuthStore } from "#/store/AuthStore";
import { authFetchData } from "#/utils/authFetch";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeInfo, Copy, CopyCheck, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
export const Route = createFileRoute("/me/view")({
  component: RouteComponent,
});

export function RouteComponent() {
  const [hasCopiedID, setHasCopiedID] = useState<number>(-1);
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const hour = new Date().getHours(); // 0–23

  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const { data, isLoading } = useQuery({
    queryKey: ["linkData", user.public_id],
    queryFn: () =>
      authFetchData<LinkData[]>("/api/me/links", {
        method: "GET",
      }),
  });
  if (isLoading) return <div>Loading links...</div>;

  const activeLinks = data?.filter((val) => val.status === "active").length;
  const maliciousLinks = data?.filter(
    (val) => val.status === "malicious",
  ).length;
  const scanningLinks = data?.filter((val) => val.status === "scanning").length;
  const expiredLinks = data?.filter((val) => val.status === "expired").length;

  const stats = [
    { num: activeLinks || 0, title: "Active Links", color: "text-accent" },
    { num: expiredLinks || 0, title: "Expired Links", color: "text-red-600" },
    { num: scanningLinks || 0, title: "Scanning Links", color: "text-primary" },
    {
      num: maliciousLinks || 0,
      title: "Malicious Links",
      color: "text-red-600",
    },
  ];

  const state = {
    active: {
      css: "text-green-500 bg-green-500/20 py-1 border border-green-500 px-2 text-sm rounded-md",
    },
    scanning: {
      css: "text-primary bg-primary/20 py-1 border border-primary px-2 text-sm rounded-md",
    },
    expired: {
      css: "text-red-600 bg-red-600/20 py-1 border border-red-600 px-2 text-sm rounded-md",
    },
    malicious: {
      css: "text-red-600 bg-red-600/20 py-1 border border-red-600 px-2 text-sm rounded-md",
    },
    failed: {
      css: "text-red-600 bg-red-600/20 py-1 border border-red-600 px-2 text-sm rounded-md",
    },
  };

  return (
    <div className=" text-foreground">
      <div>
        <Nav
          username={user.username}
          email={user.email}
          activeButton="dashboard"
        />
        <div className="p-6">
          <p className="text-4xl font-manrope mb-7 p-5 pl-0">
            {greeting},{" "}
            {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
            <span className="text-lg text-neutral mt-4 w-[50%] block">
              This section of your dashboard shows you active, scanning and
              expired links, providing an at-a-glance overview of your total
              link statistics.
            </span>
          </p>
          <div className="flex justify-between">
            {stats.map((stat, i) => (
              <div
                className="bg-card p-3 mt-3 w-[21%] rounded-md border border-border"
                key={i}
              >
                <p className="text-neutral-light">{stat.title} </p>
                <p
                  className={`text-4xl mt-3 ${stat.num > 0 ? stat.color : "text-accent"}`}
                >
                  {stat.num}
                </p>
              </div>
            ))}
          </div>

          <ul className="mt-10">
            {data?.map((val) => (
              <li
                className="flex justify-between items-center bg-card border border-border px-5 py-4 rounded-lg mb-3"
                key={val.id}
              >
                <p>{val.name}</p>
                <p className="flex gap-2 items-center">
                  {val.short_code ?? "none!"}
                  <button
                    className={`text-sm p-1.5 transition-colors rounded-lg ${hasCopiedID === val.id ? "bg-green-500/20" : "bg-foreground/20 hover:bg-foreground/30"}`}
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        val.short_code
                          ? `${window.location.hostname}/r/${val.short_code}`
                          : "",
                      );
                      setHasCopiedID(val.id);
                      setTimeout(() => setHasCopiedID(-1), 1500);
                    }}
                    disabled={hasCopiedID === val.id || !val.short_code}
                  >
                    {hasCopiedID === val.id ? (
                      <CopyCheck size={15} className="text-green-500" />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                </p>
                <p className="flex gap-2 items-center">
                  <button
                    className="p-1 transition-colors rounded-lg bg-red-600/20 hover:bg-red-600/30"
                    title="Delete"
                  >
                    <Trash2 className="text-red-500" size={20} />
                  </button>
                  <button
                    title="Edit"
                    className="p-1 transition-colors rounded-lg bg-accent/20 hover:bg-accent/30"
                  >
                    <Edit className="text-accent" size={20} />
                  </button>
                  <button
                    title="Info"
                    className="p-1 transition-colors rounded-lg bg-primary-soft hover:bg-primary/30"
                  >
                    <BadgeInfo className="text-primary" size={20} />
                  </button>
                </p>

                <p className={state[val.status].css}>{val.status}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
