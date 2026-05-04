import { findFlagUrlByCountryName } from "country-flags-svg";

const Country = ({ data }: { data: AnalyticsByCountry[] }) => {
  return (
    <div className="w-full bg-card h-[50vh] px-4 rounded-lg border border-border overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent scrollbar-thumb-rounded-full hover:scrollbar-thumb-neutral-light">
      <p className="text-lg bg-card sticky top-0 py-4">
        Top Countries by Click Events
      </p>
      <ul className="mt-4">
        {data.map((item) => (
          <li
            key={item.country}
            className="flex items-center justify-between bg-surface p-2 px-4 rounded-lg hover:bg-surface-elevated mb-3"
          >
            <p>
              <img
                src={
                  findFlagUrlByCountryName(item.country) === ""
                    ? "/images/dashboard-bg.jpg"
                    : findFlagUrlByCountryName(item.country)
                }
                alt={item.country}
                className="w-8 h-8 inline-block mr-2 rounded-full ring-1 ring-border"
              />
              {item.country}
            </p>
            <p>{item.clicks}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Country;
