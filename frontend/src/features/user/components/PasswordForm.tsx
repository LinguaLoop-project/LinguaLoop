import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { yupResolver } from "@hookform/resolvers/yup";
import { applyFieldErrors, authService, errorMessage, getPwScore, toApiError, useAuthStore } from "@/features/auth";
import type { ApiError } from "@/features/auth";
import { userApi } from "../api";
import { buildPasswordSchema, type PasswordFormData } from "../validations";
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";
import PasswordStrengthMeter from "@/features/auth/components/PasswordStrengthMeter";
import Icon from "@/components/common/Icon";

const EMPTY: PasswordFormData = { currentPassword: "", newPassword: "", confirmPassword: "" };

/** Tạo mật khẩu (tài khoản Google chưa có) hoặc đổi mật khẩu (UC-AUTH-07). */
export default function PasswordForm() {
  const { t } = useTranslation("auth");
  const hasPassword = useAuthStore((state) => state.user?.hasPassword ?? false);
  const setUser = useAuthStore((state) => state.setUser);
  const schema = useMemo(() => buildPasswordSchema(hasPassword), [hasPassword]);

  const [show, setShow] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState<ApiError | null>(null);
  // Giữ lại cả lúc form chuyển từ "tạo" sang "đổi" sau khi tạo thành công
  const [success, setSuccess] = useState<"create" | "change" | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: yupResolver(schema),
    defaultValues: EMPTY,
    mode: "onTouched",
  });

  const pwScore = getPwScore(newPassword);

  const onSubmit = async (data: PasswordFormData) => {
    setFormError(null);
    setSuccess(null);
    try {
      await userApi.changePassword({
        ...(hasPassword ? { currentPassword: data.currentPassword ?? "" } : {}),
        newPassword: data.newPassword,
      });
    } catch (err: unknown) {
      const error = toApiError(err);
      if (error.code === "AUTH_CURRENT_PASSWORD_WRONG") {
        setError("currentPassword", { type: "server", message: errorMessage(error) });
      } else if (applyFieldErrors(error, setError, { currentPassword: "currentPassword", newPassword: "newPassword" }) === 0) {
        setFormError(error);
      }
      return;
    }
    setSuccess(hasPassword ? "change" : "create");
    reset(EMPTY);
    setNewPassword("");
    // Cập nhật hasPassword để form chuyển sang chế độ đổi mật khẩu (AC-AUTH-43)
    try {
      const me = await authService.getMe();
      setUser(me.data.data);
    } catch {
      // Mật khẩu đã đổi xong; không lấy lại được hồ sơ thì form vẫn ở chế độ cũ cho tới lần tải lại
    }
  };

  const prefix = hasPassword ? "change" : "create";
  const eyeLabel = show ? t("settings.password.hide") : t("settings.password.show");
  const eye = (
    <button
      type="button"
      className="shrink-0 p-1 text-lg text-text-subtle hover:text-text cursor-pointer transition-colors border-0 bg-transparent"
      onClick={() => setShow(!show)}
      aria-label={eyeLabel}
      aria-pressed={show}
    >
      <Icon name={show ? "eye-off" : "eye"} />
    </button>
  );
  const type = show ? "text" : "password";

  return (
    <form
      className="p-6 rounded-2xl bg-surface border border-border shadow-[var(--shadow-card)] flex flex-col gap-5"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div>
        <h3 className="text-lg font-semibold font-display text-text">
          {t(`settings.password.${prefix}Title`)}
        </h3>
        <p className="mt-1 text-[13px] text-text-muted">
          {t(`settings.password.${prefix}Hint`)}
        </p>
      </div>

      {success && (
        <FormAlert variant="success">
          {t(success === "change" ? "settings.password.successChange" : "settings.password.successCreate")}
        </FormAlert>
      )}
      {formError && (
        <FormAlert variant="danger">
          {errorMessage(formError)}
        </FormAlert>
      )}

      {hasPassword && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pwCurrent" className="text-[13px] font-semibold text-text">
            {t("settings.password.current")}
          </label>
          <div
            className={`relative flex items-center h-11 px-3.5 rounded-md border bg-surface-glass text-text transition-colors duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
              errors.currentPassword ? "border-danger focus-within:border-danger focus-within:ring-danger/20" : "border-border"
            }`}
          >
            <Icon name="lock" className="text-lg text-text-subtle mr-2.5 shrink-0" />
            <input
              id="pwCurrent"
              type={type}
              autoComplete="current-password"
              aria-describedby="pwCurrentErr"
              className="w-full h-full bg-transparent border-0 outline-none text-text text-sm placeholder:text-text-subtle"
              {...register("currentPassword")}
            />
            {eye}
          </div>
          {errors.currentPassword && (
            <p id="pwCurrentErr" className="text-xs font-medium text-danger mt-0.5">
              {errors.currentPassword.message}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pwNew" className="text-[13px] font-semibold text-text">
          {t("settings.password.new")}
        </label>
        <div
          className={`relative flex items-center h-11 px-3.5 rounded-md border bg-surface-glass text-text transition-colors duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
            errors.newPassword ? "border-danger focus-within:border-danger focus-within:ring-danger/20" : "border-border"
          }`}
        >
          <Icon name="lock" className="text-lg text-text-subtle mr-2.5 shrink-0" />
          <input
            id="pwNew"
            type={type}
            autoComplete="new-password"
            aria-describedby="pwNewHint"
            className="w-full h-full bg-transparent border-0 outline-none text-text text-sm placeholder:text-text-subtle"
            {...register("newPassword", { onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value) })}
          />
          {eye}
        </div>
        <PasswordStrengthMeter score={pwScore} />
        <p
          id="pwNewHint"
          className={`text-xs mt-0.5 leading-normal ${errors.newPassword ? "text-danger flex items-center gap-1 font-medium" : "text-text-muted"}`}
        >
          {errors.newPassword ? (
            <>
              <Icon name="circle-alert" />
              <span>{errors.newPassword.message}</span>
            </>
          ) : (
            t("settings.password.newHint")
          )}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pwConfirm" className="text-[13px] font-semibold text-text">
          {t("settings.password.confirm")}
        </label>
        <div
          className={`relative flex items-center h-11 px-3.5 rounded-md border bg-surface-glass text-text transition-colors duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
            errors.confirmPassword ? "border-danger focus-within:border-danger focus-within:ring-danger/20" : "border-border"
          }`}
        >
          <Icon name="lock" className="text-lg text-text-subtle mr-2.5 shrink-0" />
          <input
            id="pwConfirm"
            type={type}
            autoComplete="new-password"
            aria-describedby="pwConfirmErr"
            className="w-full h-full bg-transparent border-0 outline-none text-text text-sm placeholder:text-text-subtle"
            {...register("confirmPassword")}
          />
        </div>
        {errors.confirmPassword && (
          <p id="pwConfirmErr" className="text-xs font-medium text-danger mt-0.5">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" variant="primary" disabled={isSubmitting} isLoading={isSubmitting}>
          {isSubmitting ? t("settings.password.submitting") : t(hasPassword ? "settings.password.submitChange" : "settings.password.submitCreate")}
        </Button>
      </div>
    </form>
  );
}
