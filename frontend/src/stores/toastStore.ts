import { create } from "zustand";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastState {
  message: string | null;
  /** Tên icon Lucide. */
  icon: string;
  action: ToastAction | null;
  show: (message: string, opts?: { icon?: string; action?: ToastAction }) => void;
  hide: () => void;
}

/** Thông báo ngắn ở đáy màn hình (`.toast` trong mockup v2); tự tắt sau 3,4 giây. */
let timer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  icon: "info",
  action: null,
  show: (message, opts) => {
    clearTimeout(timer);
    set({ message, icon: opts?.icon ?? "info", action: opts?.action ?? null });
    timer = setTimeout(() => set({ message: null }), 3400);
  },
  hide: () => {
    clearTimeout(timer);
    set({ message: null });
  },
}));

export const toast = (message: string, opts?: { icon?: string; action?: ToastAction }) => useToastStore.getState().show(message, opts);
