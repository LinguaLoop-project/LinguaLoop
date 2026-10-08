import { create } from "zustand";
import { authService } from "../services/authService";
import { toApiError } from "../errors";
import type { ApiError, AuthResponse, LoginPayload, MeResponse } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = MeResponse;

export type AuthState = {
  user: User | null;
  accessToken: string;
  isAuthenticated: boolean;
  loading: boolean;
  // Giữ ApiError (không phải câu đã dịch) để UI dịch lại khi đổi ngôn ngữ
  error: ApiError | null;
  initialized: boolean;
};

export type AuthResponseData = AuthResponse;

export type AuthActions = {
  setUser: (user: User | null) => void;
  setToken: (accessToken: string) => void;
  logout: () => void;
  clearError: () => void;
  initAuth: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<AuthResponseData>;
};

// Dùng chung một lần gọi khi React StrictMode chạy effect hai lần
let initPromise: Promise<void> | null = null;

// ─── Store ─────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  accessToken: "",
  isAuthenticated: false,
  loading: false,
  error: null,
  initialized: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (accessToken) => set({ accessToken }),

  logout: () =>
    set({
      user: null,
      accessToken: "",
      isAuthenticated: false,
      error: null,
      loading: false,
      initialized: true,
    }),

  clearError: () => set({ error: null }),

  // Khôi phục phiên khi mở app: đổi cookie refresh lấy access token + user. Chưa xong thì guard còn hiện loading.
  initAuth: () => {
    initPromise ??= (async () => {
      set({ loading: true, initialized: false });
      try {
        const response = await authService.refresh();
        const data = response.data.data;
        set({
          loading: false,
          initialized: true,
          isAuthenticated: true,
          accessToken: data.accessToken,
          user: data.user,
        });
      } catch {
        set({
          loading: false,
          initialized: true,
          isAuthenticated: false,
          user: null,
          accessToken: "",
        });
      }
    })();
    return initPromise;
  },

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.login(payload);
      const data = response.data.data;
      set({
        loading: false,
        initialized: true,
        isAuthenticated: true,
        accessToken: data.accessToken,
        user: data.user,
      });
      return data;
    } catch (error: unknown) {
      // Giữ nguyên lỗi gốc để trang Login đọc `code` (vd AUTH_EMAIL_NOT_VERIFIED); `error` là bản chuẩn hoá để UI dịch ra câu hiển thị.
      set({
        loading: false,
        isAuthenticated: false,
        error: toApiError(error),
      });
      throw error;
    }
  },
}));
