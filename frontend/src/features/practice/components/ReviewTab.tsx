import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import SegmentedControl from "@/components/common/SegmentedControl";
import { LEVEL_CHIP, SCORE_BADGE, scoreTone } from "@/features/dictation/utils";
import { StatCard } from "@/features/vocab";
import { toast } from "@/stores/toastStore";
import { REVIEW_ADD_BELOW, REVIEW_RESOLVE_AT } from "../constants";
import { useReviewEntries, useSetReview } from "../hooks";
import type { PracticeMode, ReviewSentence } from "../types";
import { dateFormatter, isNetworkError } from "../utils";
import ListState from "./ListState";

function speakSentence(text: string) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }
}

function ReviewRow({ item }: { item: ReviewSentence }) {
  const { t, i18n } = useTranslation("mywords");
  const navigate = useNavigate();
  const resolve = useSetReview(item.mode);
  const tone = item.lastScore === null ? null : scoreTone(item.lastScore);

  const onResolve = () =>
    resolve.mutate(
      { sentenceId: item.sentenceId, pinned: false },
      {
        onSuccess: () => toast(t("review.resolved"), { icon: "check" }),
        onError: (error) => toast(isNetworkError(error) ? t("offline") : t("review.resolveFailed"), { icon: "circle-alert" }),
      },
    );

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 transition-colors last:border-b-0 hover:bg-surface-hover/40">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-[17px] font-medium">“{item.text}”</span>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-[11px] font-semibold ${
              item.mode === "shadowing"
                ? "border-fn-shadowing/40 bg-[color-mix(in_srgb,var(--fn-shadowing)_14%,transparent)] text-fn-shadowing"
                : "border-fn-dictation/40 bg-[color-mix(in_srgb,var(--fn-dictation)_14%,transparent)] text-fn-dictation"
            }`}
          >
            <Icon name={item.mode === "shadowing" ? "mic" : "headphones"} className="h-3.5 w-3.5" />
            {t(`review.modes.${item.mode}`)}
          </span>
          <span className="inline-flex h-[22px] items-center rounded-full border border-border bg-bg-elevated px-2 text-[11px]">
            {t(`review.reason.${item.reason}`, { defaultValue: t("review.reason.low_score") })}
          </span>
          {item.lastScore !== null && tone && (
            <Badge tone={SCORE_BADGE[tone]}>{t("review.lastScore", { score: Math.round(item.lastScore) })}</Badge>
          )}
          {item.lastLevel && (
            <span className={`inline-flex h-[22px] items-center rounded-full border px-2 text-[11px] ${LEVEL_CHIP[item.lastLevel]}`}>
              {t(`dictation:level.${item.lastLevel}`)}
            </span>
          )}
          <Link to={`/student/lessons/${item.lessonId}`} className="inline-flex items-center gap-1 text-text-muted transition-colors hover:text-primary-text">
            <Icon name="play" className="h-3.5 w-3.5" />
            {item.lessonTitle}
          </Link>
          <time dateTime={item.addedAt} className="text-text-muted">
            · {dateFormatter(i18n.language).format(new Date(item.addedAt))}
          </time>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={t("review.listen")}
          title={t("review.listen")}
          onClick={() => speakSentence(item.text)}
        >
          <Icon name="volume-2" />
        </Button>
        <Button variant="ghost" size="sm" isLoading={resolve.isPending} leftIcon={<Icon name="check" />} onClick={onResolve}>
          {t("review.resolve")}
        </Button>
        <Button
          variant="fn"
          fn={item.mode}
          size="sm"
          onClick={() =>
            navigate(
              `/student/review/sentences?sentenceId=${encodeURIComponent(item.sentenceId)}&mode=${encodeURIComponent(item.mode)}`,
            )
          }
        >
          {t("review.practice")}
        </Button>
      </div>
    </li>
  );
}

type ModeFilter = "all" | PracticeMode;
type ReasonFilter = "all" | "low" | "manual";
type ReviewSort = "score_asc" | "newest";
const PAGE_SIZES = [10, 20] as const;

/** Tab "Câu cần ôn": câu làm kém hoặc đã ghim của cả nghe chép và Shadowing, lọc theo chế độ/lý do, tìm kiếm và phân trang. */
export default function ReviewTab() {
  const { t } = useTranslation("mywords");
  const query = useReviewEntries();
  const [filter, setFilter] = useState<ModeFilter>("all");
  const [reason, setReason] = useState<ReasonFilter>("all");
  const [sort, setSort] = useState<ReviewSort>("score_asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);

  const all = useMemo(() => query.data ?? [], [query.data]);
  const countOf = (mode: PracticeMode) => all.filter((item) => item.mode === mode).length;

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = all.filter((item) => {
      if (filter !== "all" && item.mode !== filter) return false;
      if (reason === "manual" && item.reason !== "manual") return false;
      if (reason === "low" && item.reason === "manual") return false;
      if (!q) return true;
      return `${item.text} ${item.lessonTitle}`.toLowerCase().includes(q);
    });
    const copy = [...filtered];
    if (sort === "newest") {
      copy.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    } else {
      copy.sort((a, b) => (a.lastScore ?? 0) - (b.lastScore ?? 0));
    }
    return copy;
  }, [all, filter, reason, search, sort]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pagedItems = items.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const resetFilters = () => {
    setFilter("all");
    setReason("all");
    setSearch("");
    setPage(0);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 rounded-md border border-border bg-bg-elevated px-3.5 py-3 text-sm text-text-muted">
        <Icon name="info" className="mt-0.5 h-4 w-4 flex-none" />
        <span>{t("review.tip", { low: REVIEW_ADD_BELOW, high: REVIEW_RESOLVE_AT })}</span>
      </div>
      <ListState query={query} skeletonRows={3}>
        {all.length === 0 ? (
          <EmptyState title={t("review.emptyTitle")} description={t("review.emptyDesc")} />
        ) : (
          <>
            <div role="group" aria-label={t("review.filter.label")} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                label={t("review.filter.all")}
                value={all.length}
                hint={t("review.stats.allHint")}
                tone="text-primary-text"
                icon="bookmark-check"
                active={filter === "all"}
                onClick={() => {
                  setFilter("all");
                  setPage(0);
                }}
              />
              <StatCard
                label={t("review.modes.dictation")}
                value={countOf("dictation")}
                hint={t("review.stats.dictationHint")}
                tone="text-fn-dictation"
                icon="headphones"
                active={filter === "dictation"}
                onClick={() => {
                  setFilter("dictation");
                  setPage(0);
                }}
              />
              <StatCard
                label={t("review.modes.shadowing")}
                value={countOf("shadowing")}
                hint={t("review.stats.shadowingHint")}
                tone="text-fn-shadowing"
                icon="mic"
                active={filter === "shadowing"}
                onClick={() => {
                  setFilter("shadowing");
                  setPage(0);
                }}
              />
            </div>

            <div className="flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-center">
              <SearchInput
                className="w-full min-w-[220px] sm:flex-1"
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(0);
                }}
                placeholder={t("review.search")}
                ariaLabel={t("review.search")}
              />
              <SegmentedControl
                ariaLabel={t("review.reasonFilter.label")}
                value={reason}
                onChange={(v) => {
                  setReason(v as ReasonFilter);
                  setPage(0);
                }}
                options={[
                  { value: "all", label: t("review.reasonFilter.all") },
                  { value: "low", label: t("review.reasonFilter.low") },
                  { value: "manual", label: t("review.reasonFilter.manual") },
                ]}
              />
              <SegmentedControl
                ariaLabel={t("review.sorts.label")}
                value={sort}
                onChange={(v) => {
                  setSort(v as ReviewSort);
                  setPage(0);
                }}
                options={[
                  { value: "score_asc", label: t("review.sorts.score_asc") },
                  { value: "newest", label: t("review.sorts.newest") },
                ]}
              />
            </div>

            {items.length === 0 ? (
              <EmptyState
                title={t("review.emptyFilteredTitle")}
                description={t("review.emptyFilteredDesc")}
                actionText={t("review.clearFilters")}
                onAction={resetFilters}
              />
            ) : (
              <>
                <ul className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]">
                  {pagedItems.map((item) => (
                    <ReviewRow key={`${item.mode}-${item.sentenceId}`} item={item} />
                  ))}
                </ul>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface/70 px-4 py-3">
                  <p className="text-sm tabular-nums text-text-muted">
                    {t("pagination.showing", {
                      from: safePage * pageSize + 1,
                      to: Math.min(items.length, (safePage + 1) * pageSize),
                      total: items.length,
                    })}
                  </p>
                  <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <span>{t("pagination.perPage")}</span>
                    <SegmentedControl
                      ariaLabel={t("pagination.perPage")}
                      value={String(pageSize)}
                      options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
                      onChange={(v) => {
                        setPageSize(Number(v));
                        setPage(0);
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </ListState>
    </div>
  );
}
