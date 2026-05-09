import { useUserStore } from "#/store/AuthStore";
import { authFetch, authFetchData } from "#/utils/authFetch";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { capitalize } from "#/utils/capitalize";
import Nav from "#/components/Nav";
import { useEffect, useState } from "react";
import { Copy, CopyCheck, Edit, ExternalLink, Trash2 } from "lucide-react";
import Graph from "../_sections/-Graph";
import Country from "../_sections/-Country";
import Browser from "../_sections/-Browser";
import { useLinkUpdateStore } from "#/store/LinkStore";
import EditModal from "../_sections/-EditModal";
import { useToastStore } from "#/store/ToastStore";
import Loading from "#/components/loading";

export const Route = createFileRoute("/me/view/$linkid")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const user = useUserStore((s) => s.user);
  const [hasCopied, setHasCopied] = useState(false);
  const navigate = useNavigate();
  const {
    linkId,
    setLinkId,
    oldName,
    setOldName,
    oldOriginalLink,
    setOldOriginalLink,
  } = useLinkUpdateStore();
  const { addToast } = useToastStore();

  if (!user) return null;

  const { data: datum, isLoading: datumLoading } = useQuery({
    queryKey: ["linkDatum", user.public_id],
    queryFn: () =>
      authFetchData<LinkData>(`/api/me/links/${params.linkid}`, {
        method: "GET",
      }),
    refetchInterval: (query) => {
      const link = query.state.data;
      const isPending = link?.status === "scanning";
      return isPending ? 3000 : false;
    },
  });

  useEffect(() => {
    if (!datum) return;
    if (datum.status === "scanning") {
      addToast({
        state: "info",
        text: "Currently scanning link, give it a moment.",
      });
    } else if (datum.status === "failed") {
      addToast({
        state: "error",
        text: "Oops, an error occued while scanning this link.",
      });
    }
  }, [datum]);

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["linkAnalyticsData", user.public_id],
    queryFn: () =>
      authFetchData<AnalyticsData>(`/api/me/analytics/${datum?.id}`, {
        method: "GET",
      }),
    enabled: !!datum?.id,
  });

  const deleteLink = async (link_id: number) => {
    const res = await authFetch(`/api/me/links/${link_id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      addToast({
        state: "success",
        text: "Link deleted successfully!",
      });
      navigate({ to: "/me/view" });
    } else {
      addToast({
        state: "error",
        text: "Oops, an error occurred while trying to delete link.",
      });
    }
  };

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

  if (isLoading || datumLoading) return <Loading />;

  if (!analyticsData || !datum) return;

  return (
    <div className=" text-foreground relative">
      {linkId && (
        <EditModal
          link_id={linkId}
          oldName={oldName}
          oldOriginalLink={oldOriginalLink}
        />
      )}
      <Nav username={user.username} email={user.email} activeButton="view" />
      <div className="p-6">
        <p className="text-4xl font-manrope mb-5 p-5 pl-0 flex items-start gap-1">
          {capitalize(datum.name)}{" "}
          <a href={datum.original_link} target="_blank">
            <ExternalLink size={22} className="text-neutral" />
          </a>
        </p>
        <div className="flex flex-col gap-3 mb-5">
          <p>
            Status:{"  "}
            <span className={state[datum.status].css}>{datum.status}</span>
          </p>
          <p>
            Original link:{" "}
            <span className="text-neutral-light">{datum.original_link}</span>
          </p>
          <p className="flex gap-2 items-center">
            Short code:{" "}
            <span className="text-neutral-light">
              {datum.short_code ?? "none!"}
            </span>
            <button
              className={`text-sm p-1.5 transition-colors rounded-lg ${hasCopied ? "bg-green-500/20" : "bg-foreground/20 hover:bg-foreground/30 disabled:hover:bg-foreground/20"}`}
              onClick={async () => {
                await navigator.clipboard.writeText(
                  datum.short_code
                    ? `${window.location.host}/r/${datum.short_code}`
                    : "",
                );
                setHasCopied(true);
                setTimeout(() => setHasCopied(false), 1500);
              }}
              disabled={hasCopied || !datum.short_code}
            >
              {hasCopied ? (
                <CopyCheck size={15} className="text-green-500" />
              ) : (
                <Copy size={15} />
              )}
            </button>
          </p>
          <p>
            Created on:{" "}
            <span className="text-neutral-light">
              {new Date(datum.created_at).toDateString()}
            </span>
          </p>
          <p>
            Expires on:{" "}
            <span className="text-neutral-light">
              {new Date(datum.expires_at).toDateString()}
            </span>
          </p>
          <p className="flex gap-2 items-center">
            <button
              className="p-1 transition-colors rounded-lg bg-red-600/20 hover:bg-red-600/30"
              title="Delete"
              onClick={async () => await deleteLink(datum.id)}
            >
              <Trash2 className="text-red-500" size={20} />
            </button>
            <button
              title="Edit"
              className="p-1 transition-colors rounded-lg bg-accent/20 hover:bg-accent/30"
              onClick={() => {
                setLinkId(datum.id);
                setOldName(datum.name);
                setOldOriginalLink(datum.original_link);
              }}
            >
              <Edit className="text-accent" size={20} />
            </button>
          </p>
        </div>
        <Graph data={analyticsData.clicks_over_time} />
        <div className="flex gap-3 items-center w-full mt-3">
          <Country data={analyticsData.clicks_by_country} />
          <Browser data={analyticsData.clicks_by_browser} />
        </div>
      </div>
    </div>
  );
}
