import Nav from "#/components/Nav";
import { Plus } from "#/icons/plus";
import { useUserStore } from "#/store/AuthStore";
import { authFetch, authFetchData } from "#/utils/authFetch";
import { capitalize } from "#/utils/capitalize";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeInfo,
  Copy,
  CopyCheck,
  Edit,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import EditModal from "../_sections/-EditModal";
import { useLinkUpdateStore } from "#/store/LinkStore";
import { useToastStore } from "#/store/ToastStore";
import Loading from "#/components/Loading";

export const Route = createFileRoute("/me/view/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [hasCopiedID, setHasCopiedID] = useState<number>(-1);
  const {
    linkId,
    setLinkId,
    oldName,
    setOldName,
    oldOriginalLink,
    setOldOriginalLink,
  } = useLinkUpdateStore();
  const { addToast } = useToastStore();
  const [isMobile, setIsMobile] = useState(false);

  const user = useUserStore((s) => s.user);
  if (!user) return null;

  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["linkData", user.public_id],
    queryFn: () =>
      authFetchData<LinkData[]>("/api/me/links", {
        method: "GET",
      }),
    refetchInterval: (query) => {
      const links = query.state.data as LinkData[];
      const isPending = links?.some(
        (link) => link.status === "scanning" || link.status === "failed",
      );
      return isPending ? 3000 : false;
    },
  });

  useEffect(() => {
    if (!data) return;
    if (data.some((link) => link.status === "scanning")) {
      addToast({
        state: "info",
        text: "Currently scanning unactive links, give it a moment.",
      });
    } else if (data.some((link) => link.status === "failed")) {
      addToast({
        state: "error",
        text: "Oops, an error occued while scanning some unactive links.",
      });
    }
  }, [data]);

  useEffect(() => {
    if (window.innerWidth < 1280) {
      setIsMobile(true);
    }
  });
  const deleteLink = async (link_id: number) => {
    const res = await authFetch(`/api/me/links/${link_id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      queryClient.invalidateQueries({
        queryKey: ["linkData"],
      });
      addToast({
        state: "success",
        text: "Link deleted successfully!",
      });
    } else {
      addToast({
        state: "error",
        text: "Oops, an error occurred while trying to delete link.",
      });
    }
  };

  if (isLoading) return <Loading />;

  const activeLinks = data?.filter((val) => val.status === "active").length;
  const maliciousLinks = data?.filter(
    (val) => val.status === "malicious",
  ).length;
  const expiredLinks = data?.filter((val) => val.status === "expired").length;
  const failedLinks = data?.filter((val) => val.status === "failed").length;

  const stats = [
    { num: activeLinks || 0, title: "Active Links", color: "text-accent" },
    { num: expiredLinks || 0, title: "Expired Links", color: "text-red-600" },
    {
      num: maliciousLinks || 0,
      title: "Malicious Links",
      color: "text-red-600",
    },
    {
      num: failedLinks || 0,
      title: "Failed Links",
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

  const hour = new Date().getHours(); // 0–23

  const greeting =
    hour < 12 ? "Good morning" : hour < 16 ? "Good afternoon" : "Good evening";

  return (
    <div className=" text-foreground relative">
      {linkId && (
        <EditModal
          link_id={linkId}
          oldName={oldName}
          oldOriginalLink={oldOriginalLink}
        />
      )}

      <Nav
        username={user.username}
        email={user.email}
        activeButton="dashboard"
      />

      <div className="p-3 lg:p-6">
        <p className="text-3xl font-manrope mb-7 p-5 pl-0 xl:text-4xl">
          {greeting}, {capitalize(user.username)}
          <span className="text-lg block text-neutral mt-4 xl:w-[40%]">
            This section of your dashboard shows you active, scanning and
            expired links, providing an at-a-glance overview of your total link
            statistics.
          </span>
        </p>
        <div className="grid grid-cols-2 gap-6 w-full xl:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              className="bg-card p-3 mt-3 rounded-md border border-border"
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
          {data?.length === 0 && (
            <div>
              <p className="flex flex-col my-7 items-center justify-center gap-2">
                <span className="flex text-neutral-light items-center gap-2 justify-center">
                  <BadgeInfo /> You have not created any short link yet!
                </span>
                <Link to="/me/add">
                  <button className="bg-primary text-foreground rounded-md p-2 text-xs flex gap-1 items-center justify-center hover:bg-primary-hover transition-colors">
                    <Plus fill="currentColor" /> Create Short Link
                  </button>
                </Link>
              </p>
            </div>
          )}

          {!isMobile ? (
            <>
              {data?.map((val) => (
                <li
                  className="flex justify-between items-center bg-card border border-border px-5 py-4 rounded-lg mb-3"
                  key={val.id}
                >
                  <p>
                    {capitalize(val.name)}
                    <a
                      href={val.status !== "malicious" ? val.original_link : ""}
                      target="_blank"
                    >
                      <button className=" hover:text-foreground/50 transition-colors ml-1">
                        <ExternalLink size={20} />
                      </button>
                    </a>
                  </p>
                  <p className="flex gap-2 items-center">
                    {val.short_code ?? "none!"}
                    <button
                      className={`text-sm p-1.5 transition-colors rounded-lg ${hasCopiedID === val.id ? "bg-green-500/20" : "bg-foreground/20 hover:bg-foreground/30 disabled:hover:bg-foreground/20"}`}
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          val.short_code
                            ? `${window.location.host}/r/${val.short_code}`
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
                      onClick={async () => await deleteLink(val.id)}
                    >
                      <Trash2 className="text-red-500" size={20} />
                    </button>
                    <button
                      title="Edit"
                      className="p-1 transition-colors rounded-lg bg-accent/20 hover:bg-accent/30"
                    >
                      <Edit
                        className="text-accent"
                        size={20}
                        onClick={() => {
                          setLinkId(val.id);
                          setOldName(val.name);
                          setOldOriginalLink(val.original_link);
                        }}
                      />
                    </button>
                    <Link
                      to={`/me/view/$linkid`}
                      params={{ linkid: val.id.toString() }}
                    >
                      <button
                        title="Analytics"
                        className="p-1 transition-colors rounded-lg bg-foreground/20 hover:bg-foreground/30"
                      >
                        <BadgeInfo className="text-foreground" size={20} />
                      </button>
                    </Link>
                  </p>

                  <p className={state[val.status].css}>{val.status}</p>
                </li>
              ))}
            </>
          ) : (
            <>
              {data?.map((val) => (
                <li
                  className="flex justify-between items-center bg-card border border-border px-5 py-4 rounded-lg mb-3"
                  key={val.id}
                >
                  <div>
                    <p className="mb-2">
                      {capitalize(val.name)}{" "}
                      <a
                        href={
                          val.status !== "malicious" ? val.original_link : ""
                        }
                        target="_blank"
                      >
                        <button>
                          <ExternalLink className="text-foreground" size={20} />
                        </button>
                      </a>
                    </p>
                    <p
                      className="flex gap-1 items-center text-neutral underline cursor-pointer"
                      onClick={async () => {
                        if (hasCopiedID === val.id || !val.short_code) return;
                        await navigator.clipboard.writeText(
                          val.short_code
                            ? `${window.location.host}/r/${val.short_code}`
                            : "",
                        );
                        setHasCopiedID(val.id);
                        setTimeout(() => setHasCopiedID(-1), 1500);
                      }}
                    >
                      {val.short_code ?? "none!"}
                      <span
                        className={`text-sm  transition-colors rounded-lg
                     `}
                      >
                        {hasCopiedID === val.id ? (
                          <CopyCheck size={15} className="text-green-500" />
                        ) : (
                          <Copy size={15} />
                        )}
                      </span>
                    </p>
                  </div>

                  {/*Actions*/}
                  <p className="flex gap-2 items-center">
                    <button
                      className="p-1 transition-colors rounded-lg bg-red-600/20 hover:bg-red-600/30"
                      title="Delete"
                      onClick={async () => await deleteLink(val.id)}
                    >
                      <Trash2 className="text-red-500" size={20} />
                    </button>
                    <button
                      title="Edit"
                      className="p-1 transition-colors rounded-lg bg-accent/20 hover:bg-accent/30"
                    >
                      <Edit
                        className="text-accent"
                        size={20}
                        onClick={() => {
                          setLinkId(val.id);
                          setOldName(val.name);
                          setOldOriginalLink(val.original_link);
                        }}
                      />
                    </button>
                    <Link
                      to={`/me/view/$linkid`}
                      params={{ linkid: val.id.toString() }}
                    >
                      <button
                        title="Analytics"
                        className="p-1 transition-colors rounded-lg bg-foreground/20 hover:bg-foreground/30"
                      >
                        <BadgeInfo className="text-foreground" size={20} />
                      </button>
                    </Link>
                  </p>

                  <p className={state[val.status].css}>{val.status}</p>
                </li>
              ))}
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
