import { axiosClient } from "@/api/axiosClient";

export type ChangePasswordPayload = {
  /** Bắt buộc khi tài khoản đã có mật khẩu; bỏ qua với tài khoản Google chưa tạo mật khẩu. */
  currentPassword?: string;
  newPassword: string;
};

export const userApi = {
  // 204. Thành công thì các phiên khác bị thu hồi, phiên hiện tại giữ nguyên.
  changePassword: (payload: ChangePasswordPayload) => {
    return axiosClient.put<void>("/users/me/password", payload);
  },
};
