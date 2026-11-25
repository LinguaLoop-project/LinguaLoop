import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PhonemeCell, PhonemeLevel } from "../types";
import { phonemeTone, splitPhonemes } from "../utils";

const LEVELS: PhonemeLevel[] = ["bad", "attention", "good", "insufficient"];
const DOT: Record<PhonemeLevel, string> = {
  good: "bg-success",
  attention: "bg-warning",
  bad: "bg-danger",
  insufficient: "bg-border-strong",
};

function Grid({
  cells,
  selected,
  activeLevel,
  onSelect,
}: {
  cells: PhonemeCell[];
  selected: string | null;
  activeLevel: PhonemeLevel | null;
  onSelect: (symbol: string) => void;
}) {
  const { t } = useTranslation("stats");
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2">
      {cells.map((cell) => {
        const status =
          cell.errorPercent === null ? t("weakness.map.cellNone") : t("weakness.map.cellPercent", { percent: cell.errorPercent });
        const on = cell.symbol === selected;
        const dimmed = activeLevel !== null && cell.level !== activeLevel;
        return (
          <button
            key={cell.symbol}
            type="button"
            aria-pressed={on}
            aria-label={t("weakness.map.cellAria", { symbol: cell.symbol, example: cell.exampleWord ?? "", status })}
            onClick={() => onSelect(cell.symbol)}
            className={`relative flex h-[68px] cursor-pointer flex-col items-center justify-center rounded-md border px-1 transition duration-150 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${phonemeTone(
              cell.level,
            )} ${on ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : ""} ${
              dimmed ? "scale-95 opacity-25" : "opacity-100"
            }`}
          >
            <span className="font-display text-lg font-bold leading-none">{cell.symbol}</span>
            <small className="mt-0.5 text-[11px] font-semibold leading-none opacity-90">
              {cell.errorPercent === null ? "—" : `${cell.errorPercent}%`}
            </small>
            {cell.exampleWord && (
              <span className="mt-0.5 max-w-full truncate text-[10px] leading-none opacity-65">{cell.exampleWord}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Bản đồ 44 âm vị chia hai nhóm, mỗi ô phân màu theo tỷ lệ lỗi và hỗ trợ lọc nhanh theo mức (BR-TH-09). */
export default function PhonemeMap({
  cells,
  selected,
  onSelect,
}: {
  cells: PhonemeCell[];
  selected: string | null;
  onSelect: (symbol: string) => void;
}) {
  const { t } = useTranslation("stats");
  const [activeLevel, setActiveLevel] = useState<PhonemeLevel | null>(null);
  const { vowels, consonants } = splitPhonemes(cells);

  const counts: Record<PhonemeLevel, number> = {
    bad: 0,
    attention: 0,
    good: 0,
    insufficient: 0,
  };
  for (const cell of cells) counts[cell.level] += 1;

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold">{t("weakness.map.title")}</h3>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("weakness.map.title")}>
          {activeLevel !== null && (
            <button
              type="button"
              onClick={() => setActiveLevel(null)}
              className="inline-flex cursor-pointer items-center rounded-full border border-border bg-bg-elevated px-2.5 py-1 text-xs font-semibold text-text-muted transition-colors hover:border-border-strong hover:text-text"
            >
              {t("weakness.map.filterAll", { count: cells.length })}
            </button>
          )}
          {LEVELS.map((level) => {
            const active = activeLevel === level;
            return (
              <button
                key={level}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveLevel((prev) => (prev === level ? null : level))}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary-soft text-text"
                    : "border-border bg-bg-elevated/70 text-text-muted hover:border-border-strong hover:text-text"
                }`}
              >
                <span className={`size-2 rounded-full ${DOT[level]}`} aria-hidden="true" />
                <span>{t(`weakness.map.legend.${level}`)}</span>
                <span className="tabular-nums opacity-75">({counts[level]})</span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="mb-4 mt-2 text-[13px] text-text-muted">{t("weakness.map.hint")}</p>

      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary-text">{t("weakness.map.vowels")}</h4>
      <Grid cells={vowels} selected={selected} activeLevel={activeLevel} onSelect={onSelect} />
      <h4 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-primary-text">{t("weakness.map.consonants")}</h4>
      <Grid cells={consonants} selected={selected} activeLevel={activeLevel} onSelect={onSelect} />
    </section>
  );
}
