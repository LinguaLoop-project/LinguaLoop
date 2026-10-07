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
  register: (payload: RegisterPayload) => {
    return publicAxios.post<ApiResponse<RegisterResponse>>("/auth/register", payload);
  },
  // Cookie `ll_refresh` đi kèm tự động (withCredentials); header X-Requested-With có sẵn trong publicAxios.
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
  forgotPassword: (payload: { email: string }) => {
    return publicAxios.post("/auth/forgot-password", payload);
  },
  getMe: () => {
    return axiosClient.get<ApiResponse<MeResponse>>("/users/me");
  },
};
