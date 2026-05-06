import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}
interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
}
interface RememberMeStore {
  rememberMe: boolean;
  setRememberMe: (rememberMe: boolean) => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
}));

export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

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
