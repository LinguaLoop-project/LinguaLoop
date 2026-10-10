import { publicAxios, axiosClient } from "@/api/axiosClient";
import type {
  ApiResponse,
  AuthResponse,
  LoginPayload,
  MeResponse,
  RegisterPayload,
  RegisterResponse,
  VerifyEmailResult,
} from "../types";

export const authService = {
  login: (payload: LoginPayload) => {
    return publicAxios.post<ApiResponse<AuthResponse>>("/auth/login", payload);
  },
  // `code` là authorization code Google trả về ở /authenticate; backend tự đổi lấy access token bằng client secret.
  googleLogin: (code: string) => {
    return publicAxios.post<ApiResponse<AuthResponse>>("/auth/google", { code });
  },
  register: (payload: RegisterPayload) => {
    return publicAxios.post<ApiResponse<RegisterResponse>>("/auth/register", payload);
  },
  // Cookie `ll_refresh` đi kèm tự động (withCredentials).
  refresh: () => {
    return publicAxios.post<ApiResponse<AuthResponse>>("/auth/refresh");
  },
  logout: () => {
    return publicAxios.post("/auth/logout");
  },
  verifyEmail: (token: string) => {
    return publicAxios.post<ApiResponse<{ result: VerifyEmailResult }>>("/auth/verify-email", { token });
  },
  // Luôn 202, không cho biết email có tồn tại hay không (BR-AUTH-04).
  resendVerification: (email: string) => {
    return publicAxios.post("/auth/verify-email/resend", { email });
  },
  // Luôn 202, không cho biết email có tài khoản hay không (BR-AUTH-04).
  forgotPassword: (payload: { email: string }) => {
    return publicAxios.post("/auth/forgot-password", payload);
  },
  // Chỉ kiểm tra link, không dùng hết token. Link hỏng thì lỗi AUTH_LINK_INVALID.
  validateResetToken: (token: string) => {
    return publicAxios.post<ApiResponse<{ valid: boolean }>>("/auth/reset-password/validate", { token });
  },
  // 204, không cấp phiên: người dùng đăng nhập lại bằng mật khẩu mới.
  resetPassword: (payload: { token: string; newPassword: string }) => {
    return publicAxios.post("/auth/reset-password", payload);
  },
  getMe: () => {
    return axiosClient.get<ApiResponse<MeResponse>>("/users/me");
  },
};
