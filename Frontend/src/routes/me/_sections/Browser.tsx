import { AlertTriangle } from "lucide-react";

const Browser = ({ data }: { data: AnalyticsByBrowser[] }) => {
  return (
    <div className="w-full bg-card h-[50vh] px-4 rounded-lg border border-border overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent scrollbar-thumb-rounded-full hover:scrollbar-thumb-neutral-light">
      <p className="text-lg bg-card sticky top-0 py-4">
        Top Browser by Click Events
      </p>
      <ul className="mt-4">
        {data.map((browser) => (
          <li
            key={browser.browser}
            className="flex items-center justify-between bg-surface p-2 px-4 rounded-lg hover:bg-surface-elevated mb-3"
          >
            <p>{browser.browser}</p>
            <p>{browser.clicks}</p>
          </li>
        ))}
        {data.length === 0 && (
          <div className="text-primary flex flex-col justify-center items-center gap-2 h-full">
            <AlertTriangle size={50} />
            No click events yet!
          </div>
        )}
      </ul>
    </div>
  );
};

export default Browser;
