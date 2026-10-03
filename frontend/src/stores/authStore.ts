import { create } from "zustand";
import { authService } from "@/modules/auth/services/authService";

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = {
  id: string;
  auth_uid?: string | null;
  email: string;
  username?: string | null;
  avatar_url?: string | null;
  description?: string | null;
  birthday?: string | null;
  gender?: "male" | "female" | "other" | null;
  ui_language: "vi" | "en";
  timezone: string;
  max_daily_reviews: number;
  email_verified: boolean;
  disabled: boolean;
  role: "student" | "instructor" | "admin";
  created_at: string;
  updated_at: string;
};

export type AuthState = {
  user: User | null;
  accessToken: string;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
};

export type AuthActions = {
  setUser: (user: User | null) => void;
  setToken: (accessToken: string) => void;
  logout: () => void;
  clearError: () => void;
  initAuth: () => Promise<void>;
  login: (payload: {
    email_or_phone: string;
    password: string;
  }) => Promise<any>;
  googleLogin: (googleAccessToken: string) => Promise<any>;
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
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";
      set({
        loading: false,
        isAuthenticated: false,
        error: message,
      });
      throw new Error(message);
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
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Đăng nhập bằng Google thất bại.";
      set({
        loading: false,
        isAuthenticated: false,
        error: message,
      });
      throw new Error(message);
    }
  },
}));
