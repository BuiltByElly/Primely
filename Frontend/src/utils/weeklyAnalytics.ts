export function getWeeklyAnalytics(data: AnalyticsByDate[]) {
  console.log(data);
  const last7Days = [...data].slice(-7);

  const chartData = last7Days.map((item) => ({
    ...item,
    day: new Date(item.date)
      .toLocaleDateString("en-US", { weekday: "long" })
      .slice(0, 3),
  }));

  const currentTotal = last7Days.reduce((sum, item) => sum + item.clicks, 0);
  const previousTotal = [...data]
    .slice(-14, -7)
    .reduce((sum, item) => sum + item.clicks, 0);

  const rate =
    previousTotal === 0
      ? currentTotal > 0
        ? 100
        : 0
      : ((currentTotal - previousTotal) / previousTotal) * 100;

  return {
    data: chartData,
    rate,
  };
}
