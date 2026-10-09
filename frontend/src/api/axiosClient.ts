import axios from "axios";
// Import thẳng store, không qua index của feature, để tránh vòng phụ thuộc (index -> authStore -> authService -> axiosClient)
import { useAuthStore } from "@/features/auth/stores/authStore";

export const publicAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let refreshTokenRequest: Promise<string> | null = null;

const refreshToken = async () => {
  const response = await publicAxios.post("/auth/refresh");
  const data = response.data?.data;

  if (data?.accessToken) {
    const { setToken, setUser } = useAuthStore.getState();
    setToken(data.accessToken);
    setUser(data.user);

    return data.accessToken as string;
  }

  throw new Error("Refresh token failed");
};

// Các endpoint /auth/* tự xử lý lỗi 401 của chính chúng (sai mật khẩu, refresh hỏng...), không refresh lại.
const isAuthEndpoint = (url?: string) => !!url && url.startsWith("/auth/");

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

    // Lỗi không có request gốc (vd bị huỷ) hoặc đã thử lại một lần: tránh loop vô hạn
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const isUnauthorized =
      error.response?.status === 401 && !isAuthEndpoint(originalRequest.url);

    if (isUnauthorized) {
      originalRequest._retry = true;

      try {
        refreshTokenRequest = refreshTokenRequest || refreshToken();

        const accessToken = await refreshTokenRequest;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh hỏng: backend đã xoá cookie. Xoá phiên cục bộ, guard sẽ đưa về trang đăng nhập.
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
