import { useId, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import SegmentedControl from "@/components/common/SegmentedControl";
import Switch from "@/components/common/Switch";
import { errorMessage, toApiError, useAuthStore } from "@/features/auth";
import type { ApiError } from "@/features/auth";
import { setLanguage, type Language } from "@/i18n";
import {
  ACCENTS,
  CORNER_STYLES,
  DEFAULT_APPEARANCE,
  LEARN_BACKGROUNDS,
  SENTENCE_SIZES,
  THEME_PRESETS,
  setAppearance,
  useAppearance,
  type Accent,
  type CornerStyle,
  type LearnBackground,
  type ThemePreset,
} from "@/hooks/useAppearance";
import { setTheme, useTheme, type Theme, type ThemeMode } from "@/hooks/useTheme";
import { toast } from "@/stores/toastStore";
import { userApi } from "../api";
import { profilePayload } from "../profilePayload";
import { SettingRow, SettingsCard } from "./SettingsCard";

/** Màu hiển thị trên ô chọn màu nhấn (cùng gam với biến `--primary` của từng bảng màu). */
const ACCENT_SWATCH: Record<Accent, string> = {
  violet: "#8B5CF6",
  blue: "#3B82F6",
  pink: "#EC4899",
  green: "#10B981",
  amber: "#F59E0B",
  slate: "#71717A",
};

/** Nền xem trước khớp với CSS `data-learn-bg` (đồng bộ màu nhấn đang chọn) trong `index.css`. */
function learnBgStyle(bg: LearnBackground, theme: Theme): CSSProperties {
  if (bg === "paper") {
    return { backgroundColor: theme === "light" ? "#F6F0E2" : "#19150F" };
  }
  if (bg === "gradient") {
    const primaryMix = theme === "light" ? "12%" : "20%";
    const accentMix = theme === "light" ? "12%" : "14%";
    return {
      background: `linear-gradient(160deg, color-mix(in srgb, var(--primary) ${primaryMix}, var(--bg-base)) 0%, var(--bg-base) 52%, color-mix(in srgb, var(--accent-2) ${accentMix}, var(--bg-base)) 100%)`,
    };
  }
  return { backgroundColor: "var(--bg-base)" };
}

/**
 * Tab Giao diện & ngôn ngữ trong Cài đặt (UC-TK-10, BR-TK-21):
 * - Card 1: Giao diện hiển thị (xem trước trực tiếp, preset 1 chạm, chế độ màu gồm Auto, bảng màu đồng bộ, kiểu bo góc,
 *   cỡ chữ câu luyện tập, nền trang học, giảm chuyển động — tất cả lưu trên trình duyệt).
 * - Card 2: Ngôn ngữ giao diện (đổi ngay, rồi lưu vào hồ sơ để lần đăng nhập sau giữ nguyên).
 */
export default function DisplaySection() {
  const { t, i18n } = useTranslation("auth");
  const baseId = useId();
  const { theme, mode } = useTheme();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const appearance = useAppearance();
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const language: Language = i18n.language === "en" ? "en" : "vi";
  const isDefaultAppearance =
    appearance.accent === DEFAULT_APPEARANCE.accent &&
    appearance.sentenceSize === DEFAULT_APPEARANCE.sentenceSize &&
    appearance.learnBackground === DEFAULT_APPEARANCE.learnBackground &&
    appearance.cornerStyle === DEFAULT_APPEARANCE.cornerStyle &&
    appearance.reduceMotion === DEFAULT_APPEARANCE.reduceMotion &&
    mode === "system";

  const pickAppearance = (changes: Parameters<typeof setAppearance>[0]) => setStorageBlocked(!setAppearance(changes));

  const applyPreset = (preset: ThemePreset) => {
    setTheme(preset.mode);
    const ok = setAppearance({
      accent: preset.accent,
      learnBackground: preset.learnBackground,
      cornerStyle: preset.cornerStyle,
    });
    setStorageBlocked(!ok);
    if (ok) {
      toast(t("settings.display.presetApplied", { name: t(`settings.display.presets.${preset.id}`) }), {
        icon: "sparkles",
      });
    }
  };

  const resetAppearance = () => {
    setTheme("system");
    const ok = setAppearance(DEFAULT_APPEARANCE);
    setStorageBlocked(!ok);
    if (ok) toast(t("settings.display.resetDone"), { icon: "rotate-ccw" });
  };

  const pickLanguage = async (next: Language) => {
    if (next === language) return;
    setError(null);
    // Đổi giao diện ngay khi chọn, không chờ lưu.
    void setLanguage(next);
    if (!user) return;
    try {
      const response = await userApi.saveLearningProfile(profilePayload(user, { uiLanguage: next }));
      setUser(response.data.data);
      toast(t("settings.display.saved"), { icon: "circle-check" });
    } catch (err: unknown) {
      setError(toApiError(err));
    }
  };

  const reduceMotionLabelId = `${baseId}-reduce-motion`;

  return (
    <div className="flex flex-col gap-6" id="v-display">
      {error && <FormAlert variant="danger">{errorMessage(error)}</FormAlert>}
      {storageBlocked && <FormAlert variant="danger">{t("settings.practice.saveFailed")}</FormAlert>}

      <SettingsCard
        title={t("settings.display.appearanceTitle")}
        description={t("settings.display.hint")}
        icon="palette"
        action={
          !isDefaultAppearance && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Icon name="rotate-ccw" />}
              onClick={resetAppearance}
            >
              {t("settings.resetDefault")}
            </Button>
          )
        }
      >
        {/* Khung xem trước trực tiếp: phản ánh ngay chế độ màu, bảng màu, kiểu bo góc, cỡ chữ và nền trang học */}
        <div
          aria-label={t("settings.display.previewLabel")}
          className="overflow-hidden rounded-md border border-border p-4 transition-colors duration-200 sm:p-5"
          style={learnBgStyle(appearance.learnBackground, theme)}
        >
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary-text">
              <Icon name="sparkles" className="text-sm" />
              {t("settings.display.previewLabel")}
            </span>
            <span className="rounded-full border border-border bg-surface/90 px-2 py-0.5 font-medium text-text-muted">
              {t(`settings.display.accents.${appearance.accent}`)} ·{" "}
              {t(`settings.display.learnBackgrounds.${appearance.learnBackground}`)} ·{" "}
              {t(`settings.display.sentenceSizes.${appearance.sentenceSize}`)}
            </span>
          </div>

          <div className="rounded-md border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary-text">
                <Icon name="headphones" className="text-xs" />
                {t("settings.practice.dictation.title")}
              </span>
              <span className="text-xs font-medium tabular-nums text-text-subtle">3 / 12</span>
            </div>
            <p
              className="mt-3 font-semibold leading-snug text-text transition-[font-size] duration-150"
              style={{ fontSize: appearance.sentenceSize === "lg" ? "22px" : "18px" }}
            >
              {t("settings.display.previewSentence")}
            </p>
            <p className="mt-1 text-[13px] text-text-muted">{t("settings.display.previewTranslation")}</p>
            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-border/70 pt-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                <div className="h-full w-1/3 rounded-full bg-primary transition-colors duration-200" />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--btn-primary)] px-3 py-1 text-xs font-semibold text-white transition-colors duration-200">
                <Icon name="play" className="text-xs" fill />
                {t("settings.display.previewAction")}
              </span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border/70">
          {/* Gói giao diện nhanh 1 chạm */}
          <SettingRow label={t("settings.display.presetsTitle")} hint={t("settings.display.presetsHint")} stacked>
            <div
              role="group"
              aria-label={t("settings.display.presetsTitle")}
              className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
            >
              {THEME_PRESETS.map((preset) => {
                const active =
                  mode === preset.mode &&
                  appearance.accent === preset.accent &&
                  appearance.learnBackground === preset.learnBackground &&
                  appearance.cornerStyle === preset.cornerStyle;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => applyPreset(preset)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-md border p-2.5 text-left transition-all duration-150 ${
                      active
                        ? "border-primary bg-primary-soft/60 shadow-[inset_0_0_0_1px_var(--primary)]"
                        : "border-border bg-bg-elevated hover:border-border-strong hover:bg-surface-hover"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border/80 p-1"
                      style={{ backgroundColor: preset.preview.bg }}
                    >
                      <span
                        className="flex size-full items-end justify-end rounded-[3px] p-0.5"
                        style={{ backgroundColor: preset.preview.surface }}
                      >
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: preset.preview.primary }}
                        />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-text">
                        {t(`settings.display.presets.${preset.id}`)}
                      </span>
                      <span className="block truncate text-[11px] text-text-subtle">
                        {t(
                          preset.mode === "light"
                            ? "settings.display.themeLight"
                            : preset.mode === "dark"
                              ? "settings.display.themeDark"
                              : "settings.display.themeSystem",
                        )}
                      </span>
                    </span>
                    {active && <Icon name="check" className="shrink-0 text-sm text-primary-text" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          </SettingRow>

          {/* Chế độ màu: Sáng / Tối / Theo thiết bị */}
          <SettingRow label={t("settings.display.theme")} hint={t("settings.display.themeHint")} stacked>
            <div role="group" aria-label={t("settings.display.theme")} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(["light", "dark", "system"] as const).map((option: ThemeMode) => {
                const active = mode === option;
                const icon = option === "light" ? "sun" : option === "dark" ? "moon" : "monitor";
                const labelKey =
                  option === "light"
                    ? "settings.display.themeLight"
                    : option === "dark"
                      ? "settings.display.themeDark"
                      : "settings.display.themeSystem";

                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTheme(option)}
                    className={`group flex cursor-pointer flex-col gap-2.5 rounded-md border p-3 text-left transition-all duration-150 ${
                      active
                        ? "border-primary bg-primary-soft/60 shadow-[inset_0_0_0_1px_var(--primary)]"
                        : "border-border bg-bg-elevated hover:border-border-strong hover:bg-surface-hover"
                    }`}
                  >
                    {option === "system" ? (
                      <div
                        aria-hidden="true"
                        className="grid h-12 grid-cols-2 overflow-hidden rounded-sm border border-border-strong"
                      >
                        <div className="flex flex-col justify-between bg-[#F8FAFC] p-1.5">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: ACCENT_SWATCH[appearance.accent] }}
                          />
                          <div className="h-2.5 w-full rounded-[3px] bg-white shadow-2xs" />
                        </div>
                        <div className="flex flex-col justify-between bg-[#0B1120] p-1.5">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: ACCENT_SWATCH[appearance.accent] }}
                          />
                          <div className="h-2.5 w-full rounded-[3px] bg-[#17233D]" />
                        </div>
                      </div>
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-12 flex-col justify-between rounded-sm border p-2"
                        style={{
                          backgroundColor: option === "light" ? "#F8FAFC" : "#0B1120",
                          borderColor: option === "light" ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.14)",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: ACCENT_SWATCH[appearance.accent] }}
                          />
                          <span
                            className="h-1.5 w-10 rounded-full"
                            style={{ backgroundColor: option === "light" ? "#0F172A" : "#F8FAFC", opacity: 0.7 }}
                          />
                        </div>
                        <div
                          className="h-3 w-full rounded-[4px]"
                          style={{ backgroundColor: option === "light" ? "#FFFFFF" : "#182235" }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-text">
                        <Icon name={icon} className={active ? "text-primary-text" : "text-text-muted"} />
                        {t(labelKey)}
                      </span>
                      {active && (
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-white">
                          <Icon name="check" className="text-xs" strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </SettingRow>

          {/* Bảng màu đồng bộ (6 tông: Tím, Xanh dương, Hồng, Xanh lá, Cam ấm, Trung tính) */}
          <SettingRow label={t("settings.display.accent")} hint={t("settings.display.accentHint")} stacked>
            <div role="group" aria-label={t("settings.display.accent")} className="flex flex-wrap gap-2.5">
              {ACCENTS.map((accent) => {
                const on = appearance.accent === accent;
                return (
                  <button
                    key={accent}
                    type="button"
                    aria-pressed={on}
                    onClick={() => pickAppearance({ accent })}
                    className={`inline-flex min-h-10 cursor-pointer items-center gap-2.5 rounded-full border px-3.5 text-sm font-medium transition-all duration-150 ${
                      on
                        ? "border-primary bg-primary-soft font-semibold text-text shadow-[inset_0_0_0_1px_var(--primary)]"
                        : "border-border bg-bg-elevated text-text-muted hover:border-border-strong hover:bg-surface-hover hover:text-text"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-5 place-items-center rounded-full text-white shadow-xs"
                      style={{ backgroundColor: ACCENT_SWATCH[accent] }}
                    >
                      {on && <Icon name="check" className="text-xs" strokeWidth={3} />}
                    </span>
                    {t(`settings.display.accents.${accent}`)}
                  </button>
                );
              })}
            </div>
          </SettingRow>

          {/* Kiểu bo góc */}
          <SettingRow label={t("settings.display.cornerStyle")} hint={t("settings.display.cornerStyleHint")}>
            <SegmentedControl
              options={CORNER_STYLES.map((style) => ({
                value: style,
                label: t(`settings.display.cornerStyles.${style}`),
              }))}
              value={appearance.cornerStyle}
              ariaLabel={t("settings.display.cornerStyle")}
              onChange={(value) =>
                pickAppearance({ cornerStyle: CORNER_STYLES.find((s) => s === value) ?? ("rounded" as CornerStyle) })
              }
            />
          </SettingRow>

          {/* Cỡ chữ câu luyện tập */}
          <SettingRow label={t("settings.display.sentenceSize")} hint={t("settings.display.sentenceSizeHint")}>
            <SegmentedControl
              options={SENTENCE_SIZES.map((size) => ({
                value: size,
                label: t(`settings.display.sentenceSizes.${size}`),
              }))}
              value={appearance.sentenceSize}
              ariaLabel={t("settings.display.sentenceSize")}
              onChange={(value) => pickAppearance({ sentenceSize: value === "lg" ? "lg" : "md" })}
            />
          </SettingRow>

          {/* Nền trang học dạng 3 ô xem trước */}
          <SettingRow label={t("settings.display.learnBackground")} hint={t("settings.display.learnBackgroundHint")} stacked>
            <div
              role="group"
              aria-label={t("settings.display.learnBackground")}
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {LEARN_BACKGROUNDS.map((bg) => {
                const active = appearance.learnBackground === bg;
                return (
                  <button
                    key={bg}
                    type="button"
                    aria-pressed={active}
                    onClick={() => pickAppearance({ learnBackground: bg })}
                    className={`flex cursor-pointer flex-col gap-2 rounded-md border p-2.5 text-left transition-all duration-150 ${
                      active
                        ? "border-primary bg-primary-soft/60 shadow-[inset_0_0_0_1px_var(--primary)]"
                        : "border-border bg-bg-elevated hover:border-border-strong hover:bg-surface-hover"
                    }`}
                  >
                    <div
                      aria-hidden="true"
                      className="flex h-12 items-center justify-center rounded-sm border border-border/80 p-2"
                      style={learnBgStyle(bg, theme)}
                    >
                      <div className="h-6 w-3/4 rounded-[4px] border border-border bg-surface shadow-xs" />
                    </div>
                    <div className="flex items-center justify-between gap-2 px-0.5">
                      <span className="truncate text-sm font-medium text-text">
                        {t(`settings.display.learnBackgrounds.${bg}`)}
                      </span>
                      {active && (
                        <span className="grid size-4.5 shrink-0 place-items-center rounded-full bg-primary text-white">
                          <Icon name="check" className="text-[11px]" strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </SettingRow>

          {/* Giảm chuyển động */}
          <SettingRow
            label={t("settings.display.reduceMotion")}
            hint={t("settings.display.reduceMotionHint")}
            labelId={reduceMotionLabelId}
          >
            <Switch
              checked={appearance.reduceMotion}
              ariaLabel={t("settings.display.reduceMotion")}
              ariaLabelledBy={reduceMotionLabelId}
              onChange={(next) => pickAppearance({ reduceMotion: next })}
            />
          </SettingRow>
        </div>
      </SettingsCard>

      <SettingsCard
        title={t("settings.display.languageTitle")}
        description={t("settings.display.languageHint")}
        icon="languages"
      >
        <SettingRow label={t("learningProfile.uiLanguage")}>
          <SegmentedControl
            options={[
              { value: "vi", label: "Tiếng Việt" },
              { value: "en", label: "English" },
            ]}
            value={language}
            ariaLabel={t("learningProfile.uiLanguage")}
            onChange={(value) => void pickLanguage(value as Language)}
          />
        </SettingRow>
      </SettingsCard>
    </div>
  );
}
