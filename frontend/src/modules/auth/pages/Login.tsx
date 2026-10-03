import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/stores/authStore";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema, type LoginFormData } from "../validations/authSchemas";
import AuthSidePanel from "../components/AuthSidePanel";
import AuthTopBar from "../components/AuthTopBar";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
    mode: "onTouched",
  });

  const rememberValue = watch("remember");

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: any) => {
    try {
      await login({ email_or_phone: data.email, password: data.password });
      navigate("/");
    } catch {
      // Error shown via store
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
                  {error}{" "}
                  <Link to="/auth/forgot-password" className="ll-link underline">
                    Đặt lại mật khẩu
                  </Link>
                </span>
              </div>
            )}

            {/* Google button */}
            <button
              type="button"
              className="ll-btn ghost lg full"
              onClick={() => {
                alert("Đăng nhập bằng Google đang được tích hợp.");
              }}
            >
              <svg className="w-5 h-5 mr-1" aria-hidden="true">
                <use href="#g-google" />
              </svg>
              <span>Đăng nhập với Google</span>
            </button>

            {/* "or" divider */}
            <div className="ll-or">
              <span>hoặc dùng email</span>
            </div>

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
                {rememberValue && <i className="ph ph-check" />}
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

            {/* Demo hint */}
            <div className="ll-demo-hint">
              <i className="ph ph-info" />
              <span>Bản mẫu: mật khẩu từ 6 ký tự là vào được, ngắn hơn để xem báo lỗi.</span>
            </div>
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
