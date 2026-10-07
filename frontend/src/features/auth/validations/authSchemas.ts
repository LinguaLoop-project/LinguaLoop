import * as yup from "yup";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Login Schema ─────────────────────────────────────────────────────────────
export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required("Vui lòng nhập email của bạn")
    .matches(EMAIL_RE, "Email chưa đúng định dạng, ví dụ ban@email.com"),
  password: yup
    .string()
    .required("Vui lòng nhập mật khẩu"),
  remember: yup.boolean().default(true),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;

// ─── Register Schema ──────────────────────────────────────────────────────────
export const registerSchema = yup.object().shape({
  displayName: yup
    .string()
    .trim()
    .required("Nhập tên hiển thị của bạn")
    .max(50, "Tên hiển thị tối đa 50 ký tự"),
  email: yup
    .string()
    .trim()
    .required("Nhập email của bạn")
    .matches(EMAIL_RE, "Email chưa đúng định dạng, ví dụ ban@email.com"),
  password: yup
    .string()
    .required("Tạo mật khẩu cho tài khoản")
    .min(8, "Mật khẩu cần ít nhất 8 ký tự")
    .max(72, "Mật khẩu tối đa 72 ký tự"),
  acceptTerms: yup
    .boolean()
    .oneOf([true], "Bạn cần đồng ý với điều khoản để tạo tài khoản")
    .required("Bạn cần đồng ý với điều khoản để tạo tài khoản"),
});

export type RegisterFormData = yup.InferType<typeof registerSchema>;

// ─── Forgot Password Schema ───────────────────────────────────────────────────
export const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required("Nhập email bạn dùng để đăng ký")
    .matches(EMAIL_RE, "Email chưa đúng định dạng, ví dụ ban@email.com"),
});

export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;
