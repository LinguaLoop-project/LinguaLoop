import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE, isLanguage, setLanguage, type Language } from "@/i18n";

export interface LanguageSwitcherProps {
  /** Chiều cao nút, mặc định `h-9` như Header trang chủ. */
  heightClass?: string;
}

const LANGUAGES: Language[] = ["vi", "en"];

function Flag({ language }: { language: Language }) {
  return (
    <span className="inline-flex h-3 w-4 shrink-0 items-center justify-center overflow-hidden rounded-xs shadow-xs" aria-hidden="true">
      {language === "vi" ? (
        <svg viewBox="0 0 30 20" className="h-full w-full">
          <rect width="30" height="20" fill="#DA251D" />
          <polygon points="15,4 17.5,11.5 10.5,6.5 19.5,6.5 12.5,11.5" fill="#FFFF00" />
        </svg>
      ) : (
        <svg viewBox="0 0 30 20" className="h-full w-full">
          <rect width="30" height="20" fill="#012169" />
          <path d="M0,0 L30,20 M30,0 L0,20" stroke="#FFF" strokeWidth="4" />
          <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="2" />
          <path d="M15,0 V20 M0,10 H30" stroke="#FFF" strokeWidth="6" />
          <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3.5" />
        </svg>
      )}
    </span>
  );
}

/** Menu chọn ngôn ngữ (cờ + tên) dùng chung cho Header trang chủ, các topbar và trang đăng nhập. */
export default function LanguageSwitcher({ heightClass = "h-9" }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current: Language = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE;

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[var(--border)] px-3 text-sm font-medium text-[var(--text)] transition-all hover:bg-[var(--surface-hover)] cursor-pointer ${heightClass}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.label")}
      >
        <Flag language={current} />
        {/* Màn hình hẹp chỉ hiện cờ để thanh trên không bị tràn */}
        <span className="hidden sm:inline">{t(`language.names.${current}`)}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--text-subtle)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("language.label")}
          className="absolute right-0 z-50 mt-2 w-36 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-1.5 shadow-xl"
        >
          {LANGUAGES.map((language) => (
            <button
              key={language}
              type="button"
              role="option"
              aria-selected={language === current}
              onClick={() => {
                void setLanguage(language);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                language === current
                  ? "bg-[var(--surface-hover)] font-semibold text-[var(--primary-hover)]"
                  : "text-[var(--text)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <Flag language={language} />
              <span>{t(`language.names.${language}`)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
