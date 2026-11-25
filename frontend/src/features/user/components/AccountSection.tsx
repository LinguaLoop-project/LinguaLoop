import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { yupResolver } from "@hookform/resolvers/yup";
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { TextField } from "@/components/common/TextField";
import { applyFieldErrors, authService, errorMessage, toApiError, useAuthStore } from "@/features/auth";
import type { ApiError } from "@/features/auth";
import { useMyPlan } from "@/features/subscription/hooks/useMyPlan";
import { userApi } from "../api";
import { profilePayload } from "../profilePayload";
import { buildDisplayNameSchema, type DisplayNameFormData } from "../validations";

const CARD = "rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]";
/** Sau mỗi lần gửi lại email xác thực phải chờ 60 giây mới gửi tiếp (AC-AUTH-31). */
const RESEND_COOLDOWN_MS = 60_000;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0]?.[0] ?? "?"];
  return letters.join("").toUpperCase();
}

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
    <div className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Icon name="mail" className="mt-0.5 size-5 shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <b className="block text-sm">{t("settings.account.verifyTitle")}</b>
          <p className="mt-0.5 text-[13px] text-text-muted">{t("settings.account.verifyHint", { email })}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" disabled={sending || secondsLeft > 0} isLoading={sending} onClick={() => void resend()}>
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
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DisplayNameFormData>({
    resolver: yupResolver(schema),
    defaultValues: { displayName: user?.displayName ?? "" },
    mode: "onTouched",
  });

  if (!user) return null;

  const onSubmit = async (data: DisplayNameFormData) => {
    setFormError(null);
    setSaved(false);
    try {
      const response = await userApi.saveLearningProfile(profilePayload(user, { displayName: data.displayName.trim() }));
      setUser(response.data.data);
      setSaved(true);
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
    <form className={`${CARD} flex flex-col gap-4`} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <h3 className="text-lg font-bold leading-[1.4]">{t("settings.account.nameTitle")}</h3>
        <p className="mt-1 text-[13px] text-text-muted">{t("settings.account.nameHint")}</p>
      </div>
      {saved && <FormAlert variant="success">{t("settings.account.nameSaved")}</FormAlert>}
      {formError && <FormAlert variant="danger">{errorMessage(formError)}</FormAlert>}
      <TextField
        id={`${formId}-displayName`}
        label={t("learningProfile.displayName")}
        icon="user"
        autoComplete="name"
        requiredMark
        error={errors.displayName?.message}
        hint={t("learningProfile.displayNameHint")}
        {...register("displayName", { onChange: () => setSaved(false) })}
      />
      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={isSubmitting || !isDirty} isLoading={isSubmitting}>
          {isSubmitting ? t("learningProfile.saving") : t("settings.learning.submit")}
        </Button>
      </div>
    </form>
  );
}

/**
 * Tab Tài khoản trong Cài đặt của học viên (UC-TK-10, BR-TK-19): ảnh, tên, email kèm trạng thái xác thực, gói hiện tại; sửa
 * được tên hiển thị và gửi lại thư xác thực. Chỉ hiển thị dữ liệu của chính người đang đăng nhập.
 */
export default function AccountSection() {
  const { t } = useTranslation("auth");
  const user = useAuthStore((state) => state.user);
  const plan = useMyPlan();
  if (!user) return null;

  const name = user.displayName?.trim() || user.email;
  const pro = plan.data?.plan === "pro";

  return (
    <section className="flex w-full flex-col gap-6" id="v-account">
      <div className={`${CARD} flex flex-wrap items-center gap-5`}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="size-20 shrink-0 rounded-full border border-border object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span aria-hidden="true" className="grid size-20 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-2xl font-bold text-primary-text">
            {initialsOf(name)}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="truncate font-display text-2xl font-bold">{name}</h2>
          <p className="truncate text-sm text-text-muted">{user.email}</p>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className={`rounded-full border px-2.5 py-0.5 ${user.emailVerified ? "border-success/40 bg-success/10 text-success" : "border-warning/40 bg-warning/10 text-warning"}`}>
              {user.emailVerified ? t("profile.emailVerified") : t("profile.emailUnverified")}
            </span>
            {plan.data && (
              <Link
                to="/student/subscription"
                title={t("profile.planManage")}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 transition-colors hover:border-primary/60 ${pro ? "border-primary/40 bg-primary-soft text-primary-text" : "border-border bg-bg-elevated text-text-muted"}`}
              >
                {pro && <Icon name="crown" className="size-3.5" />}
                {pro ? t("profile.planPro") : t("profile.planFree")}
                <Icon name="arrow-right" className="size-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {!user.emailVerified && <VerifyEmailNotice email={user.email} />}

      <DisplayNameForm />
    </section>
  );
}
