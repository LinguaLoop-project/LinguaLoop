import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { yupResolver } from "@hookform/resolvers/yup";
import { applyFieldErrors, authService, errorMessage, getPwScore, toApiError, useAuthStore } from "@/features/auth";
import type { ApiError } from "@/features/auth";
import { userApi } from "../api";
import { buildPasswordSchema, type PasswordFormData } from "../validations";

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
    <button type="button" className="ll-pw-eye" onClick={() => setShow(!show)} aria-label={eyeLabel} aria-pressed={show}>
      <i className={show ? "ph ph-eye-slash" : "ph ph-eye"} />
    </button>
  );
  const type = show ? "text" : "password";

  return (
    <form className="ll-card flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {t(`settings.password.${prefix}Title`)}
        </h3>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
          {t(`settings.password.${prefix}Hint`)}
        </p>
      </div>

      {success && (
        <div className="ll-form-alert success" role="status">
          <i className="ph ph-check-circle" style={{ fontSize: 20, flexShrink: 0 }} />
          <span>{t(success === "change" ? "settings.password.successChange" : "settings.password.successCreate")}</span>
        </div>
      )}
      {formError && (
        <div className="ll-form-alert danger" role="alert">
          <i className="ph ph-warning-circle" style={{ fontSize: 20, flexShrink: 0 }} />
          <span>{errorMessage(formError)}</span>
        </div>
      )}

      {hasPassword && (
        <div className={`ll-field ${errors.currentPassword ? "bad" : ""}`}>
          <label htmlFor="pwCurrent" className="ll-label">{t("settings.password.current")}</label>
          <div className="ll-inp">
            <i className="ph ph-lock-simple" />
            <input id="pwCurrent" type={type} autoComplete="current-password" aria-describedby="pwCurrentErr" {...register("currentPassword")} />
            {eye}
          </div>
          {errors.currentPassword && <p id="pwCurrentErr" className="ll-err">{errors.currentPassword.message}</p>}
        </div>
      )}

      <div className={`ll-field ${errors.newPassword ? "bad" : ""}`}>
        <label htmlFor="pwNew" className="ll-label">{t("settings.password.new")}</label>
        <div className="ll-inp">
          <i className="ph ph-lock-simple" />
          <input
            id="pwNew"
            type={type}
            autoComplete="new-password"
            aria-describedby="pwNewHint"
            {...register("newPassword", { onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value) })}
          />
          {eye}
        </div>
        <div className="ll-pw-meter" data-s={pwScore} aria-hidden="true">
          <i /><i /><i /><i />
        </div>
        <p id="pwNewHint" className={`ll-hint ${errors.newPassword ? "bad" : ""}`}>
          {errors.newPassword ? (
            <>
              <i className="ph ph-warning-circle" />
              <span>{errors.newPassword.message}</span>
            </>
          ) : (
            t("settings.password.newHint")
          )}
        </p>
      </div>

      <div className={`ll-field ${errors.confirmPassword ? "bad" : ""}`}>
        <label htmlFor="pwConfirm" className="ll-label">{t("settings.password.confirm")}</label>
        <div className="ll-inp">
          <i className="ph ph-lock-simple" />
          <input id="pwConfirm" type={type} autoComplete="new-password" aria-describedby="pwConfirmErr" {...register("confirmPassword")} />
        </div>
        {errors.confirmPassword && <p id="pwConfirmErr" className="ll-err">{errors.confirmPassword.message}</p>}
      </div>

      <div className="flex justify-end">
        <button type="submit" className="ll-btn primary" disabled={isSubmitting}>
          {isSubmitting ? t("settings.password.submitting") : t(hasPassword ? "settings.password.submitChange" : "settings.password.submitCreate")}
        </button>
      </div>
    </form>
  );
}
