import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import ProgressBar from "@/components/common/ProgressBar";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import { playPronunciation } from "@/features/dictionary";
import { useQuotaStore } from "@/stores/quotaStore";
import DeckProgressBar from "../components/DeckProgressBar";
import { useDeck } from "../hooks";
import type { DeckDetail, DeckPart } from "../types";
import { nextPartIndex, partState, partUrl, percentOf, PART_WINDOW, visibleParts } from "../utils";

const LEGEND: { key: "mastered" | "reviewing" | "learning" | "newCount"; label: string; dot: string }[] = [
  { key: "mastered", label: "mastered", dot: "bg-success" },
  { key: "reviewing", label: "reviewing", dot: "bg-info" },
  { key: "learning", label: "learning", dot: "bg-warning" },
  { key: "newCount", label: "new", dot: "bg-border-strong" },
];

function Hero({ detail, next }: { detail: DeckDetail; next: number | null }) {
  const { t, i18n } = useTranslation("vocab");
  const { deck } = detail;
  const subtitle = i18n.language.startsWith("vi") ? deck.nameVi : null;
  const locked = detail.parts.some((part) => part.locked);
  const openUpgrade = useQuotaStore((s) => s.setShowUpgradeModal);

  return (
    <div className="flex flex-wrap items-start justify-between gap-6 rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
      <div className="flex min-w-[260px] flex-1 items-start gap-4">
        <span className="grid h-14 w-14 flex-none place-items-center rounded-md bg-fn-vocab-soft text-fn-vocab">
          <Icon name="layers" className="h-8 w-8" />
        </span>
        <div className="min-w-0">
          <h1 className="text-[28px]">{deck.name}</h1>
          {subtitle && <p className="text-text-muted">{subtitle}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
            {deck.cefrLevel && <Badge variant={deck.cefrLevel}>{deck.cefrLevel}</Badge>}
            {deck.pro && <Badge variant="pro">{t("deck.pro")}</Badge>}
            <span>
              {t("deck.cards", { count: deck.cardCount })} · {t("deck.parts", { count: deck.groupCount })}
            </span>
          </div>
        </div>
      </div>
      <div className="flex w-full max-w-[380px] min-w-[260px] flex-1 flex-col gap-3">
        <DeckProgressBar progress={deck.progress} total={deck.cardCount} />
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-muted">
          {LEGEND.map(({ key, label, dot }) => (
            <li key={key} className="inline-flex items-center gap-1.5">
              <i className={`h-2.5 w-2.5 rounded-full ${dot}`} />
              {t(`detail.legend.${label}`)} <b className="text-text">{deck.progress[key]}</b>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          {next !== null ? (
            <Link to={partUrl(deck.slug, next)} className={buttonClasses({ variant: "primary" })}>
              <Icon name="play" className="h-4 w-4" />
              {t("detail.learnNew")}
            </Link>
          ) : locked ? (
            <Button leftIcon={<Icon name="crown" />} onClick={() => openUpgrade(true, "pro")}>
              {t("detail.unlock")}
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
              <Icon name="circle-check" className="h-4 w-4 text-success" />
              {t("detail.allLearned")}
            </span>
          )}
          {deck.dueCount > 0 && (
            <Link to={`/student/vocab?tab=review&deck=${encodeURIComponent(deck.slug)}`} className={buttonClasses({ variant: "ghost" })}>
              <Icon name="refresh-cw" className="h-4 w-4" />
              {t("detail.reviewDeck", { count: deck.dueCount })}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function PartRow({ slug, part, next }: { slug: string; part: DeckPart; next: number | null }) {
  const { t, i18n } = useTranslation("vocab");
  const state = partState(part, next);
  const openUpgrade = useQuotaStore((s) => s.setShowUpgradeModal);
  const name = (i18n.language.startsWith("vi") ? part.nameVi : null) ?? part.name;
  const href = partUrl(slug, part.index);

  return (
    <li className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-1 py-3 last:border-b-0 ${state === "locked" ? "opacity-70" : ""}`}>
      <span
        className={`grid h-8 w-8 flex-none place-items-center rounded-full text-sm font-bold ${
          state === "done" ? "bg-success/20 text-success" : state === "current" ? "bg-fn-vocab-soft text-fn-vocab" : "bg-border text-text-muted"
        }`}
      >
        {state === "done" ? <Icon name="check" className="h-4 w-4" /> : state === "locked" ? <Icon name="lock" className="h-4 w-4" /> : part.index + 1}
      </span>
      <div className="min-w-[180px] flex-1">
        <b className="block">{name}</b>
        <span className="text-[13px] text-text-muted">
          {t("detail.parts.cards", { count: part.cardCount })}
          {part.studiedCount > 0 && ` · ${t("detail.parts.studied", { count: part.studiedCount })}`}
        </span>
      </div>
      <div className="w-[120px] flex-none">
        <ProgressBar
          thin
          tone={state === "done" ? "success" : "vocab"}
          value={percentOf(part.studiedCount, part.cardCount)}
          label={name}
        />
      </div>
      {state === "locked" ? (
        <Button variant="ghost" size="sm" aria-label={`${name}: ${t("detail.parts.locked")}`} leftIcon={<Icon name="crown" />} onClick={() => openUpgrade(true, "pro")}>
          {t("detail.parts.pro")}
        </Button>
      ) : (
        <Link to={href} className={buttonClasses({ variant: state === "current" ? "primary" : "ghost", size: "sm" })}>
          {state === "done" ? t("detail.parts.review") : state === "current" ? t("detail.parts.learn") : t("detail.parts.open")}
        </Link>
      )}
    </li>
  );
}

function Loading() {
  const { t } = useTranslation("vocab");
  return (
    <div role="status" aria-label={t("loading")} className="flex flex-col gap-4">
      <Skeleton className="h-[170px] rounded-lg" />
      <Skeleton className="h-[300px] rounded-lg" />
    </div>
  );
}

/** Trang `/student/vocab/:deckId` (UC-HT-01): tiến độ của bộ, các phần và vài từ mẫu. */
export default function DeckPage() {
  const { t } = useTranslation("vocab");
  const params = useParams();
  const slug = params.deckId ?? params.id;
  const query = useDeck(slug);
  const [showAll, setShowAll] = useState(false);

  const back = (
    <Link to="/student/vocab" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
      <Icon name="arrow-left" className="h-4 w-4" />
      {t("detail.back")}
    </Link>
  );

  if (query.isPending) return <section className="w-full">{back}<Loading /></section>;
  if (query.isError) {
    const status = isAxiosError(query.error) ? query.error.response?.status : undefined;
    return (
      <section className="w-full">
        {back}
        {status === 404 ? (
          <ErrorState
            kind="notFound"
            action={<Link to="/student/vocab" className={buttonClasses({ variant: "ghost" })}>{t("detail.backToDecks")}</Link>}
          />
        ) : (
          <ErrorState
            kind={isAxiosError(query.error) && !query.error.response ? "network" : "server"}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        )}
      </section>
    );
  }

  const detail = query.data;
  const next = nextPartIndex(detail.parts);
  const shown = visibleParts(detail.parts, next, showAll);
  const doneParts = detail.parts.filter((part) => part.cardCount > 0 && part.studiedCount >= part.cardCount).length;

  return (
    <section className="w-full" id="v-deck">
      {back}
      <Hero detail={detail} next={next} />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{t("detail.parts.title")}</h2>
            <span className="text-sm text-text-muted">
              {t("detail.parts.done", { done: doneParts, total: detail.parts.length })}
            </span>
          </div>
          <ol>
            {shown.items.map((part) => (
              <PartRow key={part.index} slug={detail.deck.slug} part={part} next={next} />
            ))}
          </ol>
          {detail.parts.length > PART_WINDOW && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-text-muted">
              <span>
                {showAll
                  ? t("detail.parts.range", { from: 1, to: detail.parts.length, total: detail.parts.length })
                  : t("detail.parts.range", { from: shown.from + 1, to: shown.to, total: detail.parts.length })}
              </span>
              <Button variant="text" size="sm" onClick={() => setShowAll((current) => !current)}>
                {showAll ? t("detail.parts.showLess") : t("detail.parts.showAll")}
              </Button>
            </div>
          )}
        </div>
        <aside className="flex flex-col gap-6">
          {detail.sampleWords.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="mb-2 text-lg font-bold">{t("detail.sample.title")}</h2>
              <table className="w-full text-left">
                <thead className="text-xs uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="py-1.5 font-bold">{t("detail.sample.word")}</th>
                    <th className="py-1.5 font-bold">{t("detail.sample.meaning")}</th>
                    <th className="w-9" />
                  </tr>
                </thead>
                <tbody>
                  {detail.sampleWords.map((word) => (
                    <tr key={word.word} className="border-t border-border align-top">
                      <td className="py-2 pr-2">
                        <b>{word.word}</b>
                        {word.ipaUs && <div className="text-xs text-text-muted">{word.ipaUs}</div>}
                      </td>
                      <td className="py-2 pr-2 text-sm">{word.translationVi?.split(";")[0]}</td>
                      <td className="py-1 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          aria-label={t("detail.sample.listen", { word: word.word })}
                          onClick={() => playPronunciation(word.word, "us", word.audioUs)}
                        >
                          <Icon name="volume-2" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-2 text-lg font-bold">{t("detail.tips.title")}</h2>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-text-muted">
              <li>{t("detail.tips.one")}</li>
              <li>{t("detail.tips.two")}</li>
              <li>{t("detail.tips.three")}</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
