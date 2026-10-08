import React, { useState, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { yupResolver } from "@hookform/resolvers/yup";
import { authService } from "../services/authService";
import { registerSchema, type RegisterFormData } from "../validations/authSchemas";
import { applyFieldErrors, errorMessage, toApiError } from "../errors";
import AuthSidePanel from "../components/AuthSidePanel";
import AuthTopBar from "../components/AuthTopBar";
import { getPwScore, isPwValid } from "../passwordStrength";
import GoogleSignInButton from "../components/GoogleSignInButton";

const Register = () => {
  const { t } = useTranslation("auth");
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
              <span className="ll-overline">{t("register.overline")}</span>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}
              >
                {t("register.title")}
              </h1>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {t("register.subtitle")}
              </p>
            </div>

            {/* Error alert */}
            {apiError && (
              <div className="ll-form-alert danger">
                <i className="ph ph-warning-circle text-xl flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Google + "or" divider (ẩn khi chưa có client ID) */}
            <GoogleSignInButton variant="signup" />

            {/* Register form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
              noValidate
            >
              {/* Display name */}
              <div className={`ll-field ${errors.displayName ? "bad" : ""}`}>
                <label htmlFor={`${formId}-displayName`} className="ll-label">
                  {t("register.displayName")}
                </label>
                <div className="ll-inp">
                  <i className="ph ph-user" />
                  <input
                    id={`${formId}-displayName`}
                    type="text"
                    autoComplete="name"
                    placeholder={t("register.displayNamePlaceholder")}
                    maxLength={50}
                    {...register("displayName")}
                  />
                </div>
                {errors.displayName ? (
                  <p className="ll-err">{errors.displayName.message}</p>
                ) : (
                  <p className="ll-hint">{t("register.displayNameHint")}</p>
                )}
              </div>

              {/* Email */}
              <div className={`ll-field ${errors.email ? "bad" : ""}`}>
                <label htmlFor={`${formId}-email`} className="ll-label">
                  {t("register.email")}
                </label>
                <div className="ll-inp">
                  <i className="ph ph-envelope-simple" />
                  <input
                    id={`${formId}-email`}
                    type="email"
                    autoComplete="email"
                    placeholder={t("register.emailPlaceholder")}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="ll-err">{errors.email.message}</p>
                )}
                {emailTaken && (
                  <p className="ll-hint">
                    <Link to="/auth/login" className="ll-link">
                      {t("register.emailTakenLogin")}
                    </Link>
                    {" · "}
                    <Link to="/auth/forgot-password" className="ll-link">
                      {t("register.emailTakenForgot")}
                    </Link>
                    {" · "}
                    <Link
                      to="/auth/check-email"
                      state={{ email: getValues("email").trim(), mailSent: null }}
                      className="ll-link"
                    >
                      {t("register.emailTakenResend")}
                    </Link>
                  </p>
                )}
              </div>

              {/* Password */}
              <div className={`ll-field ${errors.password ? "bad" : ""}`}>
                <label htmlFor={`${formId}-password`} className="ll-label">
                  {t("register.password")}
                </label>
                <div className="ll-inp">
                  <i className="ph ph-lock-simple" />
                  <input
                    id={`${formId}-password`}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={t("register.passwordPlaceholder")}
                    {...register("password", {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        setPasswordInput(e.target.value),
                    })}
                  />
                  <button
                    type="button"
                    className="ll-pw-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t("register.hidePassword") : t("register.showPassword")}
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
                      {t("register.strength")} <b>{t(`register.strengthLevels.${pwScore}`)}</b>
                      {!pwValid && t("register.strengthNeedMin")}
                    </span>
                  ) : (
                    t("register.passwordHint")
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
                    {t("register.acceptTerms")}
                  </span>
                </label>
                <p
                  className="text-[13px] pl-7"
                  style={{ color: "var(--text-muted)" }}
                >
                  <button type="button" className="ll-link">
                    {t("register.readTerms")}
                  </button>
                  {" · "}
                  <button type="button" className="ll-link">
                    {t("register.readPolicy")}
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
                  {t("register.voiceNote")}
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
                    {t("register.submitting")}
                  </span>
                ) : (
                  t("register.submit")
                )}
              </button>

              {/* Link back to login */}
              <p
                className="text-center text-[13px]"
                style={{ color: "var(--text-muted)" }}
              >
                {t("register.haveAccount")}{" "}
                <Link to="/auth/login" className="ll-link">
                  {t("register.login")}
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

export default Register;
