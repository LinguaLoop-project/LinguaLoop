import { publicAxios, axiosClient } from "@/api/axiosClient";

export const authService = {
  login: (payload: { email_or_phone: string; password: string }) => {
    return publicAxios.post("/auth/login", payload);
  },
  googleLogin: (googleAccessToken: string) => {
    return publicAxios.post("/auth/google-login", { googleAccessToken });
  },
  register: (payload: { username: string; email: string; password: string }) => {
    return publicAxios.post("/auth/register", payload);
  },
  forgotPassword: (payload: { email: string }) => {
    return publicAxios.post("/auth/forgot-password", payload);
  },
  logout: () => {
    return publicAxios.post("/auth/logout");
  },
  getMe: () => {
    return axiosClient.get("/user/profile");
  },
};
