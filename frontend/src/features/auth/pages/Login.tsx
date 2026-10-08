import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/authStore";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema, type LoginFormData } from "../validations/authSchemas";
import { errorMessage, toApiError } from "../errors";
import AuthSidePanel from "../components/AuthSidePanel";
import AuthTopBar from "../components/AuthTopBar";

const Login = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  // Chỉ gợi ý đặt lại mật khẩu khi lỗi có thể do quên mật khẩu (sai nhiều lần / đang bị khoá)
  const [showResetHint, setShowResetHint] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
    mode: "onTouched",
  });

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    setShowResetHint(false);
    try {
      // Thành công thì GuestGuard (route cha) tự chuyển trang, kể cả quay lại trang đang mở dở
      await login({ email: data.email.trim(), password: data.password });
    } catch (err: unknown) {
      const error = toApiError(err);
      if (error.code === "AUTH_EMAIL_NOT_VERIFIED") {
        // Đúng mật khẩu nhưng chưa xác thực email: không cấp phiên, mời gửi lại thư (AC-AUTH-10)
        clearError();
        navigate("/auth/check-email", { state: { email: data.email.trim(), mailSent: null } });
        return;
      }
      setShowResetHint(error.code === "AUTH_INVALID_CREDENTIALS" || error.code === "AUTH_ACCOUNT_LOCKED");
      // Câu lỗi hiển thị lấy từ store
    }
  };

  return (
    <div className="auth-layout" id="auth">
      {/* ── Left side panel ── */}
      <AuthSidePanel />

      {/* ── Right main panel ── */}
      <main className="auth-main">
        {/* Top bar */}
        <AuthTopBar />

        {/* Form area */}
        <div className="auth-box">
          <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Heading */}
            <div>
              <span className="ll-overline">{t("login.overline")}</span>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}
              >
                {t("login.title")}
              </h1>
              <p className="mt-1 text-[15px]" style={{ color: "var(--text-muted)" }}>
                {t("login.subtitle")}
              </p>
            </div>

            {/* API error alert */}
            {error && (
              <div className="ll-form-alert danger" role="alert">
                <i className="ph ph-warning-circle" style={{ fontSize: 20, flexShrink: 0 }} />
                <span>
                  {errorMessage(error)}
                  {showResetHint && (
                    <>
                      {" "}
                      <Link to="/auth/forgot-password" className="ll-link underline">
                        {t("login.resetPassword")}
                      </Link>
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Email */}
            <div className={`ll-field ${errors.email ? "bad" : ""}`}>
              <label htmlFor="liEmail" className="ll-label">
                {t("login.email")}
              </label>
              <div className="ll-inp">
                <i className="ph ph-envelope-simple" />
                <input
                  id="liEmail"
                  type="email"
                  autoComplete="email"
                  placeholder={t("login.emailPlaceholder")}
                  aria-describedby="liEmailErr"
                  {...register("email")}
                />
              </div>
              {errors.email && <p id="liEmailErr" className="ll-err">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className={`ll-field ${errors.password ? "bad" : ""}`}>
              <div className="flex justify-between items-center">
                <label htmlFor="liPw" className="ll-label">
                  {t("login.password")}
                </label>
                <Link to="/auth/forgot-password" className="ll-link text-[13px]">
                  {t("login.forgotPassword")}
                </Link>
              </div>
              <div className="ll-inp">
                <i className="ph ph-lock-simple" />
                <input
                  id="liPw"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t("login.passwordPlaceholder")}
                  aria-describedby="liPwErr"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="ll-pw-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                  aria-pressed={showPassword}
                >
                  <i className={showPassword ? "ph ph-eye-slash" : "ph ph-eye"} />
                </button>
              </div>
              {errors.password && <p id="liPwErr" className="ll-err">{errors.password.message as string}</p>}
            </div>

            {/* Remember me */}
            <label className="ll-check">
              <input type="checkbox" {...register("remember")} />
              <span className="ll-check-box">
                <i className="ph ph-check" />
              </span>
              {t("login.remember")}
            </label>

            {/* Submit */}
            <button type="submit" className="ll-btn primary lg full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                  {t("login.submitting")}
                </span>
              ) : t("login.submit")}
            </button>

            {/* Register link */}
            <p className="text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
              {t("login.noAccount")}{" "}
              <Link to="/auth/register" className="ll-link">{t("login.registerFree")}</Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="auth-foot text-[13px] text-center" style={{ color: "var(--text-muted)", marginTop: "auto", paddingTop: 16 }}>
          © 2026 LinguaLoop ·{" "}
          <button type="button" className="ll-link">{t("footer.terms")}</button> ·{" "}
          <button type="button" className="ll-link">{t("footer.privacy")}</button> ·{" "}
          <button type="button" className="ll-link">{t("footer.help")}</button>
        </p>
      </main>
    </div>
  );
};

export default Login;
