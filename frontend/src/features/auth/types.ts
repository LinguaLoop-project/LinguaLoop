// Kiểu dữ liệu khớp DTO của backend (PR1a). Xem docs/convention/API-CONVENTION.md §4–5.

export type Role = "student" | "instructor" | "admin";

/** `GET /users/me` và trường `user` trong `AuthResponse`. */
export type MeResponse = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: Role;
  emailVerified: boolean;
  onboarded: boolean;
  hasPassword: boolean;
  googleLinked: boolean;
};

/** Access token chỉ giữ trong bộ nhớ; refresh token nằm trong cookie httpOnly. */
export type AuthResponse = {
  accessToken: string;
  expiresAt: string;
  user: MeResponse;
};

export type RegisterPayload = {
  email: string;
  password: string;
  displayName: string;
  acceptTerms: boolean;
};

export type RegisterResponse = {
  email: string;
  mailSent: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type VerifyEmailResult = "VERIFIED" | "ALREADY_VERIFIED";

/** Lỗi của từng field khi validate (`VALIDATION_FAILED`). */
export type FieldError = {
  field: string;
  code: string;
  params: Record<string, unknown>;
  message: string;
};

/** Body lỗi chung của backend. `details` luôn là object, rỗng nếu không có. */
export type ApiErrorBody = {
  status: number;
  code: string;
  message: string;
  path: string;
  traceId?: string;
  timestamp: string;
  errors: FieldError[];
  details: Record<string, unknown>;
};

/** Lỗi đã chuẩn hoá từ phản hồi của backend, để UI dịch theo `code` + `details`. */
export type ApiError = {
  status: number;
  code: string;
  message: string;
  errors: FieldError[];
  details: Record<string, unknown>;
};

/** Phong bì thành công của backend (`ApiResponse<T>`). */
export type ApiResponse<T> = {
  success: boolean;
  data: T;
};
