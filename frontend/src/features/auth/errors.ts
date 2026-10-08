import { isAxiosError } from "axios";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import i18n from "@/i18n";
import type { ApiError, ApiErrorBody, FieldError } from "./types";

// Bảng mã lỗi → câu hiển thị (vi/en, xem locales/*/auth.json). Backend chỉ trả `code` + `details`, không trả câu hiển thị.

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

/** Câu thông báo cho lỗi cấp form (không thuộc field nào), theo ngôn ngữ đang chọn. */
export function errorMessage(error: ApiError): string {
  switch (error.code) {
    case "AUTH_INVALID_CREDENTIALS": {
      const remaining = error.details.remainingAttempts;
      return typeof remaining === "number"
        ? i18n.t("auth:errors.invalidCredentialsRemaining", { count: remaining })
        : i18n.t("auth:errors.invalidCredentials");
    }
    case "AUTH_ACCOUNT_LOCKED":
      return i18n.t("auth:errors.accountLocked", { minutes: minutesUntil(error.details.lockedUntil) });
    case "AUTH_ACCOUNT_DISABLED":
      return i18n.t("auth:errors.accountDisabled");
    case "AUTH_EMAIL_NOT_VERIFIED":
      return i18n.t("auth:errors.emailNotVerified");
    case "AUTH_EMAIL_TAKEN":
      return i18n.t("auth:errors.emailTaken");
    case "AUTH_LINK_INVALID":
      return i18n.t("auth:errors.linkInvalid");
    case "AUTH_REFRESH_INVALID":
      return i18n.t("auth:errors.refreshInvalid");
    case "VALIDATION_FAILED":
      return i18n.t("auth:errors.validationFailed");
    case NETWORK_ERROR:
      return i18n.t("auth:errors.network");
    default:
      return i18n.t("auth:errors.unknown");
  }
}

// Tên field của request → khoá nhãn trong auth:fieldLabels
const FIELD_LABEL_KEYS = new Set(["email", "password", "displayName", "acceptTerms"]);

/** Câu lỗi cho một field, dịch theo tên constraint của Bean Validation (`NotBlank`, `Size`, ...). */
export function fieldErrorMessage(fe: FieldError): string {
  const label = i18n.t(FIELD_LABEL_KEYS.has(fe.field) ? `auth:fieldLabels.${fe.field}` : "auth:fieldLabels.fallback");
  const { min, max } = fe.params;
  switch (fe.code) {
    case "NotBlank":
    case "NotNull":
      return i18n.t("auth:fieldErrors.required", { label });
    case "Email":
      return i18n.t("auth:fieldErrors.emailFormat");
    case "MaxBytes":
      return i18n.t("auth:fieldErrors.maxBytes", { label, max: fe.params.value });
    case "AssertTrue":
      return i18n.t("auth:fieldErrors.acceptTerms");
    case "Size":
      if (typeof min === "number" && typeof max === "number") {
        return min <= 1
          ? i18n.t("auth:fieldErrors.sizeMax", { label, max })
          : i18n.t("auth:fieldErrors.sizeRange", { label, min, max });
      }
      return i18n.t("auth:fieldErrors.sizeInvalid", { label });
    default:
      return fe.message || i18n.t("auth:fieldErrors.invalid", { label });
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
