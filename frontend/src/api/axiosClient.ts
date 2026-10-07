import axios from "axios";
import { useAuthStore } from "@/features/auth";

export const publicAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    // Backend bắt buộc header này trên /auth/refresh và /auth/logout (chặn CSRF cho cookie refresh)
    "X-Requested-With": "lingualoop",
  },
  withCredentials: true,
});

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    // Backend bắt buộc header này trên /auth/refresh và /auth/logout (chặn CSRF cho cookie refresh)
    "X-Requested-With": "lingualoop",
  },
  withCredentials: true,
});

let refreshTokenRequest: Promise<string> | null = null;

const refreshToken = async () => {
  const response = await publicAxios.post("/auth/refresh");

  if (response.data.data) {
    const { accessToken } = response.data.data;

    useAuthStore.getState().setToken(accessToken);

    return accessToken;
  }

  throw new Error("Refresh token failed");
};

axiosClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // Nếu body là FormData, xóa Content-Type để trình duyệt tự set
  // multipart/form-data với boundary chính xác
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // tránh loop vô hạn
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    const isUnauthorized = error.response?.status === 401;

    if (isUnauthorized) {
      originalRequest._retry = true;

      try {
        refreshTokenRequest = refreshTokenRequest || refreshToken();

        const accessToken = await refreshTokenRequest;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        await publicAxios.post("/auth/logout").catch(() => {});
        useAuthStore.getState().logout();

        return Promise.reject(refreshError);
      } finally {
        refreshTokenRequest = null;
      }
    }

    const isQuotaExceeded = error.response?.status === 429 && error.response?.data?.code === "QUOTA_EXCEEDED";

    if (isQuotaExceeded) {
      import("@/stores/quotaStore").then(({ useQuotaStore }) => {
        useQuotaStore.getState().setShowUpgradeModal(true);
      });
      // Optionally don't reject if we want to swallow it, but usually we reject so the UI stops loading
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);
