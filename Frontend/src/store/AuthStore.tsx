import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  public_id: string;
  username: string;
  email: string;
}

interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}
interface RememberMeStore {
  rememberMe: boolean;
  setRememberMe: (rememberMe: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      accessToken: null,
      setAccessToken: (token) => set({ accessToken: token }),
    }),
    { name: "accessToken" },
  ),
);

export const useRememberMeStore = create<RememberMeStore>()(
  persist(
    (set) => ({
      rememberMe: true,
      setRememberMe: (rememberMe) => set({ rememberMe }),
    }),
    {
      name: "remember-me", // localStorage key
    },
  ),
);
