import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import Spinner from "./Spinner";
import FormInput from "./FormInput";
import { useAuthStore } from "#/store/AuthStore";

const FORM_FIELDS = [
  {
    name: "username",
    label: "Username",
    type: "text",
    placeholder: "Enter your username",
    icon: "tabler:user-filled",
    iconWidth: 24,
    iconHeight: 24,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "Enter your email",
    icon: "dashicons:email-alt",
    iconWidth: 26,
    iconHeight: 26,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    icon: "carbon:password",
    iconWidth: 26,
    iconHeight: 26,
  },
] as const;

const INITIAL_STATE: LoginData = {
  username: "",
  email: "",
  password: "",
  rememberMe: false,
};

const Form = () => {
  const apiUrl = "/api";
  const [formData, setFormData] = useState<LoginData>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);

  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setRememberMe = useAuthStore((s) => s.setRememberMe);

  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(`HTTP ${response.status} ${json.detail}`);
      return json;
    },

    onSuccess: (data) => {
      setFormData(INITIAL_STATE);
      setAccessToken(data["access_token"]);
      setRememberMe(formData.rememberMe);
      navigate({ to: "/me" });
    },

    onError: (err) => {
      if (err instanceof TypeError) {
        setError("Network error (failed to fetch)");
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
      throw err;
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const isLoading = mutation.isPending;
  const isSuccess = mutation.isSuccess;
  const isError = mutation.isError;

  const getButtonColor = () => {
    if (isSuccess) return "bg-green-500";
    return "bg-primary hover:bg-primary-alternate";
  };

  const getButtonText = () => {
    if (isLoading) return null;
    if (isSuccess) return "Logged In Successfully";
    return "Log In";
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4">
      {/* Header */}
      <h1 className="text-center text-[3rem] mt-12 font-primely leading-0 text-primary">
        Primely
      </h1>
      <h1 className="text-center text-[3rem] mt-6 font-manrope">
        Welcome back!
      </h1>

      {/* Form */}
      <form
        className="w-full max-w-112.5 rounded-[20px] bg-background/80 backdrop-blur-xl p-7.5 space-y-4"
        onSubmit={handleSubmit}
      >
        {/* Form Fields */}
        <div className="space-y-4">
          {FORM_FIELDS.map((field) => (
            <FormInput
              key={field.name}
              label={field.label}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              icon={field.icon}
              iconWidth={field.iconWidth}
              iconHeight={field.iconHeight}
              value={
                formData[field.name as keyof Omit<LoginData, "rememberMe">]
              }
              onChange={handleChange}
            />
          ))}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between py-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) =>
                setFormData({ ...formData, rememberMe: e.target.checked })
              }
              className="appearance-none w-5 h-5 border-2 border-foreground rounded cursor-pointer checked:bg-primary checked:border-primary focus:outline-none transition-all duration-200"
            />
            <span className="text-sm text-foreground">Remember me</span>
          </label>
        </div>

        {/* Error Message */}
        {isError && (
          <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isSuccess}
          className={`w-full h-12 rounded-[10px] font-semibold text-foreground transition-all duration-200 ${getButtonColor()} disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6`}
        >
          {isLoading ? (
            <>
              <Spinner
                size="sm"
                outerClassName="bg-primary"
                innerClassName="border-t-foreground"
                thickness={7}
              />
            </>
          ) : (
            getButtonText()
          )}
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-foreground mt-4">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-accent font-semibold hover:underline transition-colors"
          >
            Sign Up
          </button>
        </p>
      </form>
    </div>
  );
};

export default Form;
