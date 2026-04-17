import clsx from "clsx";

const Background = () => {
  const styles = [
    "bg-[#FF9F1C] -translate-x-20",
    "bg-[#EF8354] -translate-x-30 translate-y-30",
    "bg-[#731DD8] -translate-x-50 translate-y-0",
    "bg-[#E086D3] -translate-x-70 translate-y-30",
  ];

  return (
    <div className="fixed -bottom-30 flex">
      {styles.map((style, i) => (
        <div
          key={i}
          className={clsx(style, "p-3 rounded-full w-100 h-100 blur-[100px]")}
        />
      ))}
    </div>
  );
};

export default Background;
