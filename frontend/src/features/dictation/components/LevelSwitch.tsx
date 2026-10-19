import { useTranslation } from "react-i18next";
import type { DictationLevel, PlayableLevel } from "../types";

const LEVELS: DictationLevel[] = ["easy", "normal", "hard"];
const SHORTCUT: Record<DictationLevel, string> = { easy: "Alt+1", normal: "Alt+2", hard: "Alt+3" };

export interface LevelSwitchProps {
  value: PlayableLevel;
  onChange: (level: PlayableLevel) => void;
}

/** Chọn mức Easy / Normal / Hard (`#dLevel`). Easy chưa làm bài được nên bị tắt kèm chú thích. */
export default function LevelSwitch({ value, onChange }: LevelSwitchProps) {
  const { t } = useTranslation("dictation");
  return (
    <div role="group" aria-label={t("level.label")} className="inline-flex gap-0.5 rounded-md border border-border bg-surface p-1">
      {LEVELS.map((level) => {
        const playable = level !== "easy";
        const on = playable && value === level;
        return (
          <button
            key={level}
            type="button"
            disabled={!playable}
            aria-pressed={on}
            title={playable ? `${t(`level.${level}Help`)} (${SHORTCUT[level]})` : t("level.easySoon")}
            onClick={() => playable && onChange(level as PlayableLevel)}
            className={`inline-flex h-9 cursor-pointer items-center whitespace-nowrap rounded-sm px-3.5 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${
              on
                ? "bg-primary-soft font-semibold text-text shadow-[inset_0_0_0_1px_var(--border-strong)]"
                : "bg-transparent font-medium text-text-muted enabled:hover:text-text"
            }`}
          >
            {t(`level.${level}`)}
          </button>
        );
      })}
    </div>
  );
}
