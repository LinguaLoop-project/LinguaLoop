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
