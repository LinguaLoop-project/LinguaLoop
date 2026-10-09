import React, { useState, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { authService } from "../services/authService";
import { registerSchema, type RegisterFormData } from "../validations/authSchemas";
import { applyFieldErrors, errorMessage, toApiError } from "../errors";
import AuthSidePanel from "../components/AuthSidePanel";
import AuthTopBar from "../components/AuthTopBar";

const PW_LABELS = ["", "Yếu", "Tạm được", "Mạnh", "Rất mạnh"];

function getPwScore(v: string): number {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[a-z]/i.test(v) && /\d/.test(v)) s++;
  if (/[^a-z0-9]/i.test(v)) s++;
  if (v.length >= 12) s++;
  return Math.max(1, s);
}

function isPwValid(v: string): boolean {
  return v.length >= 8;
}

const Register = () => {
  const navigate = useNavigate();
  const formId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

  // Live input state for feedback
  const [passwordInput, setPasswordInput] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      acceptTerms: false,
    },
    mode: "onTouched",
  });

  // Password score calculation
  const pwScore = getPwScore(passwordInput);
  const pwValid = isPwValid(passwordInput);

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    setEmailTaken(false);

    setSubmitting(true);
    try {
      const response = await authService.register({
        displayName: data.displayName.trim(),
        email: data.email.trim(),
        password: data.password,
        acceptTerms: data.acceptTerms,
      });
      const { email, mailSent } = response.data.data;
      navigate("/auth/check-email", { state: { email, mailSent } });
    } catch (err: unknown) {
      const error = toApiError(err);
      if (error.code === "AUTH_EMAIL_TAKEN") {
        setEmailTaken(true);
        setError("email", { type: "server", message: errorMessage(error) });
      } else if (error.code === "VALIDATION_FAILED") {
        const applied = applyFieldErrors<RegisterFormData>(error, setError, {
          email: "email",
          password: "password",
          displayName: "displayName",
          acceptTerms: "acceptTerms",
        });
        if (applied === 0) setApiError(errorMessage(error));
      } else {
        setApiError(errorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout" id="auth">
      {/* ── Left side hero panel ── */}
      <AuthSidePanel />

      {/* ── Right side main form ── */}
      <main className="auth-main">
        {/* Top header bar */}
        <AuthTopBar />

        {/* Form container */}
        <div className="auth-box">
          <section
            className="auth-form"
            style={{ width: "100%", maxWidth: 420 }}
          >
            {/* Header info */}
            <div>
              <span className="ll-overline">Miễn phí, không cần thẻ</span>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}
              >
                Tạo tài khoản
              </h1>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                Chưa tới một phút. Xong thì làm bài kiểm tra 10 phút để có kế
                hoạch riêng.
              </p>
            </div>

            {/* Error alert */}
            {apiError && (
              <div className="ll-form-alert danger">
                <i className="ph ph-warning-circle text-xl flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Register form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
              noValidate
            >
              {/* Display name */}
              <div className={`ll-field ${errors.displayName ? "bad" : ""}`}>
                <label htmlFor={`${formId}-displayName`} className="ll-label">
                  Tên hiển thị
                </label>
                <div className="ll-inp">
                  <i className="ph ph-user" />
                  <input
                    id={`${formId}-displayName`}
                    type="text"
                    autoComplete="name"
                    placeholder="vd: Minh Anh"
                    maxLength={50}
                    {...register("displayName")}
                  />
                </div>
                {errors.displayName ? (
                  <p className="ll-err">{errors.displayName.message}</p>
                ) : (
                  <p className="ll-hint">Tên này được phép trùng với người khác</p>
                )}
              </div>

              {/* Email */}
              <div className={`ll-field ${errors.email ? "bad" : ""}`}>
                <label htmlFor={`${formId}-email`} className="ll-label">
                  Email
                </label>
                <div className="ll-inp">
                  <i className="ph ph-envelope-simple" />
                  <input
                    id={`${formId}-email`}
                    type="email"
                    autoComplete="email"
                    placeholder="ban@email.com"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="ll-err">{errors.email.message}</p>
                )}
                {emailTaken && (
                  <p className="ll-hint">
                    <Link to="/auth/login" className="ll-link">
                      Đăng nhập
                    </Link>
                    {" · "}
                    <Link to="/auth/forgot-password" className="ll-link">
                      Quên mật khẩu
                    </Link>
                    {" · "}
                    <Link
                      to="/auth/check-email"
                      state={{ email: getValues("email").trim(), mailSent: null }}
                      className="ll-link"
                    >
                      Gửi lại email xác thực
                    </Link>
                  </p>
                )}
              </div>

              {/* Password */}
              <div className={`ll-field ${errors.password ? "bad" : ""}`}>
                <label htmlFor={`${formId}-password`} className="ll-label">
                  Mật khẩu
                </label>
                <div className="ll-inp">
                  <i className="ph ph-lock-simple" />
                  <input
                    id={`${formId}-password`}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Ít nhất 8 ký tự"
                    {...register("password", {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        setPasswordInput(e.target.value),
                    })}
                  />
                  <button
                    type="button"
                    className="ll-pw-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={showPassword}
                  >
                    <i
                      className={showPassword ? "ph ph-eye-slash" : "ph ph-eye"}
                    />
                  </button>
                </div>

                {/* Password meter bars */}
                <div
                  className="ll-pw-meter"
                  data-s={pwScore}
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                  <i />
                </div>

                {/* Password hint */}
                <p className={`ll-hint ${errors.password ? "bad" : ""}`}>
                  {errors.password ? (
                    <>
                      <i className="ph ph-warning-circle" />
                      <span>{errors.password.message}</span>
                    </>
                  ) : passwordInput ? (
                    <span>
                      Độ mạnh: <b>{PW_LABELS[pwScore]}</b>
                      {!pwValid && " · cần ít nhất 8 ký tự"}
                    </span>
                  ) : (
                    "Ít nhất 8 ký tự"
                  )}
                </p>
              </div>

              {/* Terms Checkbox */}
              <div className={`ll-field ${errors.acceptTerms ? "bad" : ""}`}>
                <label className="ll-check items-start">
                  <input type="checkbox" {...register("acceptTerms")} />
                  <span className="ll-check-box mt-0.5">
                    <i className="ph ph-check" />
                  </span>
                  <span className="text-[14px] leading-snug">
                    Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng
                    tư của LinguaLoop
                  </span>
                </label>
                <p
                  className="text-[13px] pl-7"
                  style={{ color: "var(--text-muted)" }}
                >
                  <button type="button" className="ll-link">
                    Đọc điều khoản
                  </button>
                  {" · "}
                  <button type="button" className="ll-link">
                    Đọc chính sách
                  </button>
                </p>
                {errors.acceptTerms && (
                  <p className="ll-err pl-7">{errors.acceptTerms.message}</p>
                )}
              </div>

              {/* Privacy / AI speech note */}
              <div className="ll-note-sm">
                <i className="ph ph-shield-check" />
                <span>
                  Quyền lưu giọng nói và gửi bài đọc cho AI được hỏi riêng khi
                  bạn ghi âm lần đầu. Đổi lúc nào cũng được trong Cài đặt.
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="ll-btn primary lg full"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang tạo tài khoản...
                  </span>
                ) : (
                  "Tạo tài khoản"
                )}
              </button>

              {/* Link back to login */}
              <p
                className="text-center text-[13px]"
                style={{ color: "var(--text-muted)" }}
              >
                Đã có tài khoản?{" "}
                <Link to="/auth/login" className="ll-link">
                  Đăng nhập
                </Link>
              </p>
            </form>
          </section>
        </div>

        {/* Footer */}
        <p
          className="auth-foot text-[13px] text-center"
          style={{
            color: "var(--text-muted)",
            marginTop: "auto",
            paddingTop: 16,
          }}
        >
          © 2026 LinguaLoop ·{" "}
          <button type="button" className="ll-link">
            Điều khoản
          </button>{" "}
          ·{" "}
          <button type="button" className="ll-link">
            Quyền riêng tư
          </button>{" "}
          ·{" "}
          <button type="button" className="ll-link">
            Trợ giúp
          </button>
        </p>
      </main>
    </div>
  );
};

export default Register;
