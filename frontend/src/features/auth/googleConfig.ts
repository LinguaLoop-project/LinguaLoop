/**
 * Cấu hình đăng nhập Google theo authorization code flow. Client ID không phải secret; client secret chỉ nằm ở backend.
 * `redirectUri` phải trùng với `GOOGLE_REDIRECT_URI` của backend và đã khai trong Google Console.
 */
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export const GOOGLE_REDIRECT_URI: string =
  import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/authenticate`;

/** Chưa có client ID thì ẩn nút Google, app vẫn chạy. */
export const isGoogleConfigured = GOOGLE_CLIENT_ID !== "";
