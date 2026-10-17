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
import { PasswordField } from "@/components/common/TextField";

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
  return (
    <form
      className="p-5 rounded-lg bg-surface border border-border shadow-[var(--shadow-card)] flex flex-col gap-5"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div>
        <h3 className="text-lg font-bold leading-[1.4]">
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
        <PasswordField
          id="pwCurrent"
          label={t("settings.password.current")}
          autoComplete="current-password"
          showLabel={t("settings.password.show")}
          hideLabel={t("settings.password.hide")}
          visible={show}
          onVisibleChange={setShow}
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />
      )}

      <PasswordField
        id="pwNew"
        label={t("settings.password.new")}
        autoComplete="new-password"
        showLabel={t("settings.password.show")}
        hideLabel={t("settings.password.hide")}
        visible={show}
        onVisibleChange={setShow}
        error={errors.newPassword?.message}
        below={<PasswordStrengthMeter score={pwScore} />}
        hint={t("settings.password.newHint")}
        {...register("newPassword", { onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value) })}
      />

      <PasswordField
        id="pwConfirm"
        label={t("settings.password.confirm")}
        autoComplete="new-password"
        showLabel={t("settings.password.show")}
        hideLabel={t("settings.password.hide")}
        visible={show}
        onVisibleChange={setShow}
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <div className="flex justify-end pt-1">
        <Button type="submit" variant="primary" disabled={isSubmitting} isLoading={isSubmitting}>
          {isSubmitting ? t("settings.password.submitting") : t(hasPassword ? "settings.password.submitChange" : "settings.password.submitCreate")}
        </Button>
      </div>
    </form>
  );
}
