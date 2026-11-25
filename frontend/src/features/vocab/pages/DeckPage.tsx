import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { learnedCount, nextPartIndex, partState, partUrl, percentOf, PART_WINDOW, visibleParts } from "../utils";

const LEGEND: { key: "mastered" | "reviewing" | "learning" | "newCount"; label: string; dot: string }[] = [
  { key: "mastered", label: "mastered", dot: "bg-success" },
  { key: "reviewing", label: "reviewing", dot: "bg-info" },
  { key: "learning", label: "learning", dot: "bg-warning" },
  { key: "newCount", label: "new", dot: "bg-border-strong" },
];

const TIP_ICONS = ["layers", "sparkles", "rotate-cw"] as const;

function Hero({ detail, next }: { detail: DeckDetail; next: number | null }) {
  const { t } = useTranslation("vocab");
  const { deck } = detail;
  const [imgFailed, setImgFailed] = useState(false);
  const locked = detail.parts.some((part) => part.locked);
  const openUpgrade = useQuotaStore((s) => s.setShowUpgradeModal);
  const learned = learnedCount(deck.progress);
  const overallPercent = percentOf(learned, deck.cardCount);
  const nextPart = next !== null ? detail.parts[next] : null;

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] before:pointer-events-none before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)]">
      <div className="flex min-w-[260px] flex-1 items-center gap-5">
        {deck.thumbnailUrl && !imgFailed ? (
          <img
            src={deck.thumbnailUrl}
            alt=""
            onError={() => setImgFailed(true)}
            className="h-24 w-36 flex-none rounded-lg border border-border object-cover shadow-sm"
          />
        ) : (
          <span className="grid h-16 w-16 flex-none place-items-center rounded-xl border border-fn-vocab/30 bg-fn-vocab-soft text-fn-vocab">
            <Icon name="layers" className="h-8 w-8" />
          </span>
        )}
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            {deck.category && (
              <span className="rounded-full border border-fn-vocab/30 bg-fn-vocab-soft px-2.5 py-0.5 text-xs font-semibold text-fn-vocab">
                {deck.category.name}
              </span>
            )}
            {deck.pro && <Badge variant="pro">{t("deck.pro")}</Badge>}
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight md:text-[28px]">{deck.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="layers" className="h-3.5 w-3.5 text-fn-vocab" />
              {t("deck.cards", { count: deck.cardCount })} · {t("deck.parts", { count: deck.groupCount })}
            </span>
            {nextPart && (
              <span className="rounded-md border border-border bg-bg-elevated px-2 py-0.5 text-xs text-text-muted">
                {t("detail.nextLabel")}{" "}
                <b className="text-text">{t("detail.partLabel", { n: nextPart.index + 1, name: nextPart.name })}</b>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-[400px] min-w-[260px] flex-1 flex-col gap-3 rounded-xl border border-border bg-bg-elevated/60 p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
          <span>{t("detail.progressTitle")}</span>
          <span className="tabular-nums text-text">
            {learned}/{deck.cardCount} ({overallPercent}%)
          </span>
        </div>
        <DeckProgressBar progress={deck.progress} total={deck.cardCount} />
        <ul className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-text-muted">
          {LEGEND.map(({ key, label, dot }) => (
            <li key={key} className="inline-flex items-center gap-1.5">
              <i className={`h-2 w-2 rounded-full ${dot}`} />
              {t(`detail.legend.${label}`)} <b className="tabular-nums text-text">{deck.progress[key]}</b>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex flex-wrap gap-2">
          {next !== null ? (
            <Link to={partUrl(deck.id, next)} className={buttonClasses({ variant: "primary" })}>
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
            <Link to={`/student/vocab?tab=review&deck=${encodeURIComponent(deck.id)}`} className={buttonClasses({ variant: "ghost" })}>
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
  const { t } = useTranslation("vocab");
  const navigate = useNavigate();
  const state = partState(part, next);
  const openUpgrade = useQuotaStore((s) => s.setShowUpgradeModal);
  const name = part.name;
  const href = partUrl(slug, part.index);
  const percent = percentOf(part.studiedCount, part.cardCount);
  const isCurrent = state === "current";
  const isDone = state === "done";
  const isLocked = state === "locked";

  const handleRowClick = () => {
    if (isLocked) {
      openUpgrade(true, "pro");
    } else if (part.cardCount > 0) {
      navigate(href);
    }
  };

  return (
    <li
      onClick={handleRowClick}
      className={`group flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-3 py-3 transition-all duration-150 ${
        isCurrent
          ? "my-1 cursor-pointer border-fn-vocab/50 bg-fn-vocab-soft/20 shadow-sm hover:border-fn-vocab"
          : isLocked
            ? "cursor-pointer border-transparent opacity-75 hover:bg-surface-hover/50"
            : part.cardCount > 0
              ? "cursor-pointer border-transparent hover:border-border hover:bg-surface-hover/70"
              : "border-transparent"
      }`}
    >
      <span
        className={`grid h-9 w-9 flex-none place-items-center rounded-full text-sm font-bold transition-transform duration-150 group-hover:scale-105 ${
          isDone
            ? "bg-success/20 text-success"
            : isCurrent
              ? "bg-fn-vocab text-white shadow-sm"
              : "bg-bg-elevated text-text-muted"
        }`}
      >
        {isDone ? <Icon name="check" className="h-4 w-4" /> : isLocked ? <Icon name="lock" className="h-4 w-4" /> : part.index + 1}
      </span>
      <div className="min-w-[180px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <b className="transition-colors group-hover:text-primary-text">{name}</b>
          {isCurrent && (
            <span className="rounded-full bg-fn-vocab-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fn-vocab">
              {t("detail.current")}
            </span>
          )}
        </div>
        <span className="text-[13px] text-text-muted">
          {t("detail.parts.cards", { count: part.cardCount })}
          {part.studiedCount > 0 && ` · ${t("detail.parts.studied", { count: part.studiedCount })}`}
        </span>
      </div>
      <div className="flex w-[140px] flex-none flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] tabular-nums text-text-muted">
          <span>
            {part.studiedCount}/{part.cardCount}
          </span>
          <span>{percent}%</span>
        </div>
        <ProgressBar
          thin
          tone={isDone ? "success" : "vocab"}
          value={percent}
          label={name}
        />
      </div>
      {isLocked ? (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`${name}: ${t("detail.parts.locked")}`}
          leftIcon={<Icon name="crown" />}
          onClick={(e) => {
            e.stopPropagation();
            openUpgrade(true, "pro");
          }}
        >
          {t("detail.parts.pro")}
        </Button>
      ) : part.cardCount === 0 ? (
        <span className="text-[13px] text-text-muted">{t("detail.parts.empty")}</span>
      ) : (
        <Link
          to={href}
          onClick={(e) => e.stopPropagation()}
          className={buttonClasses({ variant: isCurrent ? "primary" : "ghost", size: "sm" })}
        >
          {isDone ? t("detail.parts.review") : isCurrent ? t("detail.parts.learn") : t("detail.parts.open")}
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
              <PartRow key={part.index} slug={detail.deck.id} part={part} next={next} />
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
            <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
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
                    <tr key={word.word} className="border-t border-border align-top transition-colors hover:bg-surface-hover/50">
                      <td className="py-2.5 pr-2">
                        <Link
                          to={`/student/dictionary/${encodeURIComponent(word.word)}`}
                          className="font-bold text-text transition-colors hover:text-primary-text"
                        >
                          {word.word}
                        </Link>
                        {word.ipaUs && <div className="font-mono text-xs text-text-muted">{word.ipaUs}</div>}
                      </td>
                      <td className="py-2.5 pr-2 text-sm text-text-muted">{word.meaningVi?.split(";")[0]}</td>
                      <td className="py-1.5 text-right">
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
          <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 text-lg font-bold">{t("detail.tips.title")}</h2>
            <ul className="flex flex-col gap-3 text-sm text-text-muted">
              {(["one", "two", "three"] as const).map((key, idx) => (
                <li key={key} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-md bg-fn-vocab-soft text-fn-vocab">
                    <Icon name={TIP_ICONS[idx]} className="h-3.5 w-3.5" />
                  </span>
                  <span className="leading-snug">{t(`detail.tips.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
