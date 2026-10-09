import * as yup from "yup";
import i18n from "@/i18n";

// Message là hàm để dịch lúc validate, theo ngôn ngữ đang chọn, không cố định lúc nạp module
const msg = (key: string) => () => i18n.t(`auth:validation.${key}`);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Login Schema ─────────────────────────────────────────────────────────────
export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required(msg("loginEmailRequired"))
    .matches(EMAIL_RE, msg("emailFormat")),
  password: yup
    .string()
    .required(msg("loginPasswordRequired")),
  remember: yup.boolean().default(true),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;

// ─── Register Schema ──────────────────────────────────────────────────────────
export const registerSchema = yup.object().shape({
  displayName: yup
    .string()
    .trim()
    .required(msg("displayNameRequired"))
    .max(50, msg("displayNameMax")),
  email: yup
    .string()
    .trim()
    .required(msg("registerEmailRequired"))
    .matches(EMAIL_RE, msg("emailFormat")),
  password: yup
    .string()
    .required(msg("passwordCreate"))
    .min(8, msg("passwordMin"))
    // BCrypt chỉ nhận 72 byte (backend kiểm @MaxBytes), ký tự có dấu chiếm 2-3 byte nên không đếm theo ký tự
    .test("max-bytes", msg("passwordMaxBytes"), (value) => !value || new TextEncoder().encode(value).length <= 72),
  acceptTerms: yup
    .boolean()
    .oneOf([true], msg("termsRequired"))
    .required(msg("termsRequired")),
});

export type RegisterFormData = yup.InferType<typeof registerSchema>;

// ─── Forgot Password Schema ───────────────────────────────────────────────────
export const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required(msg("forgotEmailRequired"))
    .matches(EMAIL_RE, msg("emailFormat")),
});

export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;

// ─── Reset Password Schema ────────────────────────────────────────────────────
// Ô nhập lại chỉ kiểm tra ở frontend; backend chỉ nhận mật khẩu mới (AC-AUTH-40)
export const resetPasswordSchema = yup.object().shape({
  newPassword: yup
    .string()
    .required(msg("newPasswordRequired"))
    .min(8, msg("passwordMin"))
    // BCrypt chỉ nhận 72 byte (backend kiểm @MaxBytes), giống registerSchema
    .test("max-bytes", msg("passwordMaxBytes"), (value) => !value || new TextEncoder().encode(value).length <= 72),
  confirmPassword: yup
    .string()
    .required(msg("confirmPasswordRequired"))
    .oneOf([yup.ref("newPassword")], msg("passwordMismatch")),
});

export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;
