import { useState } from "react";
import { useTranslation } from "react-i18next";
import FormAlert from "@/components/common/FormAlert";
import SegmentedControl from "@/components/common/SegmentedControl";
import { errorMessage, toApiError, useAuthStore } from "@/features/auth";
import type { ApiError } from "@/features/auth";
import { setLanguage, type Language } from "@/i18n";
import { setTheme, useTheme, type Theme } from "@/hooks/useTheme";
import { userApi } from "../api";
import { profilePayload } from "../profilePayload";

const CARD = "flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]";

/**
 * Tab Giao diện & ngôn ngữ trong Cài đặt: chọn sáng/tối (lưu trên trình duyệt) và ngôn ngữ giao diện (đổi ngay, rồi lưu vào
 * hồ sơ để lần đăng nhập sau giữ nguyên). Không có nút Lưu vì mỗi lựa chọn có hiệu lực ngay.
 */
export default function DisplaySection() {
  const { t, i18n } = useTranslation("auth");
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const language: Language = i18n.language === "en" ? "en" : "vi";

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
