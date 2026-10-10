import { useState, useId } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Trans, useTranslation } from "react-i18next";
import { authService } from "../services/authService";
import { applyFieldErrors, errorMessage, toApiError } from "../errors";
import type { ApiError } from "../types";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "../validations/authSchemas";
import AuthSidePanel from "../components/AuthSidePanel";
import AuthTopBar from "../components/AuthTopBar";

const ForgotPassword = () => {
  const { t } = useTranslation("auth");
  const formId = useId();
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const {
    register,
    handleSubmit,
    setError,
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
    } catch (err: unknown) {
      const error = toApiError(err);
      // 400 theo field (email sai định dạng) hiện ngay dưới ô email, lỗi khác hiện ở khung báo lỗi chung (AC-AUTH-37)
      if (applyFieldErrors(error, setError, { email: "email" }) === 0) {
        setApiError(error);
      }
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
              <span>{t("forgot.backToLogin")}</span>
            </Link>

            {/* Header info */}
            <div>
              <span className="ll-overline">{t("forgot.overline")}</span>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}
              >
                {t("forgot.title")}
              </h1>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {t("forgot.subtitle")}
              </p>
            </div>

            {/* Success notification */}
            {submittedEmail && (
              <div className="ll-form-alert success" role="status">
                <i className="ph ph-check-circle text-xl flex-shrink-0" />
                <span className="text-[14px] leading-relaxed">
                  <Trans
                    t={t}
                    i18nKey="forgot.success"
                    values={{ email: submittedEmail }}
                    components={{ b: <b /> }}
                    shouldUnescape tOptions={{ interpolation: { escapeValue: true } }}
                  />
                </span>
              </div>
            )}

            {/* API error */}
            {apiError && (
              <div className="ll-form-alert danger">
                <i className="ph ph-warning-circle text-xl flex-shrink-0" />
                <span>{errorMessage(apiError)}</span>
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
                  {t("forgot.email")}
                </label>
                <div className="ll-inp">
                  <i className="ph ph-envelope-simple" />
                  <input
                    id={`${formId}-email`}
                    type="email"
                    autoComplete="email"
                    placeholder={t("forgot.emailPlaceholder")}
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
                    {t("forgot.submitting")}
                  </span>
                ) : submittedEmail ? (
                  t("forgot.resubmit")
                ) : (
                  t("forgot.submit")
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
            {t("footer.terms")}
          </button>{" "}
          ·{" "}
          <button type="button" className="ll-link">
            {t("footer.privacy")}
          </button>{" "}
          ·{" "}
          <button type="button" className="ll-link">
            {t("footer.help")}
          </button>
        </p>
      </main>
    </div>
  );
};

export default ForgotPassword;
