import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import Icon from "@/components/common/Icon";
import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE, isLanguage, setLanguage, type Language } from "@/i18n";

export interface LanguageSwitcherProps {
  /** Chiều cao nút, mặc định `h-9` như Header trang chủ. */
  heightClass?: string;
  /** "chip": viên thuốc có icon quả địa cầu ở chân trang. "bare": không viền kèm tên đầy đủ. "compact": cờ + mã ngắn VI/EN cho TopBar. */
  variant?: "default" | "chip" | "bare" | "compact";
}

const LANGUAGES: Language[] = ["vi", "en"];

function Flag({ language }: { language: Language }) {
  return (
    <span className="inline-flex h-3 w-4 shrink-0 items-center justify-center overflow-hidden rounded-xs shadow-xs" aria-hidden="true">
      {/* Cờ là tài sản thương hiệu quốc gia, không thuộc token màu của giao diện. */}
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
export default function LanguageSwitcher({ heightClass = "h-9", variant = "default" }: LanguageSwitcherProps) {
  const chip = variant === "chip";
  const bare = variant === "bare";
  const compact = variant === "compact";
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
        className={`inline-flex cursor-pointer items-center justify-center whitespace-nowrap text-sm text-[var(--text)] transition-all ${
          chip
            ? "h-8 gap-2 rounded-full border border-border-strong bg-surface px-3 hover:border-primary hover:bg-primary-soft"
            : compact
              ? "h-8 gap-1.5 rounded-full px-2 text-xs font-semibold uppercase tracking-wide text-text-muted hover:bg-surface-hover hover:text-text"
              : bare
                ? "h-8 gap-2 rounded-full px-2.5 font-medium hover:bg-[var(--surface-hover)]"
                : `gap-2 rounded-lg border border-[var(--border)] px-3 font-medium hover:bg-[var(--surface-hover)] ${heightClass}`
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.label")}
        title={t(`language.names.${current}`)}
      >
        {chip ? <Icon name="globe" className="text-xl" /> : <Flag language={current} />}
        {compact ? (
          <span className="hidden sm:inline">{current.toUpperCase()}</span>
        ) : (
          <span className={chip ? "" : "hidden sm:inline"}>{t(`language.names.${current}`)}</span>
        )}
        {!chip && !compact && (
          <ChevronDown
            className={`h-3.5 w-3.5 text-[var(--text-subtle)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("language.label")}
          className={`absolute right-0 z-50 w-36 animate-[menu-in_150ms_var(--ease-out)] rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-1.5 shadow-xl ${chip ? "bottom-full mb-2" : "mt-2"}`}
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
