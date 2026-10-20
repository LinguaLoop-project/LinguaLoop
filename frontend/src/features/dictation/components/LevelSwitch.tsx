import { useTranslation } from "react-i18next";
import type { DictationLevel } from "../types";

const LEVELS: DictationLevel[] = ["easy", "normal", "hard"];
const SHORTCUT: Record<DictationLevel, string> = { easy: "Alt+1", normal: "Alt+2", hard: "Alt+3" };

export interface LevelSwitchProps {
  value: DictationLevel;
  onChange: (level: DictationLevel) => void;
}

/** Chọn mức Easy / Normal / Hard (`#dLevel`). */
export default function LevelSwitch({ value, onChange }: LevelSwitchProps) {
  const { t } = useTranslation("dictation");
  return (
    <div role="group" aria-label={t("level.label")} className="inline-flex gap-0.5 rounded-md border border-border bg-surface p-1">
      {LEVELS.map((level) => {
        const on = value === level;
        return (
          <button
            key={level}
            type="button"
            aria-pressed={on}
            title={`${t(`level.${level}Help`)} (${SHORTCUT[level]})`}
            onClick={() => onChange(level)}
            className={`inline-flex h-9 cursor-pointer items-center whitespace-nowrap rounded-sm px-3.5 transition-colors duration-150 ${
              on
                ? "bg-primary-soft font-semibold text-text shadow-[inset_0_0_0_1px_var(--border-strong)]"
                : "bg-transparent font-medium text-text-muted hover:text-text"
            }`}
          >
            {t(`level.${level}`)}
          </button>
        );
      })}
    </div>
  );
}
