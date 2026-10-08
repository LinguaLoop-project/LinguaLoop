import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE, isLanguage, setLanguage, type Language } from "@/i18n";

export interface LanguageSwitcherProps {
  className?: string;
}

/** Nút đổi nhanh vi ⇄ en. Hiện mã ngôn ngữ đang dùng, bấm để chuyển sang ngôn ngữ còn lại. */
export default function LanguageSwitcher({ className = "ll-icon-btn" }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const current: Language = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE;
  const next: Language = current === "vi" ? "en" : "vi";
  const label = t("language.switchTo", { language: t(`language.names.${next}`) });

  return (
    <button
      type="button"
      onClick={() => void setLanguage(next)}
      className={className}
      aria-label={label}
      title={label}
    >
      <span className="text-xs font-bold tracking-wide" aria-hidden="true">
        {current.toUpperCase()}
      </span>
    </button>
  );
}
