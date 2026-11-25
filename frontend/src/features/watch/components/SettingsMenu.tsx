import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { CAPTION_SIZES, RATES, type WatchPrefs } from "../prefs";

export interface SettingsMenuProps {
  prefs: WatchPrefs;
  onChange: (prefs: WatchPrefs) => void;
}

function Toggle({ label, icon, checked, onChange }: Readonly<{
  label: string;
  icon: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}>) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5">
      <span className="flex items-center gap-2 text-[13px] font-medium text-text">
        <Icon name={icon} className="size-4 text-text-subtle" />
        {label}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-fn-watch ${
          checked ? "bg-fn-watch" : "bg-border-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left] duration-150 ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </label>
  );
}

function Segments<T extends string | number>({ label, options, value, format, onChange }: Readonly<{
  label: string;
  options: readonly T[];
  value: T;
  format: (option: T) => string;
  onChange: (value: T) => void;
}>) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-xs font-semibold text-text-muted">{label}</legend>
      <div className="flex gap-1 rounded-md bg-bg-elevated p-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            onClick={() => onChange(option)}
            className={`flex-1 cursor-pointer rounded-sm px-1.5 py-1 text-xs font-semibold tabular-nums transition-colors ${
              option === value ? "bg-fn-watch text-on-fn" : "text-text-muted hover:bg-surface-hover hover:text-text"
            }`}
          >
            {format(option)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Nút Cài đặt góc trên phải: tốc độ phát, phụ đề, bản dịch, phiên âm và cỡ chữ (BR-TC-15). */
export default function SettingsMenu({ prefs, onChange }: Readonly<SettingsMenuProps>) {
  const { t, i18n } = useTranslation("watch");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const formatRate = (rate: number) => `${rate.toLocaleString(i18n.language === "en" ? "en" : "vi")}×`;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t("settings.title")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="grid size-10 cursor-pointer place-items-center rounded-full bg-white/12 text-white backdrop-blur-md transition-colors hover:bg-white/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <Icon name="settings" className="size-5" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={t("settings.title")}
          className="absolute right-0 top-12 z-[60] flex w-72 flex-col gap-4 rounded-lg border border-border-strong bg-surface p-4 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.75)] animate-[menu-in_140ms_var(--ease-out)]"
        >
          <p className="text-sm font-bold text-text">{t("settings.title")}</p>
          <Segments
            label={t("settings.speed")}
            options={RATES}
            value={prefs.rate}
            format={formatRate}
            onChange={(rate) => onChange({ ...prefs, rate })}
          />
          <div className="flex flex-col border-y border-border py-1.5">
            <Toggle
              label={t("settings.captions")}
              icon="captions"
              checked={prefs.captions}
              onChange={(captions) => onChange({ ...prefs, captions })}
            />
            <Toggle
              label={t("settings.translation")}
              icon="languages"
              checked={prefs.translation}
              onChange={(translation) => onChange({ ...prefs, translation })}
            />
            <Toggle
              label={t("settings.ipa")}
              icon="audio-lines"
              checked={prefs.ipa}
              onChange={(ipa) => onChange({ ...prefs, ipa })}
            />
          </div>
          <Segments
            label={t("settings.size")}
            options={CAPTION_SIZES}
            value={prefs.size}
            format={(size) => t(`settings.sizes.${size}`)}
            onChange={(size) => onChange({ ...prefs, size })}
          />
        </div>
      )}
    </div>
  );
}
