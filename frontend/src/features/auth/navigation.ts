import type { MeResponse } from "./types";

/** Trang đích sau khi đăng nhập theo vai trò; học viên chưa thiết lập hồ sơ thì vào /onboarding (AC-AUTH-11). */
export function homePathFor(user: Pick<MeResponse, "role" | "onboarded">): string {
  switch (user.role) {
    case "instructor":
      return "/instructor";
    case "admin":
      return "/admin";
    default:
      return user.onboarded ? "/student" : "/onboarding";
  }
}
