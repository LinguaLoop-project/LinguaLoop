import { useState, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  registerSchema,
  type RegisterFormData,
} from "../validations/authSchemas";
import { authService } from "../services/authService";
import { applyFieldErrors, errorMessage, toApiError } from "../errors";
import { getPwScore, isPwValid } from "../passwordStrength";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";
import Checkbox from "@/components/common/Checkbox";
import Icon from "@/components/common/Icon";

export const Register = () => {
  const { t } = useTranslation("auth");
  const formId = useId();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
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

  const pwScore = getPwScore(passwordInput);
  const pwValid = isPwValid(passwordInput);

  const onSubmit = async (data: RegisterFormData) => {
    setSubmitting(true);
    setApiError(null);
    setEmailTaken(false);

    try {
      const trimmedEmail = data.email.trim();
      const trimmedDisplayName = data.displayName.trim();

      const res = await authService.register({
        email: trimmedEmail,
        password: data.password,
        displayName: trimmedDisplayName,
        acceptTerms: data.acceptTerms,
      });

      const { email: registeredEmail, mailSent } = res.data.data;
      navigate("/auth/check-email", {
        state: { email: registeredEmail, mailSent },
      });
    } catch (err: unknown) {
      const error = toApiError(err);
      if (error.code === "AUTH_EMAIL_TAKEN") {
        setEmailTaken(true);
        setError("email", {
          type: "server",
          message: errorMessage(error),
        });
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
    <section className="flex flex-col gap-5 w-full">
      {/* Header info */}
      <div>
        <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-accent mb-1 block">
          {t("register.overline")}
        </span>
        <h1 className="text-2xl sm:text-[28px] font-bold font-display text-text leading-tight mb-2">
          {t("register.title")}
        </h1>
        <p className="text-[14px] leading-relaxed text-text-muted">
          {t("register.subtitle")}
        </p>
      </div>

      {/* Error alert */}
      {apiError && <FormAlert variant="danger">{apiError}</FormAlert>}

      {/* Register form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        {/* Display name */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${formId}-displayName`}
            className="text-[13px] font-semibold text-text"
          >
            {t("register.displayName")}
          </label>
          <div
            className={`relative flex items-center h-11 px-3.5 rounded-md border bg-surface-glass text-text transition-colors duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
              errors.displayName
                ? "border-danger focus-within:border-danger focus-within:ring-danger/20"
                : "border-border"
            }`}
          >
            <Icon name="user" className="text-lg text-text-subtle mr-2.5 shrink-0" />
            <input
              id={`${formId}-displayName`}
              type="text"
              autoComplete="name"
              placeholder={t("register.displayNamePlaceholder")}
              className="w-full h-full bg-transparent border-0 outline-none text-text text-sm placeholder:text-text-subtle"
              {...register("displayName")}
            />
          </div>
          {errors.displayName ? (
            <p className="text-xs font-medium text-danger mt-0.5">
              {errors.displayName.message}
            </p>
          ) : (
            <p className="text-xs text-text-muted mt-0.5">
              {t("register.displayNameHint")}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${formId}-email`}
            className="text-[13px] font-semibold text-text"
          >
            {t("register.email")}
          </label>
          <div
            className={`relative flex items-center h-11 px-3.5 rounded-md border bg-surface-glass text-text transition-colors duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
              errors.email
                ? "border-danger focus-within:border-danger focus-within:ring-danger/20"
                : "border-border"
            }`}
          >
            <Icon name="mail" className="text-lg text-text-subtle mr-2.5 shrink-0" />
            <input
              id={`${formId}-email`}
              type="email"
              autoComplete="email"
              placeholder={t("register.emailPlaceholder")}
              className="w-full h-full bg-transparent border-0 outline-none text-text text-sm placeholder:text-text-subtle"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs font-medium text-danger mt-0.5">
              {errors.email.message}
            </p>
          )}
          {emailTaken && (
            <p className="text-xs text-text-muted mt-0.5">
              <Link
                to="/auth/login"
                className="text-accent hover:underline font-medium"
              >
                {t("register.emailTakenLogin")}
              </Link>
              {" · "}
              <Link
                to="/auth/forgot-password"
                className="text-accent hover:underline font-medium"
              >
                {t("register.emailTakenForgot")}
              </Link>
              {" · "}
              <Link
                to="/auth/check-email"
                state={{
                  email: getValues("email").trim(),
                  mailSent: null,
                }}
                className="text-accent hover:underline font-medium"
              >
                {t("register.emailTakenResend")}
              </Link>
            </p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${formId}-password`}
            className="text-[13px] font-semibold text-text"
          >
            {t("register.password")}
          </label>
          <div
            className={`relative flex items-center h-11 px-3.5 rounded-md border bg-surface-glass text-text transition-colors duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
              errors.password
                ? "border-danger focus-within:border-danger focus-within:ring-danger/20"
                : "border-border"
            }`}
          >
            <Icon name="lock" className="text-lg text-text-subtle mr-2.5 shrink-0" />
            <input
              id={`${formId}-password`}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("register.passwordPlaceholder")}
              className="w-full h-full bg-transparent border-0 outline-none text-text text-sm placeholder:text-text-subtle"
              {...register("password", {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  setPasswordInput(e.target.value),
              })}
            />
            <button
              type="button"
              className="shrink-0 p-1 text-lg text-text-subtle hover:text-text cursor-pointer transition-colors border-0 bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword
                  ? t("register.hidePassword")
                  : t("register.showPassword")
              }
              aria-pressed={showPassword}
            >
              <Icon name={showPassword ? "eye-off" : "eye"} />
            </button>
          </div>

          <PasswordStrengthMeter score={pwScore} />

          {/* Password hint */}
          <p
            className={`text-xs mt-0.5 ${errors.password ? "text-danger flex items-center gap-1 font-medium" : "text-text-muted"}`}
          >
            {errors.password ? (
              <>
                <Icon name="circle-alert" />
                <span>{errors.password.message}</span>
              </>
            ) : passwordInput ? (
              <span>
                {t("register.strength")}{" "}
                <b className="text-text">
                  {t(`register.strengthLevels.${pwScore}`)}
                </b>
                {!pwValid && t("register.strengthNeedMin")}
              </span>
            ) : (
              <span>{t("register.passwordHelp")}</span>
            )}
          </p>
        </div>

        {/* Accept terms */}
        <div className="flex flex-col gap-1">
          <Checkbox
            id={`${formId}-terms`}
            label={t("register.terms")}
            {...register("acceptTerms")}
          />
          <p className="text-[13px] pl-7 text-text-muted">
            <button
              type="button"
              className="text-accent hover:underline font-medium cursor-pointer bg-transparent border-0"
            >
              {t("register.readTerms")}
            </button>
            {" · "}
            <button
              type="button"
              className="text-accent hover:underline font-medium cursor-pointer bg-transparent border-0"
            >
              {t("register.readPolicy")}
            </button>
          </p>
          {errors.acceptTerms && (
            <p className="text-xs font-medium text-danger pl-7">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        {/* Privacy / AI speech note */}
        <div className="flex items-center gap-2 p-2.5 sm:px-3 rounded-md bg-surface-hover border border-border text-xs text-text-muted">
          <Icon name="shield-check" className="text-base text-accent shrink-0" />
          <span>{t("register.voiceNote")}</span>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting}
          isLoading={submitting}
        >
          {t("register.submit")}
        </Button>

        {/* Link back to login */}
        <p className="text-center text-[13px] text-text-muted">
          {t("register.haveAccount")}{" "}
          <Link
            to="/auth/login"
            className="text-accent hover:underline font-medium"
          >
            {t("register.login")}
          </Link>
        </p>
      </form>
    </section>
  );
};

export default Register;
