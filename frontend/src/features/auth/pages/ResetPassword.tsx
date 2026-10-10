import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import { authService } from "../services/authService";
import { useAuthStore } from "../stores/authStore";
import { applyFieldErrors, errorMessage, toApiError } from "../errors";
import { getPwScore, isPwValid } from "../passwordStrength";
import { resetPasswordSchema, type ResetPasswordFormData } from "../validations/authSchemas";
import type { ApiError } from "../types";
import AuthSidePanel from "../components/AuthSidePanel";
import AuthTopBar from "../components/AuthTopBar";

type Status = "checking" | "invalid" | "error" | "form" | "done";

const REDIRECT_DELAY_MS = 2000;

const headingStyle = {
  fontSize: 28,
  fontWeight: 700,
  fontFamily: "var(--font-display)",
  lineHeight: 1.2,
  marginBottom: 8,
} as const;

/** Đích của link trong thư đặt lại mật khẩu: `/reset-password?token=...`. Nằm ngoài AuthLayout để người đã đăng nhập vẫn mở được. */
const ResetPassword = () => {
  const { t } = useTranslation("auth");
  const formId = useId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(token ? "checking" : "invalid");
  const [checkError, setCheckError] = useState<ApiError | null>(null);
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  // Kiểm tra link chỉ cần một lần: chặn gọi API hai lần (React StrictMode chạy effect hai lần ở dev)
  const started = useRef(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });

  // Báo link hỏng ngay khi mở link, không đợi nhập xong mật khẩu mới báo (AC-AUTH-39)
  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    authService
      .validateResetToken(token)
      .then(() => setStatus("form"))
      .catch((err: unknown) => {
        const error = toApiError(err);
        if (error.code === "AUTH_LINK_INVALID") {
          setStatus("invalid");
        } else {
          setCheckError(error);
          setStatus("error");
        }
      });
  }, [token]);

  // Đặt xong thì tự chuyển tới trang đăng nhập (AC-AUTH-35)
  useEffect(() => {
    if (status !== "done") return;
    const timer = setTimeout(() => navigate("/auth/login", { state: { passwordReset: true } }), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    setFormError(null);
    try {
      await authService.resetPassword({ token, newPassword: data.newPassword });
    } catch (err: unknown) {
      const error = toApiError(err);
      if (error.code === "AUTH_LINK_INVALID") {
        setStatus("invalid");
      } else if (applyFieldErrors(error, setError, { newPassword: "newPassword" }) === 0) {
        setFormError(error);
      }
      return;
    }
    // Server đã thu hồi mọi phiên; bỏ luôn phiên còn nằm trong bộ nhớ của trình duyệt này
    if (useAuthStore.getState().isAuthenticated) {
      useAuthStore.getState().logout();
    }
    setStatus("done");
  };

  const pwScore = getPwScore(passwordInput);
  const pwValid = isPwValid(passwordInput);
  const eyeLabel = showPassword ? t("register.hidePassword") : t("register.showPassword");
  const inputType = showPassword ? "text" : "password";

  return (
    <div className="auth-layout" id="auth">
      <AuthSidePanel />

      <main className="auth-main">
        <AuthTopBar />

        <div className="auth-box">
          <section
            className={`auth-form ${status === "form" ? "" : "text-center items-center"}`}
            style={{ width: "100%", maxWidth: status === "form" ? 420 : 440 }}
            aria-live="polite"
          >
            {status === "checking" && (
              <>
                <span
                  className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
                  role="status"
                  aria-label={t("reset.checking")}
                />
                <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)" }}>
                  {t("reset.checkingTitle")}
                </h1>
              </>
            )}

            {status === "invalid" && (
              <>
                <div>
                  <span className="ll-overline">{t("reset.invalidOverline")}</span>
                  <h1 style={headingStyle}>{t("reset.invalidTitle")}</h1>
                  <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>
                    {t("reset.invalidDesc")}
                  </p>
                </div>
                <Link to="/auth/forgot-password" className="ll-btn primary lg">
                  {t("reset.requestNew")}
                </Link>
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                  <Link to="/auth/login" className="ll-link">
                    {t("reset.backToLogin")}
                  </Link>
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="ll-form-alert danger text-left" role="alert">
                  <i className="ph ph-warning-circle" style={{ fontSize: 20, flexShrink: 0 }} />
                  <span>{checkError && errorMessage(checkError)}</span>
                </div>
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                  {t("reset.errorHint")}
                </p>
              </>
            )}

            {status === "done" && (
              <>
                <img src="/loopi-hello.svg" width={120} height={120} alt="" draggable={false} />
                <div>
                  <span className="ll-overline">{t("reset.successOverline")}</span>
                  <h1 style={headingStyle}>{t("reset.successTitle")}</h1>
                  <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>
                    {t("reset.successDesc")}
                  </p>
                </div>
                <Link to="/auth/login" state={{ passwordReset: true }} className="ll-btn primary lg">
                  {t("reset.login")}
                </Link>
              </>
            )}

            {status === "form" && (
              <>
                <div>
                  <span className="ll-overline">{t("reset.overline")}</span>
                  <h1 style={headingStyle}>{t("reset.title")}</h1>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {t("reset.subtitle")}
                  </p>
                </div>

                {formError && (
                  <div className="ll-form-alert danger" role="alert">
                    <i className="ph ph-warning-circle" style={{ fontSize: 20, flexShrink: 0 }} />
                    <span>{errorMessage(formError)}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                  <div className={`ll-field ${errors.newPassword ? "bad" : ""}`}>
                    <label htmlFor={`${formId}-new`} className="ll-label">
                      {t("reset.password")}
                    </label>
                    <div className="ll-inp">
                      <i className="ph ph-lock-simple" />
                      <input
                        id={`${formId}-new`}
                        type={inputType}
                        autoComplete="new-password"
                        placeholder={t("reset.passwordPlaceholder")}
                        {...register("newPassword", {
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPasswordInput(e.target.value),
                        })}
                      />
                      <button
                        type="button"
                        className="ll-pw-eye"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={eyeLabel}
                        aria-pressed={showPassword}
                      >
                        <i className={showPassword ? "ph ph-eye-slash" : "ph ph-eye"} />
                      </button>
                    </div>

                    <div className="ll-pw-meter" data-s={pwScore} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>

                    <p className={`ll-hint ${errors.newPassword ? "bad" : ""}`}>
                      {errors.newPassword ? (
                        <>
                          <i className="ph ph-warning-circle" />
                          <span>{errors.newPassword.message}</span>
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

                  <div className={`ll-field ${errors.confirmPassword ? "bad" : ""}`}>
                    <label htmlFor={`${formId}-confirm`} className="ll-label">
                      {t("reset.confirm")}
                    </label>
                    <div className="ll-inp">
                      <i className="ph ph-lock-simple" />
                      <input
                        id={`${formId}-confirm`}
                        type={inputType}
                        autoComplete="new-password"
                        placeholder={t("reset.confirmPlaceholder")}
                        {...register("confirmPassword")}
                      />
                    </div>
                    {errors.confirmPassword && <p className="ll-err">{errors.confirmPassword.message}</p>}
                  </div>

                  <button type="submit" className="ll-btn primary lg full" disabled={isSubmitting}>
                    {isSubmitting ? t("reset.submitting") : t("reset.submit")}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
