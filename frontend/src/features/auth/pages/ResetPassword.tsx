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
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";
import Mascot from "@/components/common/Mascot";
import { buttonClasses } from "@/components/common/buttonStyles";
import { PasswordField } from "@/components/common/TextField";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";

type Status = "checking" | "invalid" | "error" | "form" | "done";

const REDIRECT_DELAY_MS = 2000;

/** Đích của link trong thư đặt lại mật khẩu: `/reset-password?token=...`. Nằm trong AuthLayout nhưng ngoài GuestGuard để người đã đăng nhập vẫn mở được. */
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
  const overline = (text: string) => (
    <span className="block text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text">{text}</span>
  );
  const heading = (text: string) => <h1 className="text-[30px] font-bold leading-[48px] text-text">{text}</h1>;

  return (
    <section
      className={`flex w-full flex-col gap-5 ${status === "form" ? "" : "items-center text-center"}`}
      aria-live="polite"
    >
      {status === "checking" && (
        <>
          <span
            className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
            role="status"
            aria-label={t("reset.checking")}
          />
          <h1 className="text-[30px] font-bold leading-[48px] text-text">{t("reset.checkingTitle")}</h1>
        </>
      )}

      {status === "invalid" && (
        <>
          <div>
            {overline(t("reset.invalidOverline"))}
            {heading(t("reset.invalidTitle"))}
            <p className="text-[15px] text-text-muted">{t("reset.invalidDesc")}</p>
          </div>
          <Link to="/auth/forgot-password" className={buttonClasses({ size: "lg" })}>
            {t("reset.requestNew")}
          </Link>
          <p className="text-[13px] text-text-muted">
            <Link to="/auth/login" className="text-primary-text hover:underline font-medium">
              {t("reset.backToLogin")}
            </Link>
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <FormAlert variant="danger" className="w-full text-left">
            {checkError && errorMessage(checkError)}
          </FormAlert>
          <p className="text-[13px] text-text-muted">{t("reset.errorHint")}</p>
        </>
      )}

      {status === "done" && (
        <>
          <Mascot mood="celebrate" size={120} alt="" />
          <div>
            {overline(t("reset.successOverline"))}
            {heading(t("reset.successTitle"))}
            <p className="text-[15px] text-text-muted">{t("reset.successDesc")}</p>
          </div>
          <Link to="/auth/login" state={{ passwordReset: true }} className={buttonClasses({ size: "lg" })}>
            {t("reset.login")}
          </Link>
        </>
      )}

      {status === "form" && (
        <>
          <div>
            {overline(t("reset.overline"))}
            {heading(t("reset.title"))}
            <p className="text-[14px] leading-relaxed text-text-muted">{t("reset.subtitle")}</p>
          </div>

          {formError && <FormAlert variant="danger">{errorMessage(formError)}</FormAlert>}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            <PasswordField
              id={`${formId}-new`}
              label={t("reset.password")}
              autoComplete="new-password"
              placeholder={t("reset.passwordPlaceholder")}
              showLabel={t("register.showPassword")}
              hideLabel={t("register.hidePassword")}
              visible={showPassword}
              onVisibleChange={setShowPassword}
              error={errors.newPassword?.message}
              below={<PasswordStrengthMeter score={pwScore} />}
              hint={
                passwordInput ? (
                  <span>
                    {t("register.strength")} <b className="text-text">{t(`register.strengthLevels.${pwScore}`)}</b>
                    {!pwValid && t("register.strengthNeedMin")}
                  </span>
                ) : (
                  t("register.passwordHint")
                )
              }
              {...register("newPassword", {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPasswordInput(e.target.value),
              })}
            />

            <PasswordField
              id={`${formId}-confirm`}
              label={t("reset.confirm")}
              autoComplete="new-password"
              placeholder={t("reset.confirmPlaceholder")}
              showLabel={t("register.showPassword")}
              hideLabel={t("register.hidePassword")}
              visible={showPassword}
              onVisibleChange={setShowPassword}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <Button type="submit" size="lg" fullWidth disabled={isSubmitting} isLoading={isSubmitting}>
              {isSubmitting ? t("reset.submitting") : t("reset.submit")}
            </Button>
          </form>
        </>
      )}
    </section>
  );
};

export default ResetPassword;
