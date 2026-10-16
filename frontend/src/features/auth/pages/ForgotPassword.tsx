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
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";

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
    <section className="flex flex-col gap-5 w-full">
      {/* Back link */}
      <Link
        to="/auth/login"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-muted hover:text-text transition-colors w-fit"
      >
        <Icon name="arrow-left" className="text-base" />
        <span>{t("forgot.backToLogin")}</span>
      </Link>

      {/* Header info */}
      <div>
        <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-accent mb-1 block">
          {t("forgot.overline")}
        </span>
        <h1 className="text-2xl sm:text-[28px] font-bold font-display text-text leading-tight mb-2">
          {t("forgot.title")}
        </h1>
        <p className="text-[14px] leading-relaxed text-text-muted">
          {t("forgot.subtitle")}
        </p>
      </div>

      {/* Success notification */}
      {submittedEmail && (
        <FormAlert variant="success">
          <span className="text-[14px] leading-relaxed">
            <Trans
              t={t}
              i18nKey="forgot.success"
              values={{ email: submittedEmail }}
              components={{ b: <b /> }}
              shouldUnescape
              tOptions={{ interpolation: { escapeValue: true } }}
            />
          </span>
        </FormAlert>
      )}

      {/* API error */}
      {apiError && (
        <FormAlert variant="danger">{errorMessage(apiError)}</FormAlert>
      )}

      {/* Forgot password form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${formId}-email`}
            className="text-[13px] font-semibold text-text"
          >
            {t("forgot.email")}
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
              placeholder={t("forgot.emailPlaceholder")}
              className="w-full h-full bg-transparent border-0 outline-none text-text text-sm placeholder:text-text-subtle"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs font-medium text-danger mt-0.5">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={loading}
          isLoading={loading}
        >
          {submittedEmail ? t("forgot.resubmit") : t("forgot.submit")}
        </Button>
      </form>
    </section>
  );
};

export default ForgotPassword;
