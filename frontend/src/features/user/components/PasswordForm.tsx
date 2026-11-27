import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { yupResolver } from "@hookform/resolvers/yup";
import { applyFieldErrors, authService, errorMessage, getPwScore, toApiError, useAuthStore } from "@/features/auth";
import type { ApiError } from "@/features/auth";
import { toast } from "@/stores/toastStore";
import { userApi } from "../api";
import { buildPasswordSchema, type PasswordFormData } from "../validations";
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
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
  const [formError, setFormError] = useState<ApiError | null>(null);
  // Giữ lại cả lúc form chuyển từ "tạo" sang "đổi" sau khi tạo thành công
  const [success, setSuccess] = useState<"create" | "change" | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PasswordFormData>({
    resolver: yupResolver(schema),
    defaultValues: EMPTY,
    mode: "onTouched",
  });

  const newPassword = useWatch({ control, name: "newPassword" }) ?? "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) ?? "";
  const pwScore = getPwScore(newPassword);

  const checks = [
    { key: "length", met: newPassword.length >= 8, label: t("settings.password.ruleLength") },
    { key: "mix", met: /[A-Za-z]/.test(newPassword) && /\d/.test(newPassword), label: t("settings.password.ruleMix") },
    {
      key: "match",
      met: newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword,
      label: t("settings.password.ruleMatch"),
    },
  ];

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
    const kind = hasPassword ? "change" : "create";
    setSuccess(kind);
    toast(t(kind === "change" ? "settings.password.successChange" : "settings.password.successCreate"), {
      icon: "shield-check",
    });
    reset(EMPTY);
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
      className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text"
        >
          <Icon name="lock-keyhole" className="text-lg" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-text sm:text-lg">
            {t(`settings.password.${prefix}Title`)}
          </h3>
          <p className="mt-0.5 text-[13px] leading-relaxed text-text-muted">
            {t(`settings.password.${prefix}Hint`)}
          </p>
        </div>
      </div>

      {success && (
        <FormAlert variant="success">
          {t(success === "change" ? "settings.password.successChange" : "settings.password.successCreate")}
        </FormAlert>
      )}
      {formError && <FormAlert variant="danger">{errorMessage(formError)}</FormAlert>}

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
        {...register("newPassword")}
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

      {/* Danh sách kiểm tra trực quan các yêu cầu mật khẩu */}
      {(newPassword.length > 0 || confirmPassword.length > 0) && (
        <ul className="grid grid-cols-1 gap-1.5 rounded-md border border-border bg-bg-elevated px-3.5 py-3 text-xs sm:grid-cols-3">
          {checks.map((item) => (
            <li
              key={item.key}
              className={`flex items-center gap-1.5 transition-colors ${
                item.met ? "font-medium text-success" : "text-text-subtle"
              }`}
            >
              <Icon name={item.met ? "circle-check" : "circle-dot"} className="shrink-0 text-sm" />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end border-t border-border/70 pt-4">
        <Button type="submit" variant="primary" disabled={isSubmitting || !isDirty} isLoading={isSubmitting}>
          {isSubmitting ? t("settings.password.submitting") : t(hasPassword ? "settings.password.submitChange" : "settings.password.submitCreate")}
        </Button>
      </div>
    </form>
  );
}
