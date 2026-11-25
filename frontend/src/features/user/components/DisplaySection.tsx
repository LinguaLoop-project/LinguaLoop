import { useState } from "react";
import { useTranslation } from "react-i18next";
import FormAlert from "@/components/common/FormAlert";
import SegmentedControl from "@/components/common/SegmentedControl";
import { errorMessage, toApiError, useAuthStore } from "@/features/auth";
import type { ApiError } from "@/features/auth";
import { setLanguage, type Language } from "@/i18n";
import { ACCENTS, LEARN_BACKGROUNDS, SENTENCE_SIZES, setAppearance, useAppearance, type Accent } from "@/hooks/useAppearance";
import { setTheme, useTheme, type Theme } from "@/hooks/useTheme";
import { userApi } from "../api";
import { profilePayload } from "../profilePayload";

/** Màu hiển thị trên ô chọn màu nhấn (cùng gam với biến `--primary` của từng màu). */
const ACCENT_SWATCH: Record<Accent, string> = { violet: "#8B5CF6", blue: "#3B82F6", pink: "#EC4899", green: "#10B981" };

const CARD = "flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]";

/**
 * Tab Giao diện & ngôn ngữ trong Cài đặt (UC-TK-10, BR-TK-21): chọn sáng/tối, màu nhấn, cỡ chữ câu luyện tập, nền trang học (lưu trên trình duyệt) và ngôn ngữ giao diện (đổi ngay, rồi lưu vào
 * hồ sơ để lần đăng nhập sau giữ nguyên). Không có nút Lưu vì mỗi lựa chọn có hiệu lực ngay.
 */
export default function DisplaySection() {
  const { t, i18n } = useTranslation("auth");
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const appearance = useAppearance();
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const language: Language = i18n.language === "en" ? "en" : "vi";

  const pickAppearance = (changes: Parameters<typeof setAppearance>[0]) => setStorageBlocked(!setAppearance(changes));

  const pickLanguage = async (next: Language) => {
    setSaved(false);
    setError(null);
    // Đổi giao diện ngay khi chọn, không chờ lưu.
    void setLanguage(next);
    if (!user) return;
    try {
      const response = await userApi.saveLearningProfile(profilePayload(user, { uiLanguage: next }));
      setUser(response.data.data);
      setSaved(true);
    } catch (err: unknown) {
      setError(toApiError(err));
    }
  };

  return (
    <section className={CARD} id="v-display">
      <div>
        <h3 className="text-lg font-bold leading-[1.4]">{t("settings.display.title")}</h3>
        <p className="mt-1 text-[13px] text-text-muted">{t("settings.display.hint")}</p>
      </div>

      {saved && <FormAlert variant="success">{t("settings.display.saved")}</FormAlert>}
      {error && <FormAlert variant="danger">{errorMessage(error)}</FormAlert>}
      {storageBlocked && <FormAlert variant="danger">{t("settings.practice.saveFailed")}</FormAlert>}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text">{t("settings.display.theme")}</span>
        <SegmentedControl
          options={[
            { value: "light", label: t("settings.display.themeLight") },
            { value: "dark", label: t("settings.display.themeDark") },
          ]}
          value={theme}
          ariaLabel={t("settings.display.theme")}
          onChange={(value) => setTheme(value as Theme)}
        />
        <p className="text-[13px] leading-normal text-text-subtle">{t("settings.display.themeHint")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text">{t("settings.display.accent")}</span>
        <div role="group" aria-label={t("settings.display.accent")} className="flex flex-wrap gap-2">
          {ACCENTS.map((accent) => {
            const on = appearance.accent === accent;
            return (
              <button
                key={accent}
                type="button"
                aria-pressed={on}
                onClick={() => pickAppearance({ accent })}
                className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors ${on ? "border-primary bg-primary-soft text-text" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}
              >
                <span aria-hidden="true" className="size-4 rounded-full" style={{ backgroundColor: ACCENT_SWATCH[accent] }} />
                {t(`settings.display.accents.${accent}`)}
              </button>
            );
          })}
        </div>
        <p className="text-[13px] leading-normal text-text-subtle">{t("settings.display.accentHint")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text">{t("settings.display.sentenceSize")}</span>
        <SegmentedControl
          options={SENTENCE_SIZES.map((size) => ({ value: size, label: t(`settings.display.sentenceSizes.${size}`) }))}
          value={appearance.sentenceSize}
          ariaLabel={t("settings.display.sentenceSize")}
          onChange={(value) => pickAppearance({ sentenceSize: value === "lg" ? "lg" : "md" })}
        />
        <p className="text-[13px] leading-normal text-text-subtle">{t("settings.display.sentenceSizeHint")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text">{t("settings.display.learnBackground")}</span>
        <SegmentedControl
          options={LEARN_BACKGROUNDS.map((bg) => ({ value: bg, label: t(`settings.display.learnBackgrounds.${bg}`) }))}
          value={appearance.learnBackground}
          ariaLabel={t("settings.display.learnBackground")}
          onChange={(value) => pickAppearance({ learnBackground: LEARN_BACKGROUNDS.find((bg) => bg === value) ?? "none" })}
        />
        <p className="text-[13px] leading-normal text-text-subtle">{t("settings.display.learnBackgroundHint")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text">{t("learningProfile.uiLanguage")}</span>
        <SegmentedControl
          options={[
            { value: "vi", label: "Tiếng Việt" },
            { value: "en", label: "English" },
          ]}
          value={language}
          ariaLabel={t("learningProfile.uiLanguage")}
          onChange={(value) => void pickLanguage(value as Language)}
        />
      </div>
    </section>
  );
}
