import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import Mascot, { type MascotMood } from "@/components/common/Mascot";
import type { DictationLevel, GradedWord, PromptToken, WordOutcome } from "../types";
import { LEVEL_CHIP, SCORE_TEXT, scoreTone } from "../utils";

export interface ResultDiffProps {
  score: number;
  level: DictationLevel;
  /** Kết quả từng từ của lượt vừa làm; null khi chỉ biết điểm (mở lại bài từ lần trước). */
  words: GradedWord[] | null;
  /** Đề Easy của lượt này: có thì hiện cả câu, từ hiện sẵn để nguyên và các ô trống tô theo kết quả. */
  context: PromptToken[] | null;
  gaveUp: boolean;
  /** Đang tải chi tiết từng từ của lượt cũ: chưa hiện ghi chú "không có chi tiết". */
  detailLoading: boolean;
  text: string | null;
  textVi: string | null;
  showTranslation: boolean;
}

/** Màu của từng loại kết quả; class viết nguyên văn để Tailwind nhận ra. */
const TOKEN_STYLE: Record<WordOutcome, string> = {
  correct: "text-success",
  omitted:
    "bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] text-text-muted outline-2 -outline-offset-2 outline-dashed outline-danger",
  substituted: "bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] text-text",
  misspelled: "bg-[color-mix(in_srgb,var(--info)_15%,transparent)] text-info",
  inserted: "text-accent-2 line-through",
  revealed:
    "bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] text-warning outline-2 -outline-offset-2 outline-dashed outline-warning",
};

const CHIP_TONE = { omitted: "danger", substituted: "warning", misspelled: "info" } as const;
type ChipOutcome = keyof typeof CHIP_TONE;
const isChipOutcome = (outcome: WordOutcome): outcome is ChipOutcome => outcome in CHIP_TONE;

const REVEALED_LEGEND = {
  outcome: "revealed",
  swatch: "border-2 border-dashed border-warning",
} as const satisfies { outcome: WordOutcome; swatch: string };

const LEGEND: { outcome: WordOutcome; swatch: string }[] = [
  { outcome: "correct", swatch: "bg-success" },
  { outcome: "omitted", swatch: "border-2 border-dashed border-danger" },
  { outcome: "substituted", swatch: "bg-[color-mix(in_srgb,var(--warning)_35%,transparent)] ring-1 ring-inset ring-warning" },
  { outcome: "misspelled", swatch: "bg-[color-mix(in_srgb,var(--info)_35%,transparent)] ring-1 ring-inset ring-info" },
  { outcome: "inserted", swatch: "bg-accent-2" },
];

const moodFor = (score: number): { mood: MascotMood; key: string } =>
  score >= 80
    ? { mood: "correct", key: "result.moodGreat" }
    : score >= 60
      ? { mood: "listening", key: "result.moodOk" }
      : { mood: "encourage", key: "result.moodHard" };

/** Một từ đã chấm: tô màu theo kết quả, từ sai có gợi ý nổi (nhóm lỗi và chữ đã gõ). */
function Token({ word }: { word: GradedWord }) {
  const { t } = useTranslation("dictation");
  const shown = word.outcome === "inserted" ? (word.actualWord ?? "") : (word.display ?? word.expectedWord ?? "");
  if (word.outcome === "correct") {
    return <span className={`rounded-sm px-1 py-0.5 ${TOKEN_STYLE.correct}`}>{shown}</span>;
  }
  const label =
    word.outcome === "inserted"
      ? t("tip.inserted")
      : t(`category.${word.wordClass}_${word.outcome}`, { defaultValue: t("tip.fallback") });
  const typed = word.actualWord && word.outcome !== "inserted" ? ` · ${t("tip.youTyped", { word: word.actualWord })}` : "";
  const tipLabel = word.outcome === "revealed" ? t("tip.revealed") : label;
  return (
    <span tabIndex={0} className={`group relative cursor-default rounded-sm px-1 py-0.5 ${TOKEN_STYLE[word.outcome]}`}>
      {word.outcome === "substituted" && word.actualWord && (
        <s className="mr-1 text-base text-warning">{word.actualWord}</s>
      )}
      {shown}
      {word.homophone && (
        <span role="img" aria-label={t("tip.homophoneMark")} className="ml-1 inline-block align-[-2px]">
          <Icon name="ear" className="h-4 w-4" />
        </span>
      )}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-sm bg-text px-2.5 py-1.5 text-xs font-medium leading-snug text-bg-base no-underline opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100"
      >
        {tipLabel}
        {typed}
        {word.homophone && ` · ${t("tip.homophone")}`}
      </span>
    </span>
  );
}

/** Kết quả một câu (`resultHtml` của mockup): điểm, câu tô màu, chip lỗi theo nhóm, chú thích màu, lời Loopi, bản dịch. */
export default function ResultDiff({
  score,
  level,
  words,
  context,
  gaveUp,
  detailLoading,
  text,
  textVi,
  showTranslation,
}: ResultDiffProps) {
  const { t } = useTranslation("dictation");
  const tone = scoreTone(score);
  const { mood, key } = moodFor(score);

  const counts = new Map<string, { n: number; outcome: ChipOutcome }>();
  for (const word of words ?? []) {
    if (word.wordClass && isChipOutcome(word.outcome)) {
      const id = `${word.wordClass}_${word.outcome}`;
      counts.set(id, { n: (counts.get(id)?.n ?? 0) + 1, outcome: word.outcome });
    }
  }
  const perfect = words !== null && counts.size === 0 && score === 100;
  const legend = words?.some((word) => word.outcome === "revealed") ? [...LEGEND, REVEALED_LEGEND] : LEGEND;
  const byPosition = new Map((words ?? []).flatMap((word) => (word.position === null ? [] : [[word.position, word] as const])));

  return (
    <div aria-live="polite" className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-2.5 @[600px]:flex-row @[600px]:items-start @[600px]:gap-[18px]">
        <div className="flex w-fit flex-none items-baseline gap-2 self-start rounded-lg bg-surface-hover px-3.5 py-1.5 text-center @[600px]:block @[600px]:w-[88px] @[600px]:px-0 @[600px]:py-2.5">
          <b className={`block font-display text-3xl font-extrabold leading-tight @[600px]:text-4xl ${SCORE_TEXT[tone]}`}>{Math.round(score)}</b>
          <span className="text-xs">{t("result.score")}</span>
        </div>
        <div className="flex min-w-0 grow flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex h-[22px] items-center rounded-full border px-2 text-[11px] ${LEVEL_CHIP[level]}`}>
              {t(`level.${level}`)}
            </span>
          </div>
          {gaveUp && (
            <div>
              <Badge tone="warning">
                <Icon name="eye" />
                {t("result.gaveUp")}
              </Badge>
            </div>
          )}
          {words ? (
            <div className="text-[19px] font-semibold leading-[1.9] @[600px]:text-[22px] @[600px]:leading-loose">
              {context
                ? context.map((token, i) => {
                    const graded = token.blank ? byPosition.get(token.position) : undefined;
                    return (
                      <span key={token.position}>
                        {i > 0 && " "}
                        {graded ? <Token word={graded} /> : <span className="px-1 py-0.5 text-text">{token.display}</span>}
                      </span>
                    );
                  })
                : words.map((word, i) => (
                    <span key={`${word.position ?? "x"}-${i}`}>
                      {i > 0 && " "}
                      <Token word={word} />
                    </span>
                  ))}
            </div>
          ) : (
            <>
              {text && <p className="text-[19px] font-semibold leading-[1.9]">{text}</p>}
              {!detailLoading && <p className="text-[13px] text-text-muted">{t("result.noDetail")}</p>}
            </>
          )}
          {counts.size > 0 && (
            <div className="flex flex-wrap gap-2">
              {[...counts].map(([id, { n, outcome }]) => (
                <Badge key={id} tone={CHIP_TONE[outcome]}>
                  {t(`category.${id}`)} ×{n}
                </Badge>
              ))}
            </div>
          )}
          {perfect && (
            <div>
              <Badge tone="success">
                <Icon name="circle-check" />
                {t("result.perfect")}
              </Badge>
            </div>
          )}
          {words && (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
              {legend.map(({ outcome, swatch }) => (
                <li key={outcome} className="flex items-center gap-1.5">
                  <i aria-hidden="true" className={`inline-block h-3 w-3 rounded-[4px] ${swatch}`} />
                  {t(`legend.${outcome}`)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5 text-[13px] text-text-muted">
        <Mascot mood={mood} size={48} alt="" />
        <span>{t(key)}</span>
      </div>
      {showTranslation && textVi && (
        <details open className="text-[13px]">
          <summary className="cursor-pointer text-text-muted">{t("result.translation")}</summary>
          <p className="mt-1.5 text-[15px]">{textVi}</p>
        </details>
      )}
    </div>
  );
}
