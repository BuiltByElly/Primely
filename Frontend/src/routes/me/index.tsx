import { createFileRoute } from "@tanstack/react-router";
import { useUserStore } from "#/store/AuthStore";
import Nav from "#/components/Nav";
import { useQuery } from "@tanstack/react-query";
import { authFetchData } from "#/utils/authFetch";
import Country from "./_sections/Country";
import Browser from "./_sections/Browser";
import Graph from "./_sections/Graph";
import { capitalize } from "#/utils/capitalize";

export const Route = createFileRoute("/me/")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useUserStore((s) => s.user);
  if (!user) return null;

  const hour = new Date().getHours(); // 0–23

  const greeting =
    hour < 12 ? "Good morning" : hour < 16 ? "Good afternoon" : "Good evening";

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics", user.public_id],
    queryFn: () => authFetchData<AnalyticsData>("/api/me/analytics"),
  });
  if (isLoading && !data) return <div>Loading analytics...</div>;
  if (!data) return;

  return (
    <div className=" text-foreground">
      <div className="">
        <Nav username={user.username} email={user.email} />
        <div className="p-6">
          <p className="text-4xl font-manrope mb-7 p-5">
            {greeting}, {capitalize(user.username)}
            <span className="text-lg text-neutral mt-4 w-[40%] block">
              This is your primary dashboard, providing an at-a-glance overview
              of your total link click events statistics.
            </span>
          </p>
          <div className="flex-col items-center gap-3 flex">
            <Graph data={data.clicks_over_time} />
            <div className="flex gap-3 items-center w-full">
              <Country data={data.clicks_by_country} />
              <Browser data={data.clicks_by_browser} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
