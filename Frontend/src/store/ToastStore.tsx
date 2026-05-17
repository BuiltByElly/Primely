import { create } from "zustand";

interface Toast {
  id?: string;
  state: "info" | "success" | "error" | "warning";
  text: string;
}
interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  addToast: (toast) => {
    toast.id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, toast] }));
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => (toast.id as string) !== id),
    })),
}));
