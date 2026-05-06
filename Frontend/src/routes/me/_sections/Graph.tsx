import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ArrowUp, ArrowDown } from "#/icons/arrow";
import { Circle } from "#/icons/circle";
import { getWeeklyAnalytics } from "#/utils/weeklyAnalytics";

export default function Graph({ data }: { data: AnalyticsByDate[] }) {
  const weeklyAnalytics = getWeeklyAnalytics(data);
  const rate = weeklyAnalytics.rate;
  const chartData = weeklyAnalytics.data;

  const rateTone =
    rate > 0 ? "text-accent" : rate < 0 ? "text-red-400" : "text-neutral-light";

  const RateIcon = rate > 0 ? ArrowUp : rate < 0 ? ArrowDown : Circle;

  return (
    <div className="w-full rounded-lg border border-border bg-card p-5">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-neutral-light text-lg">Click rate (%)</p>
          <div className={`mt-1 flex items-center gap-2 ${rateTone}`}>
            {RateIcon ? (
              <RateIcon fill="currentColor" className="h-5 w-5" />
            ) : null}
            <span className="text-3xl font-semibold leading-none">
              {rate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="h-[38vh]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="day"
              stroke="var(--neutral-light)"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="var(--neutral-light)"
              axisLine={false}
              tickLine={false}
            />
            <Line
              type="monotone"
              dataKey="clicks"
              stroke="var(--primary)"
              strokeWidth={3}
              dot={{
                fill: "var(--card)",
                stroke: "var(--primary)",
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{ stroke: "var(--primary)", strokeWidth: 2, r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
