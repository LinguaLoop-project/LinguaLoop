import { useId, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { yupResolver } from "@hookform/resolvers/yup";
import { applyFieldErrors, errorMessage, toApiError, useAuthStore, DAILY_MINUTES } from "@/features/auth";
import type { ApiError, DailyMinutes } from "@/features/auth";
import { isLanguage, setLanguage, type Language } from "@/i18n";
import { toast } from "@/stores/toastStore";
import { userApi } from "../api";
import { quotaFor } from "../dailyQuota";
import { detectTimezone } from "../timezones";
import { buildLearningProfileSchema, type LearningProfileFormData } from "../validations";
import Button from "@/components/common/Button";
import Checkbox from "@/components/common/Checkbox";
import FormAlert from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import SegmentedControl from "@/components/common/SegmentedControl";
import { TextField } from "@/components/common/TextField";
import TimezonePicker from "./TimezonePicker";

export type LearningProfileFormProps = {
  /** `onboarding`: đủ 5 trường, lưu xong chuyển về trang Hôm nay. `settings`: chỉ thời lượng và múi giờ (tên ở tab Tài khoản, ngôn ngữ ở tab Giao diện). */
  mode: "onboarding" | "settings";
};

/** Hồ sơ học tập (UC-TK-08): dùng ở màn thiết lập lần đầu và ở tab Học tập trong Cài đặt. */
export default function LearningProfileForm({ mode }: LearningProfileFormProps) {
  const { t, i18n } = useTranslation("auth");
  const formId = useId();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const onboarding = mode === "onboarding";

  // Chưa từng đồng ý điều khoản thì phải đồng ý ở đây (BR-TK-14). Chốt một lần lúc mở form.
  const requireTerms = useMemo(() => !user?.termsAccepted, [user?.termsAccepted]);
  const schema = useMemo(() => buildLearningProfileSchema(requireTerms), [requireTerms]);

  const [formError, setFormError] = useState<ApiError | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<LearningProfileFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      dailyMinutes: user?.dailyMinutes ?? 15,
      // Ngôn ngữ đang hiển thị (người dùng có thể đã chọn ở trang đăng nhập) được ưu tiên hơn giá trị mặc định đã lưu.
      uiLanguage: isLanguage(i18n.language) ? i18n.language : (user?.uiLanguage ?? "vi"),
      // Lần đầu: gợi ý múi giờ theo thiết bị. Từ lần sau: giữ múi giờ đã lưu.
      timezone: (onboarding ? detectTimezone() : null) ?? user?.timezone ?? "Asia/Ho_Chi_Minh",
      acceptTerms: false,
    },
    mode: "onTouched",
  });

  const dailyMinutes = useWatch({ control, name: "dailyMinutes" });
  const uiLanguage = useWatch({ control, name: "uiLanguage" });
  const timezone = useWatch({ control, name: "timezone" });
  const quota = quotaFor(dailyMinutes);

  const onSubmit = async (data: LearningProfileFormData) => {
    setFormError(null);
    try {
      const response = await userApi.saveLearningProfile({
        displayName: data.displayName.trim(),
        dailyMinutes: data.dailyMinutes,
        uiLanguage: data.uiLanguage as Language,
        timezone: data.timezone,
        acceptTerms: Boolean(data.acceptTerms),
      });
      const updated = response.data.data;
      setUser(updated);
      if (onboarding) {
        navigate("/student", { replace: true });
      } else {
        reset({
          ...data,
          displayName: updated.displayName ?? data.displayName.trim(),
          dailyMinutes: updated.dailyMinutes,
          timezone: updated.timezone,
        });
        toast(t("settings.learning.success"), { icon: "circle-check" });
      }
    } catch (err: unknown) {
      // Giữ nguyên những gì đã nhập để thử lại (AC-TK-51).
      const error = toApiError(err);
      const applied =
        error.code === "VALIDATION_FAILED"
          ? applyFieldErrors<LearningProfileFormData>(error, setError, {
              displayName: "displayName",
              dailyMinutes: "dailyMinutes",
              uiLanguage: "uiLanguage",
              timezone: "timezone",
              acceptTerms: "acceptTerms",
            })
          : 0;
      if (applied === 0) setFormError(error);
    }
  };

  return (
    <form
      className={
        onboarding
          ? "flex flex-col gap-5"
          : "flex flex-col gap-6 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
      }
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {!onboarding && (
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text"
          >
            <Icon name="target" className="text-lg" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold leading-snug text-text sm:text-lg">{t("settings.learning.title")}</h3>
            <p className="mt-0.5 text-[13px] leading-relaxed text-text-muted">{t("settings.learning.hint")}</p>
          </div>
        </div>
      )}

      {formError && <FormAlert variant="danger">{errorMessage(formError)}</FormAlert>}

      {onboarding && (
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
      )}

      {/* Chọn mục tiêu học mỗi ngày dạng thẻ trực quan kèm định mức thẻ/câu */}
      <div className="flex flex-col gap-2">
        <span id={`${formId}-minutes`} className="text-sm font-semibold text-text">
          {t("learningProfile.dailyMinutes")}
        </span>
        <div
          role="group"
          aria-labelledby={`${formId}-minutes`}
          className={`grid gap-2.5 ${onboarding ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}
        >
          {DAILY_MINUTES.map((minutes) => {
            const active = dailyMinutes === minutes;
            const itemQuota = quotaFor(minutes);
            return (
              <button
                key={minutes}
                type="button"
                aria-pressed={active}
                onClick={() => setValue("dailyMinutes", minutes as DailyMinutes, { shouldValidate: true, shouldDirty: true })}
                className={`relative flex cursor-pointer flex-col gap-1.5 rounded-md border p-3.5 text-left transition-all duration-150 ${
                  active
                    ? "border-primary bg-primary-soft/65 shadow-[inset_0_0_0_1px_var(--primary)]"
                    : "border-border bg-bg-elevated hover:border-border-strong hover:bg-surface-hover"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-xl font-bold leading-none text-text">
                    {t("learningProfile.minutes", { count: minutes })}
                  </span>
                  {active ? (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Icon name="check" className="text-xs" strokeWidth={2.5} />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="size-4 shrink-0 rounded-full border border-border-strong"
                    />
                  )}
                </div>
                <span className={`text-xs font-semibold ${active ? "text-primary-text" : "text-text-muted"}`}>
                  {t(`learningProfile.goalTiers.${minutes}`)}
                </span>
                <span className="mt-0.5 text-xs text-text-subtle">
                  {t("learningProfile.goalQuota", { cards: itemQuota.cards, sentences: itemQuota.sentences })}
                </span>
              </button>
            );
          })}
        </div>
        <p className={`text-[13px] leading-normal ${errors.dailyMinutes ? "text-danger" : "text-text-subtle"}`}>
          {errors.dailyMinutes?.message ??
            t("learningProfile.dailyMinutesHint", { cards: quota.cards, sentences: quota.sentences })}
        </p>
      </div>

      {onboarding && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text">{t("learningProfile.uiLanguage")}</span>
          <SegmentedControl
            options={[
              { value: "vi", label: "Tiếng Việt" },
              { value: "en", label: "English" },
            ]}
            value={uiLanguage}
            ariaLabel={t("learningProfile.uiLanguage")}
            onChange={(value) => {
              setValue("uiLanguage", value as Language, { shouldValidate: true, shouldDirty: true });
              // Đổi giao diện ngay khi chọn, không chờ lưu.
              void setLanguage(value as Language);
            }}
          />
        </div>
      )}

      <TimezonePicker
        id={`${formId}-timezone`}
        value={timezone}
        onChange={(zone) => setValue("timezone", zone, { shouldValidate: true, shouldDirty: true })}
        error={errors.timezone?.message}
        hint={t("learningProfile.timezoneHint")}
      />

      {onboarding && requireTerms && (
        <div className="flex flex-col gap-1">
          <Checkbox
            id={`${formId}-terms`}
            label={t("learningProfile.acceptTerms")}
            error={errors.acceptTerms?.message}
            {...register("acceptTerms")}
          />
          <p className="pl-7 text-[13px] text-text-muted">
            <button type="button" className="cursor-pointer border-0 bg-transparent font-semibold text-primary-text hover:underline">
              {t("learningProfile.readTerms")}
            </button>
            {" · "}
            <button type="button" className="cursor-pointer border-0 bg-transparent font-semibold text-primary-text hover:underline">
              {t("learningProfile.readPolicy")}
            </button>
          </p>
        </div>
      )}

      <div className={onboarding ? "" : "flex items-center justify-end gap-3 border-t border-border/70 pt-4"}>
        <Button
          type="submit"
          variant="primary"
          size={onboarding ? "lg" : undefined}
          fullWidth={onboarding}
          disabled={isSubmitting || (!onboarding && !isDirty)}
          isLoading={isSubmitting}
        >
          {isSubmitting ? t("learningProfile.saving") : t(onboarding ? "onboarding.submit" : "settings.learning.submit")}
        </Button>
      </div>
    </form>
  );
}
