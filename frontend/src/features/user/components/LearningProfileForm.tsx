import { useId, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { yupResolver } from "@hookform/resolvers/yup";
import { applyFieldErrors, errorMessage, toApiError, useAuthStore, DAILY_MINUTES } from "@/features/auth";
import type { ApiError, DailyMinutes } from "@/features/auth";
import { isLanguage, setLanguage, type Language } from "@/i18n";
import { userApi } from "../api";
import { quotaFor } from "../dailyQuota";
import { detectTimezone, timezoneOptions } from "../timezones";
import { buildLearningProfileSchema, type LearningProfileFormData } from "../validations";
import Button from "@/components/common/Button";
import Checkbox from "@/components/common/Checkbox";
import FormAlert from "@/components/common/FormAlert";
import SegmentedControl from "@/components/common/SegmentedControl";
import { TextField } from "@/components/common/TextField";

export type LearningProfileFormProps = {
  /** `onboarding`: đủ 5 trường, lưu xong chuyển về trang Hôm nay. `settings`: chỉ thời lượng, ngôn ngữ, múi giờ. */
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
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
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
  const zones = useMemo(() => timezoneOptions(timezone), [timezone]);
  const quota = quotaFor(dailyMinutes);

  const onSubmit = async (data: LearningProfileFormData) => {
    setFormError(null);
    setSaved(false);
    try {
      const response = await userApi.saveLearningProfile({
        displayName: data.displayName.trim(),
        dailyMinutes: data.dailyMinutes,
        uiLanguage: data.uiLanguage as Language,
        timezone: data.timezone,
        acceptTerms: Boolean(data.acceptTerms),
      });
      setUser(response.data.data);
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
      return;
    }
    if (onboarding) {
      navigate("/student", { replace: true });
    } else {
      setSaved(true);
    }
  };

  const minutesOptions = DAILY_MINUTES.map((minutes) => ({
    value: String(minutes),
    label: t("learningProfile.minutes", { count: minutes }),
  }));

  return (
    <form
      className={onboarding ? "flex flex-col gap-5" : "flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]"}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {!onboarding && (
        <div>
          <h3 className="text-lg font-bold leading-[1.4]">{t("settings.learning.title")}</h3>
          <p className="mt-1 text-[13px] text-text-muted">{t("settings.learning.hint")}</p>
        </div>
      )}

      {saved && <FormAlert variant="success">{t("settings.learning.success")}</FormAlert>}
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

      <div className="flex flex-col gap-1.5">
        <span id={`${formId}-minutes`} className="text-sm font-semibold text-text">
          {t("learningProfile.dailyMinutes")}
        </span>
        <SegmentedControl
          options={minutesOptions}
          value={String(dailyMinutes)}
          ariaLabel={t("learningProfile.dailyMinutes")}
          onChange={(value) => setValue("dailyMinutes", Number(value) as DailyMinutes, { shouldValidate: true })}
        />
        <p className="text-[13px] leading-normal text-text-subtle">
          {errors.dailyMinutes?.message ??
            t("learningProfile.dailyMinutesHint", { cards: quota.cards, sentences: quota.sentences })}
        </p>
      </div>

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
            setValue("uiLanguage", value as Language, { shouldValidate: true });
            // Đổi giao diện ngay khi chọn, không chờ lưu.
            void setLanguage(value as Language);
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-timezone`} className="text-sm font-semibold text-text">
          {t("learningProfile.timezone")}
        </label>
        <select
          id={`${formId}-timezone`}
          aria-invalid={errors.timezone ? true : undefined}
          className={`h-12 w-full rounded-md border bg-surface px-3.5 text-[15px] text-text outline-none transition-[border-color,box-shadow] duration-150 focus:shadow-[0_0_0_3px_var(--primary-soft)] ${
            errors.timezone ? "border-danger" : "border-border-strong focus:border-primary"
          }`}
          {...register("timezone")}
        >
          {zones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        <p className={`text-[13px] leading-normal ${errors.timezone ? "text-danger" : "text-text-subtle"}`}>
          {errors.timezone?.message ?? t("learningProfile.timezoneHint")}
        </p>
      </div>

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

      <div className={onboarding ? "" : "flex justify-end pt-1"}>
        <Button type="submit" variant="primary" size={onboarding ? "lg" : undefined} fullWidth={onboarding} disabled={isSubmitting} isLoading={isSubmitting}>
          {isSubmitting ? t("learningProfile.saving") : t(onboarding ? "onboarding.submit" : "settings.learning.submit")}
        </Button>
      </div>
    </form>
  );
}
