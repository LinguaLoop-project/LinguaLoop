import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../stores/authStore";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema, type LoginFormData } from "../validations/authSchemas";
import { toApiError } from "../errors";
import AuthSidePanel from "../components/AuthSidePanel";
import AuthTopBar from "../components/AuthTopBar";

const Login = () => {
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
              <span className="ll-overline">Chào mừng trở lại</span>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}
              >
                Đăng nhập
              </h1>
              <p className="mt-1 text-[15px]" style={{ color: "var(--text-muted)" }}>
                Học tiếp từ chỗ bạn dừng lần trước.
              </p>
            </div>

            {/* API error alert */}
            {error && (
              <div className="ll-form-alert danger" role="alert">
                <i className="ph ph-warning-circle" style={{ fontSize: 20, flexShrink: 0 }} />
                <span>
                  {error}
                  {showResetHint && (
                    <>
                      {" "}
                      <Link to="/auth/forgot-password" className="ll-link underline">
                        Đặt lại mật khẩu
                      </Link>
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Email */}
            <div className={`ll-field ${errors.email ? "bad" : ""}`}>
              <label htmlFor="liEmail" className="ll-label">
                Email
              </label>
              <div className="ll-inp">
                <i className="ph ph-envelope-simple" />
                <input
                  id="liEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="ban@email.com"
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
                  Mật khẩu
                </label>
                <Link to="/auth/forgot-password" className="ll-link text-[13px]">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="ll-inp">
                <i className="ph ph-lock-simple" />
                <input
                  id="liPw"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Mật khẩu của bạn"
                  aria-describedby="liPwErr"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="ll-pw-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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
              Ghi nhớ đăng nhập trên máy này
            </label>

            {/* Submit */}
            <button type="submit" className="ll-btn primary lg full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                  Đang đăng nhập...
                </span>
              ) : "Đăng nhập"}
            </button>

            {/* Register link */}
            <p className="text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
              Chưa có tài khoản?{" "}
              <Link to="/auth/register" className="ll-link">Đăng ký miễn phí</Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="auth-foot text-[13px] text-center" style={{ color: "var(--text-muted)", marginTop: "auto", paddingTop: 16 }}>
          © 2026 LinguaLoop ·{" "}
          <button type="button" className="ll-link">Điều khoản</button> ·{" "}
          <button type="button" className="ll-link">Quyền riêng tư</button> ·{" "}
          <button type="button" className="ll-link">Trợ giúp</button>
        </p>
      </main>
    </div>
  );
};

export default Login;
