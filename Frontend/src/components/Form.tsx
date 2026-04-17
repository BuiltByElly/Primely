import { Icon } from "@iconify/react";
import { useMutation } from "@tanstack/react-query";

const Form = () => {
  const apiUrl = import.meta.env.VITE_API_URL as string;

  const mutation = useMutation({
    mutationFn: (loginData: FormData) => {
      return fetch(apiUrl + "/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });
    },
  });

  return (
    <div>
      <h1 className="text-center text-[3rem] mt-12 font-primely leading-0 text-primary">
        Primely
      </h1>
      <h1 className="text-center text-[3rem] mt-6 font-manrope">
        Welcome back!
      </h1>
      <div className="flex items-center justify-center min-h-screen top-0 left-0 w-full z-10">
        <form
          className="flex flex-col gap-2.5 p-7.5 w-full max-w-112.5 rounded-[20px] bg-background/80 backdrop-blur-xl"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(new FormData(e.target as HTMLFormElement));
          }}
        >
          {/* Username Section */}
          <section className="mb-2">
            <div className="flex flex-col mb-2">
              <label className="text-foreground text-lg">Username</label>
            </div>
            <div className="flex items-center gap-4 border border-foreground rounded-lg p-3 transition-colors duration-200 focus-within:border-primary bg-neutral-lighter">
              <Icon
                icon="tabler:user-filled"
                width="24"
                height="24"
                style={{ color: "var(--foreground)" }}
              />
              <input
                type="text"
                placeholder="Enter your username"
                className="flex-1 focus:outline-none bg-transparent"
                required
              />
            </div>
          </section>

          {/* Email Section */}
          <section className="mb-2">
            <div className="flex flex-col mb-2">
              <label className="text-foreground text-lg">Email</label>
            </div>
            <div className="flex items-center gap-4 border border-foreground rounded-lg p-3 transition-colors duration-200 focus-within:border-primary bg-neutral-lighter">
              <Icon
                icon="dashicons:email-alt"
                width="26"
                height="26"
                style={{ color: "var(--foreground)" }}
              />
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 focus:outline-none bg-transparent"
                required
              />
            </div>
          </section>

          {/* Password Section */}
          <section>
            <div className="flex flex-col mb-2">
              <label className="text-foreground text-lg">Password</label>
            </div>
            <div className="flex items-center gap-4 border border-foreground rounded-lg p-3 transition-colors duration-200 focus-within:border-primary bg-neutral-lighter">
              <Icon
                icon="carbon:password"
                width="26"
                height="26"
                style={{ color: "var(--foreground)" }}
              />
              <input
                placeholder="Enter your Password"
                className="flex-1 focus:outline-none bg-transparent"
                type="password"
                required
              />
            </div>
          </section>

          {/* Remember Me & Forgot Password */}
          <div className="flex flex-row items-center gap-2.5 justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember-me"
                className="appearance-none w-5 h-5 border-2 border-foreground rounded cursor-pointer checked:bg-primary checked:border-primary focus:outline-none transition-all duration-200"
              />
              <label
                htmlFor="remember-me"
                className="text-sm text-foreground font-normal cursor-pointer"
              >
                Remember me
              </label>
            </div>
            <span className="text-sm text-accent font-medium cursor-pointer hover:underline">
              Forgot password?
            </span>
          </div>

          {/* Log In Button */}
          <button
            className="mt-5 mb-2.5 bg-primary text-foreground font-medium border-none text-base rounded-[10px] h-12 w-full cursor-pointer hover:bg-primary-alternate transition-colors"
            type="submit"
          >
            Log In
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-foreground text-sm my-1">
            Don't have an account?{" "}
            <span className="text-accent font-medium cursor-pointer hover:underline">
              Sign Up
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Form;
