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

/** Vị trí AuthGuard lưu lại khi đẩy người chưa đăng nhập về /auth/login (`location.state.from`). */
export type FromLocation = { pathname?: string; search?: string; hash?: string };

/**
 * Trang đích sau khi đăng nhập: quay lại trang đang mở dở nếu có, ngược lại về trang chủ theo vai trò.
 * Chỉ nhận đường dẫn nội bộ (bắt đầu bằng một dấu "/", không phải "//") và không quay lại /auth/*.
 * Nếu vai trò không được vào trang đó thì AuthGuard sẽ đưa về trang chủ của vai trò.
 */
export function resolvePostLoginPath(user: Pick<MeResponse, "role" | "onboarded">, from?: FromLocation | null): string {
  const path = from?.pathname;
  if (path && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/auth")) {
    return `${path}${from?.search ?? ""}${from?.hash ?? ""}`;
  }
  return homePathFor(user);
}
