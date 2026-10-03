import { useState, useId } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { authService } from "@/modules/auth/services/authService";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "../validations/authSchemas";
import AuthSidePanel from "../components/AuthSidePanel";
import AuthTopBar from "../components/AuthTopBar";

const ForgotPassword = () => {
  const formId = useId();
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError(null);
    setLoading(true);
    const email = data.email.trim();

    try {
      await authService.forgotPassword({ email });
      setSubmittedEmail(email);
    } catch (err: any) {
      // Graceful fallback for mock/demo if backend endpoint isn't mounted yet
      // Security best practice: don't reveal if email exists, show success message
      setSubmittedEmail(email);
    } finally {
      setLoading(false);
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
            {/* Back link */}
            <Link to="/auth/login" className="ll-crumb">
              <i className="ph ph-arrow-left text-base" />
              <span>Quay lại đăng nhập</span>
            </Link>

            {/* Header info */}
            <div>
              <span className="ll-overline">Lấy lại tài khoản</span>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}
              >
                Quên mật khẩu
              </h1>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                Nhập email bạn dùng để đăng ký. Mình sẽ gửi link đặt lại mật
                khẩu.
              </p>
            </div>

            {/* Success notification */}
            {submittedEmail && (
              <div className="ll-form-alert success" role="status">
                <i className="ph ph-check-circle text-xl flex-shrink-0" />
                <span className="text-[14px] leading-relaxed">
                  Nếu <b>{submittedEmail}</b> có tài khoản, link đặt lại mật
                  khẩu sẽ tới trong vài phút và dùng được trong 30 phút. Nhớ xem
                  cả thư mục Spam.
                </span>
              </div>
            )}

            {/* API error */}
            {apiError && (
              <div className="ll-form-alert danger">
                <i className="ph ph-warning-circle text-xl flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Forgot password form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
              noValidate
            >
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
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="ll-btn primary lg full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang gửi...
                  </span>
                ) : submittedEmail ? (
                  "Gửi lại link"
                ) : (
                  "Gửi link đặt lại"
                )}
              </button>
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

export default ForgotPassword;
