import { isAxiosError } from "axios";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import type { ApiError, ApiErrorBody, FieldError } from "./types";

// Bảng mã lỗi → câu tiếng Việt (tạm, trước khi có i18n). Backend chỉ trả `code` + `details`, không trả câu hiển thị.

export const NETWORK_ERROR = "NETWORK_ERROR";

/** Chuẩn hoá lỗi bất kỳ (axios hoặc không) về `ApiError` để UI dịch theo `code`. */
export function toApiError(err: unknown): ApiError {
  if (isAxiosError<Partial<ApiErrorBody>>(err)) {
    if (!err.response) {
      return { status: 0, code: NETWORK_ERROR, message: err.message, errors: [], details: {} };
    }
    const body = err.response.data;
    return {
      status: err.response.status,
      code: body?.code ?? "INTERNAL_ERROR",
      message: body?.message ?? err.message,
      errors: body?.errors ?? [],
      details: body?.details ?? {},
    };
  }
  const message = err instanceof Error ? err.message : "";
  return { status: 0, code: "INTERNAL_ERROR", message, errors: [], details: {} };
}

/** Số phút còn lại tới `lockedUntil` (ISO), làm tròn lên, tối thiểu 1. */
function minutesUntil(lockedUntil: unknown): number {
  const ms = typeof lockedUntil === "string" ? Date.parse(lockedUntil) - Date.now() : NaN;
  return Number.isNaN(ms) ? 15 : Math.max(1, Math.ceil(ms / 60_000));
}

/** Câu thông báo cho lỗi cấp form (không thuộc field nào). */
export function errorMessage(error: ApiError): string {
  switch (error.code) {
    case "AUTH_INVALID_CREDENTIALS": {
      const remaining = error.details.remainingAttempts;
      return typeof remaining === "number"
        ? `Email hoặc mật khẩu chưa đúng. Bạn còn ${remaining} lần thử.`
        : "Email hoặc mật khẩu chưa đúng.";
    }
    case "AUTH_ACCOUNT_LOCKED":
      return `Đăng nhập tạm bị khoá do sai mật khẩu nhiều lần. Thử lại sau khoảng ${minutesUntil(error.details.lockedUntil)} phút, hoặc đặt lại mật khẩu.`;
    case "AUTH_ACCOUNT_DISABLED":
      return "Tài khoản này đã bị khoá. Vui lòng liên hệ quản trị viên.";
    case "AUTH_EMAIL_NOT_VERIFIED":
      return "Email này chưa được xác thực.";
    case "AUTH_EMAIL_TAKEN":
      return "Email này đã được sử dụng.";
    case "AUTH_LINK_INVALID":
      return "Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng.";
    case "AUTH_REFRESH_INVALID":
      return "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.";
    case "VALIDATION_FAILED":
      return "Thông tin chưa hợp lệ, vui lòng kiểm tra lại các ô bên dưới.";
    case NETWORK_ERROR:
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau.";
    default:
      return "Có lỗi xảy ra, vui lòng thử lại sau.";
  }
}

// Tên field của request → nhãn hiển thị trong câu lỗi
const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  password: "Mật khẩu",
  displayName: "Tên hiển thị",
  acceptTerms: "Điều khoản",
};

/** Câu lỗi cho một field, dịch theo tên constraint của Bean Validation (`NotBlank`, `Size`, ...). */
export function fieldErrorMessage(fe: FieldError): string {
  const label = FIELD_LABELS[fe.field] ?? "Giá trị này";
  const { min, max } = fe.params;
  switch (fe.code) {
    case "NotBlank":
    case "NotNull":
      return `${label} không được để trống.`;
    case "Email":
      return "Email chưa đúng định dạng, ví dụ ban@email.com";
    case "MaxBytes":
      return `${label} tối đa ${fe.params.value} byte (ký tự có dấu chiếm nhiều byte hơn).`;
    case "AssertTrue":
      return "Bạn cần đồng ý với điều khoản để tạo tài khoản.";
    case "Size":
      if (typeof min === "number" && typeof max === "number") {
        return min <= 1 ? `${label} tối đa ${max} ký tự.` : `${label} cần từ ${min} đến ${max} ký tự.`;
      }
      return `${label} chưa đúng độ dài.`;
    default:
      return fe.message || `${label} chưa hợp lệ.`;
  }
}

/**
 * Gắn lỗi từng field của backend vào react-hook-form. Trả về số lỗi đã gắn được
 * (field backend không có trong form thì bỏ qua).
 */
export function applyFieldErrors<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
  fieldMap: Record<string, FieldPath<T>>,
): number {
  let applied = 0;
  for (const fe of error.errors) {
    const target = fieldMap[fe.field];
    if (target) {
      setError(target, { type: "server", message: fieldErrorMessage(fe) });
      applied++;
    }
  }
  return applied;
}
