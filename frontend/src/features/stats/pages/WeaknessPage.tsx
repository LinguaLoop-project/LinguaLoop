import { useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import DeltaBadge from "../components/DeltaBadge";
import DictationErrorsCard from "../components/DictationErrorsCard";
import PhonemeMap from "../components/PhonemeMap";
import PhonemePanel from "../components/PhonemePanel";
import RangeTabs from "../components/RangeTabs";
import ScoreTrendCard from "../components/ScoreTrendCard";
import StatsError from "../components/StatsError";
import WrongWordsCard from "../components/WrongWordsCard";
import { useDictationErrors, usePronunciation, useWrongWords } from "../hooks";
import type { PhonemeCell } from "../types";
import { useRangeParam } from "../useRangeParam";

type SkillTab = "all" | "pronunciation" | "dictation";

/** Âm mở sẵn khi vào trang: âm có tỷ lệ lỗi cao nhất trong các âm đã đủ dữ liệu; chưa có âm nào thì không mở. */
function defaultSymbol(cells: PhonemeCell[]): string | null {
  const rated = cells.filter((c) => c.errorPercent !== null);
  if (rated.length === 0) return null;
  return rated.reduce((worst, c) => ((c.errorPercent ?? 0) > (worst.errorPercent ?? 0) ? c : worst)).symbol;
}

function worstCell(cells: PhonemeCell[]): PhonemeCell | null {
  const rated = cells.filter((c) => c.errorPercent !== null);
  if (rated.length === 0) return null;
  return rated.reduce((worst, c) => ((c.errorPercent ?? 0) > (worst.errorPercent ?? 0) ? c : worst));
}

function SummaryCard({
  icon,
  iconShell,
  label,
  value,
  sub,
  onClick,
}: {
  icon: string;
  iconShell: string;
  label: string;
  value: string;
  sub?: React.ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <div className="flex items-center gap-3.5">
      <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${iconShell}`}>
        <Icon name={icon} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>
        <b className="mt-0.5 block truncate font-display text-xl font-bold leading-tight">{value}</b>
        {sub && <div className="mt-0.5 text-xs text-text-muted">{sub}</div>}
      </div>
    </div>
  );

  const shell =
    "rounded-lg border border-border bg-surface p-4 text-left shadow-[var(--shadow-card)] transition-colors";
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${shell} w-full cursor-pointer hover:border-border-strong hover:bg-surface-hover/50`}>
        {body}
      </button>
    );
  }
  return <div className={shell}>{body}</div>;
}

/** Trang Điểm yếu: dải chẩn đoán nhanh, tab lọc kỹ năng, khu vực Phát âm (Shadowing + Bản đồ 44 âm vị) và khu vực Nghe chép (UC-TH-03, BR-TH-05). */
export default function WeaknessPage() {
  const { t } = useTranslation("stats");
  const [range, setRange] = useRangeParam();
  const [skillTab, setSkillTab] = useState<SkillTab>("all");
  const [picked, setPicked] = useState<string | null>(null);

  const pronQuery = usePronunciation(range);
  const dictQuery = useDictationErrors(range);
  const wordsQuery = useWrongWords(range);

  const data = pronQuery.data;
  const selected = picked ?? (data ? defaultSymbol(data.phonemes) : null);
  const topWeakPhoneme = data ? worstCell(data.phonemes) : null;

  const classes = dictQuery.data?.classes ?? [];
  const worstClass = classes.reduce<(typeof classes)[number] | null>(
    (worst, cur) => (cur.errors > 0 && (!worst || cur.errorPercent > worst.errorPercent) ? cur : worst),
    null,
  );
  const topWord = wordsQuery.data?.words[0] ?? null;

  const scrollTo = (id: string, targetTab: SkillTab) => {
    if (skillTab !== "all" && skillTab !== targetTab) setSkillTab("all");
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <section className="flex w-full flex-col gap-6" id="v-weakness">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fn-weakness/40 bg-fn-weakness-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-fn-weakness">
              <Icon name="target" className="size-3.5" />
              {t("weakness.overline")}
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{t("weakness.title")}</h1>
          <p className="mt-1 text-text-muted">{t("weakness.sub")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            ariaLabel={t("weakness.tabs.label")}
            value={skillTab}
            options={[
              { value: "all", label: t("weakness.tabs.all") },
              { value: "pronunciation", label: t("weakness.tabs.pronunciation") },
              { value: "dictation", label: t("weakness.tabs.dictation") },
            ]}
            onChange={(v) => setSkillTab(v as SkillTab)}
          />
          <RangeTabs value={range} onChange={setRange} />
        </div>
      </header>

      {/* Dải chẩn đoán nhanh: 4 KPI tổng hợp ở đầu trang */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon="mic"
          iconShell="bg-fn-shadowing-soft text-fn-shadowing"
          label={t("weakness.summary.pronunciationScore")}
          value={data?.averageScore != null ? t("weakness.summary.scoreValue", { score: data.averageScore }) : "—"}
          sub={
            data?.scoreDelta != null ? (
              <DeltaBadge delta={data.scoreDelta} range={data.range} />
            ) : (
              t("weakness.summary.noScore")
            )
          }
          onClick={() => scrollTo("pronunciation-section", "pronunciation")}
        />
        <SummaryCard
          icon="audio-lines"
          iconShell="bg-danger/15 text-danger"
          label={t("weakness.summary.worstPhoneme")}
          value={topWeakPhoneme ? `/${topWeakPhoneme.symbol}/` : "—"}
          sub={
            topWeakPhoneme?.errorPercent != null
              ? t("weakness.map.cellPercent", { percent: topWeakPhoneme.errorPercent })
              : t("weakness.summary.noWorstPhoneme")
          }
          onClick={
            topWeakPhoneme
              ? () => {
                  setPicked(topWeakPhoneme.symbol);
                  scrollTo("phoneme-map", "pronunciation");
                }
              : undefined
          }
        />
        <SummaryCard
          icon="headphones"
          iconShell="bg-fn-dictation-soft text-fn-dictation"
          label={t("weakness.summary.worstWordClass")}
          value={worstClass ? t(`weakness.dictation.class.${worstClass.wordClass}`) : "—"}
          sub={
            worstClass
              ? t("weakness.dictation.errorRate", { percent: worstClass.errorPercent })
              : t("weakness.summary.noWorstClass")
          }
          onClick={() => scrollTo("dictation-section", "dictation")}
        />
        <SummaryCard
          icon="bookmark"
          iconShell="bg-fn-vocab-soft text-fn-vocab"
          label={t("weakness.summary.topWrongWord")}
          value={topWord ? topWord.word : "—"}
          sub={
            topWord
              ? t("weakness.words.wrong", { wrong: topWord.wrongCount, seen: topWord.seenCount })
              : t("weakness.summary.noWrongWord")
          }
          onClick={() => scrollTo("dictation-section", "dictation")}
        />
      </div>

      {/* Khu vực 1: Phát âm Shadowing */}
      {skillTab !== "dictation" && (
        <section id="pronunciation-section" className="flex flex-col gap-5">
          <div className="flex items-center gap-2 border-t border-border pt-5">
            <Icon name="mic" className="size-5 text-fn-shadowing" />
            <h2 className="font-display text-2xl font-bold">{t("weakness.sections.pronunciation")}</h2>
          </div>

          {pronQuery.isError && !data ? (
            <StatsError error={pronQuery.error} onRetry={() => void pronQuery.refetch()} retrying={pronQuery.isFetching} />
          ) : !data ? (
            <div className="flex flex-col gap-6" aria-busy="true">
              <Skeleton className="h-44 w-full rounded-lg" />
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <Skeleton className="h-96 w-full rounded-lg" />
                <Skeleton className="h-96 w-full rounded-lg" />
              </div>
            </div>
          ) : (
            <>
              <ScoreTrendCard data={data} />
              <div id="phoneme-map" className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <PhonemeMap cells={data.phonemes} selected={selected} onSelect={setPicked} />
                <PhonemePanel symbol={selected} range={range} />
              </div>
            </>
          )}
        </section>
      )}

      {/* Khu vực 2: Nghe chép (Dictation) */}
      {skillTab !== "pronunciation" && (
        <section id="dictation-section" className="flex flex-col gap-5">
          <div className="flex items-center gap-2 border-t border-border pt-5">
            <Icon name="headphones" className="size-5 text-fn-dictation" />
            <h2 className="font-display text-2xl font-bold">{t("weakness.sections.dictation")}</h2>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <DictationErrorsCard range={range} />
            <WrongWordsCard range={range} />
          </div>
        </section>
      )}
    </section>
  );
}
