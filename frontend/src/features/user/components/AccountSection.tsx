import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { yupResolver } from "@hookform/resolvers/yup";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { TextField } from "@/components/common/TextField";
import { applyFieldErrors, authService, errorMessage, toApiError, useAuthStore } from "@/features/auth";
import type { ApiError } from "@/features/auth";
import { useMyPlan } from "@/features/subscription/hooks/useMyPlan";
import { toast } from "@/stores/toastStore";
import { userApi } from "../api";
import AvatarPicker from "./AvatarPicker";
import { SettingsCard } from "./SettingsCard";
import { profilePayload } from "../profilePayload";
import { buildDisplayNameSchema, type DisplayNameFormData } from "../validations";

/** Sau mỗi lần gửi lại email xác thực phải chờ 60 giây mới gửi tiếp (AC-AUTH-31). */
const RESEND_COOLDOWN_MS = 60_000;

/** Nhắc xác thực email và cho gửi lại thư xác thực (UC-TK-05); chỉ hiện khi email chưa xác thực. */
function VerifyEmailNotice({ email }: { email: string }) {
  const { t } = useTranslation("auth");
  const [cooldownEnd, setCooldownEnd] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const secondsLeft = Math.max(0, Math.ceil((cooldownEnd - now) / 1000));

  useEffect(() => {
    if (cooldownEnd <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [cooldownEnd]);

  const resend = async () => {
    setSending(true);
    setError(null);
    try {
      await authService.resendVerification(email);
      setSent(true);
      setNow(Date.now());
      setCooldownEnd(Date.now() + RESEND_COOLDOWN_MS);
    } catch (err: unknown) {
      setError(toApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-warning/15 text-warning">
          <Icon name="mail" className="text-base" />
        </span>
        <div className="min-w-0 flex-1">
          <b className="block text-sm text-text">{t("settings.account.verifyTitle")}</b>
          <p className="mt-0.5 text-[13px] leading-relaxed text-text-muted">{t("settings.account.verifyHint", { email })}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={sending || secondsLeft > 0}
          isLoading={sending}
          onClick={() => void resend()}
        >
          {secondsLeft > 0 ? t("settings.account.verifyWait", { seconds: secondsLeft }) : t("settings.account.verifyResend")}
        </Button>
      </div>
      {sent && !error && <FormAlert variant="success">{t("settings.account.verifySent")}</FormAlert>}
      {error && <FormAlert variant="danger">{errorMessage(error)}</FormAlert>}
    </div>
  );
}

/** Đổi tên hiển thị; các trường hồ sơ còn lại giữ nguyên khi lưu (UC-TK-10, BR-TK-19). */
function DisplayNameForm() {
  const { t } = useTranslation("auth");
  const formId = useId();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const schema = useMemo(() => buildDisplayNameSchema(), []);
  const [formError, setFormError] = useState<ApiError | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DisplayNameFormData>({
    resolver: yupResolver(schema),
    defaultValues: { displayName: user?.displayName ?? "" },
    mode: "onTouched",
  });

  if (!user) return null;

  const onSubmit = async (data: DisplayNameFormData) => {
    setFormError(null);
    const trimmed = data.displayName.trim();
    try {
      const response = await userApi.saveLearningProfile(profilePayload(user, { displayName: trimmed }));
      const updated = response.data.data;
      setUser(updated);
      reset({ displayName: updated.displayName ?? trimmed });
      toast(t("settings.account.nameSaved"), { icon: "circle-check" });
    } catch (err: unknown) {
      // Giữ nguyên những gì đã nhập để thử lại (AC-TK-51).
      const error = toApiError(err);
      const applied =
        error.code === "VALIDATION_FAILED"
          ? applyFieldErrors<DisplayNameFormData>(error, setError, { displayName: "displayName" })
          : 0;
      if (applied === 0) setFormError(error);
    }
  };

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
          <Icon name="user" className="text-lg" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-text sm:text-lg">{t("settings.account.nameTitle")}</h3>
          <p className="mt-0.5 text-[13px] leading-relaxed text-text-muted">{t("settings.account.nameHint")}</p>
        </div>
      </div>

      {formError && <FormAlert variant="danger">{errorMessage(formError)}</FormAlert>}

      <TextField
        id={`${formId}-displayName`}
        label={t("learningProfile.displayName")}
        icon="user"
        autoComplete="name"
        requiredMark
        error={errors.displayName?.message}
        hint={t("learningProfile.displayNameHint")}
        {...register("displayName")}
      />

      <div className="flex justify-end border-t border-border/70 pt-4">
        <Button type="submit" variant="primary" disabled={isSubmitting || !isDirty} isLoading={isSubmitting}>
          {isSubmitting ? t("learningProfile.saving") : t("settings.learning.submit")}
        </Button>
      </div>
    </form>
  );
}

/**
 * Tab Tài khoản trong Cài đặt (UC-TK-10, BR-TK-19): ảnh, tên, email kèm trạng thái xác thực, gói hiện tại; sửa
 * được tên hiển thị và gửi lại thư xác thực. Chỉ hiển thị dữ liệu của chính người đang đăng nhập.
 */
export default function AccountSection() {
  const { t } = useTranslation("auth");
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === "student";
  const plan = useMyPlan(Boolean(isStudent));
  if (!user) return null;

  const name = user.displayName?.trim() || user.email;
  const pro = plan.data?.plan === "pro";

  return (
    <section className="flex w-full flex-col gap-6" id="v-account">
      <SettingsCard>
        <AvatarPicker name={name}>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h2 className="truncate font-display text-2xl font-bold text-text">{name}</h2>
            <p className="truncate text-sm text-text-muted">{user.email}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <Badge variant={user.emailVerified ? "success" : "warning"}>
                <Icon name={user.emailVerified ? "circle-check" : "circle-alert"} />
                {user.emailVerified ? t("profile.emailVerified") : t("profile.emailUnverified")}
              </Badge>
              {isStudent && plan.data && (
                <Link
                  to="?tab=plan"
                  title={t("profile.planManage")}
                  className={`inline-flex h-6 items-center gap-1 rounded-sm border px-2 text-xs font-semibold transition-colors hover:border-primary/60 ${
                    pro
                      ? "border-primary/40 bg-primary-soft text-primary-text"
                      : "border-border bg-bg-elevated text-text-muted hover:text-text"
                  }`}
                >
                  {pro && <Icon name="crown" className="size-3.5" />}
                  {pro ? t("profile.planPro") : t("profile.planFree")}
                  <Icon name="arrow-right" className="size-3" />
                </Link>
              )}
            </div>
          </div>
        </AvatarPicker>
      </SettingsCard>

      {!user.emailVerified && <VerifyEmailNotice email={user.email} />}

      <DisplayNameForm />
    </section>
  );
}
