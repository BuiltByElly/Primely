import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { type ErrorComponentProps } from "@tanstack/react-router";

export const DefaultErrorComponent = ({
  error,
  reset,
}: ErrorComponentProps) => {
  const { reset: resetQueries } = useQueryErrorResetBoundary();
  const handleRetry = () => {
    resetQueries();
    reset();
  };
  return (
    <div className="w-screen h-screen fixed z-50 bg-background">
      <div className="flex flex-col justify-center items-center h-full gap-2">
        <h1 className=" font-primely text-primary text-6xl">Primely</h1>
        <p className="text-red-600 text-center font-manrope text-lg">
          An error has occurred, but let's give it another shot!
        </p>
        <p className="text-red-800 text-center font-manrope text-md">
          {error?.message}
        </p>
        <button
          className="text-red-700 bg-red-600/20 p-2 px-4 rounded-lg mt-5 hover:bg-red-600/30 transition-colors"
          onClick={handleRetry}
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default Error;
