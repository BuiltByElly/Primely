import { create } from "zustand";

interface AuthStore {
  accessToken: string | null;
  rememberMe: boolean;
  setAccessToken: (token: string | null) => void;
  setRememberMe: (rememberMe: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  rememberMe: true,
  setAccessToken: (token) => set({ accessToken: token }),
  setRememberMe: (rememberMe) => set({ rememberMe: rememberMe }),
}));
