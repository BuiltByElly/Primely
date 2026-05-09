import { useNavigate } from "@tanstack/react-router";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="w-screen h-screen fixed z-50 bg-background">
      <div className="flex flex-col justify-center items-center h-full gap-2">
        <h1 className=" font-primely text-primary text-[10rem] leading-30">
          404
        </h1>
        <p className=" text-center font-manrope text-xl">
          Where did you think you were going to?
        </p>
        <button
          className="text-primary bg-primary-soft p-2 px-4 rounded-lg mt-5 hover:bg-primary/30 transition-colors"
          onClick={() => navigate({ to: "/me" })}
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
