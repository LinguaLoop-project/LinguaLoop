/** Client ID loại Web application của Google (không phải secret). Rỗng thì ẩn nút Google, app vẫn chạy. */
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export const isGoogleConfigured = GOOGLE_CLIENT_ID !== "";
