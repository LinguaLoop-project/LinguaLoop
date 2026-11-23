import { useTranslation } from "react-i18next";
import type { PhonemeCell, PhonemeLevel } from "../types";
import { phonemeTone, splitPhonemes } from "../utils";

const LEVELS: PhonemeLevel[] = ["good", "attention", "bad", "insufficient"];
const DOT: Record<PhonemeLevel, string> = {
  good: "bg-success",
  attention: "bg-warning",
  bad: "bg-danger",
  insufficient: "bg-border-strong",
};

function Grid({
  cells,
  selected,
  onSelect,
}: {
  cells: PhonemeCell[];
  selected: string | null;
  onSelect: (symbol: string) => void;
}) {
  const { t } = useTranslation("stats");
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
      {cells.map((cell) => {
        const status =
          cell.errorPercent === null ? t("weakness.map.cellNone") : t("weakness.map.cellPercent", { percent: cell.errorPercent });
        const on = cell.symbol === selected;
        return (
          <button
            key={cell.symbol}
            type="button"
            aria-pressed={on}
            aria-label={t("weakness.map.cellAria", { symbol: cell.symbol, example: cell.exampleWord ?? "", status })}
            onClick={() => onSelect(cell.symbol)}
            className={`flex h-14 cursor-pointer flex-col items-center justify-center rounded-md border text-lg font-semibold transition-colors hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${phonemeTone(
              cell.level,
            )} ${on ? "ring-2 ring-primary" : ""}`}
          >
            {cell.symbol}
            <small className="text-[11px] font-medium opacity-80">{cell.errorPercent === null ? "—" : `${cell.errorPercent}%`}</small>
          </button>
        );
      })}
    </div>
  );
}

/** Bản đồ 44 âm vị chia hai nhóm, mỗi ô phân màu theo tỷ lệ lỗi (BR-TH-09). */
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
  const { vowels, consonants } = splitPhonemes(cells);
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">{t("weakness.map.title")}</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
          {LEVELS.map((level) => (
            <li key={level} className="flex items-center gap-1.5">
              <span className={`size-2.5 rounded-sm ${DOT[level]}`} aria-hidden="true" />
              {t(`weakness.map.legend.${level}`)}
            </li>
          ))}
        </ul>
      </div>
      <p className="mb-4 mt-2 text-[13px] text-text-muted">{t("weakness.map.hint")}</p>

      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary-text">{t("weakness.map.vowels")}</h3>
      <Grid cells={vowels} selected={selected} onSelect={onSelect} />
      <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-primary-text">{t("weakness.map.consonants")}</h3>
      <Grid cells={consonants} selected={selected} onSelect={onSelect} />
    </section>
  );
}
