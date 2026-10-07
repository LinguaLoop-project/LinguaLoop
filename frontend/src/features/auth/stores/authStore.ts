import { create } from "zustand";
import { authService } from "../services/authService";
import type { AuthResponse, MeResponse } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = MeResponse;

export type AuthState = {
  user: User | null;
  accessToken: string;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
};

export type AuthResponseData = AuthResponse;

export type AuthActions = {
  setUser: (user: User | null) => void;
  setToken: (accessToken: string) => void;
  logout: () => void;
  clearError: () => void;
  initAuth: () => Promise<void>;
  login: (payload: {
    email_or_phone: string;
    password: string;
  }) => Promise<AuthResponseData>;
  googleLogin: (googleAccessToken: string) => Promise<AuthResponseData>;
};

// ─── Store ─────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  accessToken: "",
  isAuthenticated: false,
  loading: false,
  error: null,
  initialized: true,

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

  initAuth: async () => {
    set({ loading: true, initialized: false });
    try {
      const response = await authService.getMe();
      const user = response.data?.data as User;
      set({
        loading: false,
        initialized: true,
        isAuthenticated: true,
        user,
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
  },

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.login(payload);
      const data = response.data?.data;
      if (!data) {
        throw new Error(response.data?.message || "Đăng nhập thất bại");
      }
      set({
        loading: false,
        initialized: true,
        isAuthenticated: true,
        accessToken: data.accessToken,
        user: data.user,
      });
      return data;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        err.response?.data?.message ||
        err.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";
      set({
        loading: false,
        isAuthenticated: false,
        error: message,
      });
      throw new Error(message, { cause: error });
    }
  },

  googleLogin: async (googleAccessToken) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.googleLogin(googleAccessToken);
      const data = response.data?.data;
      if (!data) {
        throw new Error(
          response.data?.message || "Đăng nhập bằng Google thất bại.",
        );
      }
      set({
        loading: false,
        initialized: true,
        isAuthenticated: true,
        accessToken: data.accessToken,
        user: data.user,
      });
      return data;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        err.response?.data?.message ||
        err.message ||
        "Đăng nhập bằng Google thất bại.";
      set({
        loading: false,
        isAuthenticated: false,
        error: message,
      });
      throw new Error(message, { cause: error });
    }
  },
}));
