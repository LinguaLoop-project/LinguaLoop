import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse, MeResponse } from "@/features/auth";

export type ChangePasswordPayload = {
  /** Bắt buộc khi tài khoản đã có mật khẩu; bỏ qua với tài khoản Google chưa tạo mật khẩu. */
  currentPassword?: string;
  newPassword: string;
};

export type LearningProfilePayload = {
  displayName: string;
  dailyMinutes: number;
  uiLanguage: "vi" | "en";
  timezone: string;
  /** Bắt buộc là true khi học viên chưa từng đồng ý điều khoản (BR-TK-14). */
  acceptTerms: boolean;
};

export const userApi = {
  /** Lưu hồ sơ học tập (UC-TK-08). Lần đầu thành công thì học viên được đánh dấu đã thiết lập hồ sơ. */
  saveLearningProfile: (payload: LearningProfilePayload) => {
    return axiosClient.put<ApiResponse<MeResponse>>("/users/me/learning-profile", payload);
  },

  // 204. Thành công thì các phiên khác bị thu hồi, phiên hiện tại giữ nguyên.
  changePassword: (payload: ChangePasswordPayload) => {
    return axiosClient.put<void>("/users/me/password", payload);
  },
};
