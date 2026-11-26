import * as yup from "yup";
import i18n from "@/i18n";

// Message là hàm để dịch lúc validate, theo ngôn ngữ đang chọn
const msg = (key: string) => () => i18n.t(`auth:validation.${key}`);

/**
 * Form tạo/đổi mật khẩu. `hasPassword` quyết định có bắt buộc mật khẩu hiện tại hay không (AC-AUTH-42, 45).
 * Ô nhập lại chỉ kiểm tra ở frontend; backend không nhận.
 */
export function buildPasswordSchema(hasPassword: boolean) {
  return yup.object().shape({
    currentPassword: hasPassword
      ? yup.string().required(msg("currentPasswordRequired"))
      : yup.string().notRequired(),
    newPassword: yup
      .string()
      .required(msg("newPasswordRequired"))
      .min(8, msg("passwordMin"))
      .max(72, msg("passwordMax")),
    confirmPassword: yup
      .string()
      .required(msg("confirmPasswordRequired"))
      .oneOf([yup.ref("newPassword")], msg("passwordMismatch")),
  });
}

export type PasswordFormData = yup.InferType<ReturnType<typeof buildPasswordSchema>>;

const DAILY_MINUTES = [10, 15, 20, 30];

/**
 * Form hồ sơ học tập (UC-TK-08). `requireTerms` là true khi học viên chưa từng đồng ý điều khoản: khi đó phải tích ô
 * đồng ý (BR-TK-14).
 */
export function buildLearningProfileSchema(requireTerms: boolean) {
  return yup.object().shape({
    displayName: yup
      .string()
      .trim()
      .required(msg("displayNameRequired"))
      .max(50, msg("displayNameMax")),
    dailyMinutes: yup.number().required(msg("dailyMinutesInvalid")).oneOf(DAILY_MINUTES, msg("dailyMinutesInvalid")),
    uiLanguage: yup.string().oneOf(["vi", "en"]).required(),
    timezone: yup.string().trim().required(msg("timezoneRequired")),
    acceptTerms: requireTerms
      ? yup.boolean().required().oneOf([true], msg("profileTermsRequired"))
      : yup.boolean().default(false),
  });
}

export type LearningProfileFormData = yup.InferType<ReturnType<typeof buildLearningProfileSchema>>;

/** Form đổi tên hiển thị ở tab Tài khoản của Cài đặt. */
export function buildDisplayNameSchema() {
  return yup.object().shape({
    displayName: yup.string().trim().required(msg("displayNameRequired")).max(50, msg("displayNameMax")),
  });
}

export type DisplayNameFormData = yup.InferType<ReturnType<typeof buildDisplayNameSchema>>;
