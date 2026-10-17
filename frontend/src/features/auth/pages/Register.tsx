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
import { PasswordField, TextField } from "@/components/common/TextField";

export const Register = () => {
  const { t } = useTranslation("auth");
  const formId = useId();
  const navigate = useNavigate();

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
        <span className="block text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text">
          {t("register.overline")}
        </span>
        <h1 className="text-[30px] font-bold leading-[48px] text-text">
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
        <TextField
          id={`${formId}-displayName`}
          label={t("register.displayName")}
          icon="user"
          autoComplete="name"
          placeholder={t("register.displayNamePlaceholder")}
          error={errors.displayName?.message}
          hint={t("register.displayNameHint")}
          {...register("displayName")}
        />

        {/* Email */}
        <TextField
          id={`${formId}-email`}
          label={t("register.email")}
          icon="mail"
          type="email"
          autoComplete="email"
          placeholder={t("register.emailPlaceholder")}
          error={errors.email?.message}
          footer={
            emailTaken && (
              <p className="text-xs text-text-muted mt-0.5">
                <Link to="/auth/login" className="text-primary-text hover:underline font-medium">
                  {t("register.emailTakenLogin")}
                </Link>
                {" · "}
                <Link to="/auth/forgot-password" className="text-primary-text hover:underline font-medium">
                  {t("register.emailTakenForgot")}
                </Link>
                {" · "}
                <Link
                  to="/auth/check-email"
                  state={{ email: getValues("email").trim(), mailSent: null }}
                  className="text-primary-text hover:underline font-medium"
                >
                  {t("register.emailTakenResend")}
                </Link>
              </p>
            )
          }
          {...register("email")}
        />

        {/* Password */}
        <PasswordField
          id={`${formId}-password`}
          label={t("register.password")}
          autoComplete="new-password"
          placeholder={t("register.passwordPlaceholder")}
          showLabel={t("register.showPassword")}
          hideLabel={t("register.hidePassword")}
          error={errors.password?.message}
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
          {...register("password", {
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPasswordInput(e.target.value),
          })}
        />

        {/* Accept terms */}
        <div className="flex flex-col gap-1">
          <Checkbox
            id={`${formId}-terms`}
            label={t("register.acceptTerms")}
            {...register("acceptTerms")}
          />
          <p className="text-[13px] pl-7 text-text-muted">
            <button
              type="button"
              className="font-semibold text-primary-text hover:underline cursor-pointer bg-transparent border-0"
            >
              {t("register.readTerms")}
            </button>
            {" · "}
            <button
              type="button"
              className="font-semibold text-primary-text hover:underline cursor-pointer bg-transparent border-0"
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
            className="font-semibold text-primary-text hover:underline"
          >
            {t("register.login")}
          </Link>
        </p>
      </form>
    </section>
  );
};

export default Register;
