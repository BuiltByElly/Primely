import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import Spinner from "./Spinner";
import FormInput from "./FormInput";
import { useAuthStore, useRememberMeStore } from "#/store/AuthStore";
import { Email } from "#/icons/email";
import { Password } from "#/icons/password";
import { User } from "#/icons/user";

const LOGIN_FIELDS = [
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "Enter your email",
    icon: Email,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    icon: Password,
  },
] as const;

const REGISTER_FIELDS = [
  {
    name: "username",
    label: "Username",
    type: "text",
    placeholder: "Enter your username",
    icon: User,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "Enter your email",
    icon: Email,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    icon: Password,
  },
] as const;

const Form = ({ type }: { type: "login" | "register" }) => {
  const isLogin = type === "login";
  const fields = isLogin ? LOGIN_FIELDS : REGISTER_FIELDS;

  const initialState = {
    username: "",
    email: "",
    password: "",
    rememberMe: false,
  };

  const [formData, setFormData] = useState<{
    username: string;
    email: string;
    password: string;
    rememberMe: boolean;
  }>(initialState);
  const [error, setError] = useState<string | null>(null);

  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setRememberMe = useRememberMeStore((s) => s.setRememberMe);

  const navigate = useNavigate();

  const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Build payload based on type
      const payload = isLogin
        ? {
            email: data.email,
            password: data.password,
            remember_me: data.rememberMe,
          }
        : {
            username: data.username,
            email: data.email,
            password: data.password,
            remember_me: true,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(`HTTP ${response.status} ${json.detail}`);
      return json;
    },

    onSuccess: (data) => {
      setFormData(initialState);
      setAccessToken(data["access_token"]);
      if (isLogin) {
        setRememberMe(formData.rememberMe);
      }
      navigate({ to: "/me" });
    },

    onError: (err) => {
      if (err instanceof TypeError) {
        setError("Network error (failed to fetch)");
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, rememberMe: e.target.checked }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleToggleMode = () => {
    navigate({ to: isLogin ? "/register" : "/login" });
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
    if (isSuccess)
      return isLogin ? "Logged In Successfully" : "Registered Successfully";
    return isLogin ? "Log In" : "Register";
  };

  const getHeaderText = () => {
    return isLogin ? "Welcome back!" : "Create your account";
  };

  const getToggleText = () => {
    return isLogin ? "Don't have an account?" : "Already have an account?";
  };

  const getToggleButtonText = () => {
    return isLogin ? "Register" : "Log In";
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4">
      {/* Header */}
      <div className="mb-12 xl:mb-0">
        <h1 className="text-center text-[3rem] mt-12 font-primely leading-0 text-primary">
          Primely
        </h1>
        <h1 className="text-center text-[2rem] mt-6 font-manrope xl:text-[3rem]">
          {getHeaderText()}
        </h1>
      </div>

      {/* Form */}
      <form
        className="w-full xl:max-w-112.5 rounded-[20px] bg-background/80 backdrop-blur-xl xl:p-7.5 space-y-4"
        onSubmit={handleSubmit}
      >
        {/* Form Fields */}
        <div className="space-y-4">
          {fields.map((field) => (
            <FormInput
              key={field.name}
              label={field.label}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              icon={field.icon}
              iconWidth={field.iconWidth}
              iconHeight={field.iconHeight}
              value={formData[field.name as keyof typeof formData] as string}
              onChange={handleChange}
            />
          ))}
        </div>

        {/* Remember Me (only for login) */}
        {isLogin && (
          <div className="flex items-center justify-between py-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleRememberMeChange}
                className="appearance-none w-5 h-5 border-2 border-foreground rounded cursor-pointer checked:bg-primary checked:border-primary focus:outline-none transition-all duration-200"
              />
              <span className="text-sm text-foreground">Remember me</span>
            </label>
          </div>
        )}

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

        {/* Toggle Mode Link */}
        <p className="text-center text-sm text-foreground mt-4">
          {getToggleText()}{" "}
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-accent font-semibold hover:underline transition-colors"
          >
            {getToggleButtonText()}
          </button>
        </p>
      </form>
    </div>
  );
};

export default Form;
