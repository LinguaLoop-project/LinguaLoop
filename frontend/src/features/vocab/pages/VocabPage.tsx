import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import Button from "@/components/common/Button";
import Chip from "@/components/common/Chip";
import ErrorState from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import SearchInput from "@/components/common/SearchInput";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import DeckCard, { DeckCardSkeleton } from "../components/DeckCard";
import ReviewPanel from "../components/review/ReviewPanel";
import StatCard from "../components/StatCard";
import { useDecks } from "../hooks";
import type { DeckCategory, DeckSummary } from "../types";
import {
  EMPTY_DECK_FILTER,
  filterDecks,
  groupByCategory,
  isDeckFilterActive,
  isStarted,
  type DeckFilter,
  type DeckStateFilter,
} from "../utils";

const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";
const STATES: DeckStateFilter[] = ["all", "learning", "new"];

const categoryName = (category: DeckCategory, vi: boolean) => (vi ? category.nameVi : null) ?? category.name;

/** Các bộ gom theo danh mục, mỗi danh mục một tiêu đề nhỏ. */
function CategoryGroups({ decks, vi }: { decks: DeckSummary[]; vi: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      {groupByCategory(decks).map(({ category, decks: inCategory }) => (
        <div key={category?.slug ?? "other"}>
          {category && <h3 className="mb-3 text-base font-bold text-text-muted">{categoryName(category, vi)}</h3>}
          <div className={GRID}>
            {inCategory.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Ô tìm và bộ lọc: danh mục, tình trạng học và mức CEFR (chỉ hiện khi các bộ có từ hai mức trở lên). */
function Filters({
  decks,
  filter,
  onChange,
  vi,
}: {
  decks: DeckSummary[];
  filter: DeckFilter;
  onChange: (filter: DeckFilter) => void;
  vi: boolean;
}) {
  const { t } = useTranslation("vocab");
  const categories = groupByCategory(decks).flatMap((group) => (group.category ? [{ ...group.category, count: group.decks.length }] : []));
  const levels = [...new Set(decks.flatMap((deck) => (deck.cefrLevel ? [deck.cefrLevel] : [])))].sort();
  const patch = (change: Partial<DeckFilter>) => onChange({ ...filter, ...change });

  return (
    <div className="flex flex-col gap-3" role="search" aria-label={t("filter.label")}>
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={filter.query}
          onChange={(query) => patch({ query })}
          placeholder={t("filter.search.placeholder")}
          ariaLabel={t("filter.search.aria")}
        />
        <SegmentedControl
          ariaLabel={t("filter.state.label")}
          value={filter.state}
          onChange={(value) => patch({ state: value as DeckStateFilter })}
          options={STATES.map((value) => ({ value, label: t(`filter.state.${value}`) }))}
        />
        {levels.length > 1 && (
          <SegmentedControl
            ariaLabel={t("filter.level.label")}
            value={filter.level}
            onChange={(level) => patch({ level })}
            options={[{ value: "all", label: t("filter.level.all") }, ...levels.map((level) => ({ value: level, label: level }))]}
          />
        )}
      </div>
      {categories.length > 1 && (
        <div role="group" aria-label={t("filter.category.label")} className="flex flex-wrap gap-2">
          <Chip active={filter.category === "all"} onClick={() => patch({ category: "all" })} count={decks.length}>
            {t("filter.category.all")}
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.slug}
              active={filter.category === category.slug}
              onClick={() => patch({ category: category.slug })}
              count={category.count}
            >
              {categoryName(category, vi)}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

/** Trang `/student/vocab` (UC-HT-01): tổng quan thẻ, tìm và lọc bộ, các bộ đang học và khám phá bộ hệ thống. */
export default function VocabPage() {
  const { t, i18n } = useTranslation("vocab");
  const query = useDecks();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "review" ? "review" : "decks";
  const reviewDeck = params.get("deck") ?? undefined;
  const [filter, setFilter] = useState<DeckFilter>(EMPTY_DECK_FILTER);
  const vi = i18n.language.startsWith("vi");

  const decks = useMemo(() => query.data?.decks ?? [], [query.data]);
  const filtered = useMemo(() => filterDecks(decks, filter), [decks, filter]);
  const active = isDeckFilterActive(filter);
  const due = query.data?.overview.due ?? 0;

  const body = () => {
    if (query.isPending) {
      return (
        <div role="status" aria-label={t("loading")} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[112px] rounded-lg" />
            ))}
          </div>
          <div className={GRID}>
            {Array.from({ length: 3 }, (_, i) => (
              <DeckCardSkeleton key={i} />
            ))}
          </div>
        </div>
      );
    }
    if (query.isError) {
      const offline = isAxiosError(query.error) && !query.error.response;
      return <ErrorState kind={offline ? "network" : "server"} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
    }

    const { overview } = query.data;
    const started = decks.filter(isStarted);
    return (
      <div className="flex flex-col gap-8">
        <div role="group" aria-label={t("overview.label")} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={t("overview.due")} value={overview.due} hint={t("overview.dueHint")} tone="text-danger" />
          <StatCard label={t("overview.learning")} value={overview.learning} hint={t("overview.learningHint")} tone="text-warning" />
          <StatCard label={t("overview.reviewing")} value={overview.reviewing} hint={t("overview.reviewingHint")} tone="text-info" />
          <StatCard label={t("overview.mastered")} value={overview.mastered} hint={t("overview.masteredHint")} tone="text-success" />
        </div>

        {decks.length === 0 ? (
          <EmptyState title={t("empty.title")} description={t("empty.desc")} />
        ) : (
          <>
            <Filters decks={decks} filter={filter} onChange={setFilter} vi={vi} />

            {active ? (
              <section aria-labelledby="vocab-results" aria-live="polite">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 id="vocab-results" className="flex items-center gap-2 text-xl font-bold">
                    <Icon name="search" className="h-5 w-5 text-fn-vocab" />
                    {t("filter.results", { count: filtered.length })}
                  </h2>
                  <Button variant="text" size="sm" onClick={() => setFilter(EMPTY_DECK_FILTER)}>
                    {t("filter.clear")}
                  </Button>
                </div>
                {filtered.length === 0 ? (
                  <EmptyState
                    title={t("filter.noMatchTitle")}
                    description={t("filter.noMatchDesc")}
                    actionText={t("filter.clear")}
                    onAction={() => setFilter(EMPTY_DECK_FILTER)}
                  />
                ) : (
                  <CategoryGroups decks={filtered} vi={vi} />
                )}
              </section>
            ) : (
              <>
                <section aria-labelledby="vocab-learning">
                  <h2 id="vocab-learning" className="mb-3 flex items-center gap-2 text-xl font-bold">
                    <Icon name="zap" className="h-5 w-5 text-fn-vocab" />
                    {t("learning.title")}
                  </h2>
                  {started.length > 0 ? (
                    <div className={GRID}>
                      {started.map((deck) => (
                        <DeckCard key={deck.id} deck={deck} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
                      <h3 className="text-lg font-bold">{t("first.title")}</h3>
                      <p className="mt-1 text-text-muted">{t("first.desc")}</p>
                    </div>
                  )}
                </section>

                <section aria-labelledby="vocab-explore" className="flex flex-col gap-6">
                  <h2 id="vocab-explore" className="flex items-center gap-2 text-xl font-bold">
                    <Icon name="layers" className="h-5 w-5 text-fn-vocab" />
                    {t("explore.title")}
                  </h2>
                  <CategoryGroups decks={decks} vi={vi} />
                </section>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <section className="w-full" id="v-vocab">
      <header className="mb-6">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fn-vocab">
          <Icon name="layers" className="h-4 w-4" />
          {t("overline")}
        </div>
        <h1 className="text-[30px]">{t("title")}</h1>
        <p className="mt-1 text-text-muted">{t("subtitle")}</p>
      </header>
      <div className="mb-6">
        <SegmentedControl
          ariaLabel={t("tabs.label")}
          value={tab}
          onChange={(value) => setParams(value === "review" ? { tab: "review" } : {})}
          options={[
            { value: "decks", label: t("tabs.decks"), icon: <Icon name="layers" className="h-4 w-4" /> },
            {
              value: "review",
              label: due > 0 ? `${t("tabs.review")} · ${due}` : t("tabs.review"),
              icon: <Icon name="refresh-cw" className="h-4 w-4" />,
            },
          ]}
        />
      </div>
      {tab === "review" ? <ReviewPanel key={reviewDeck ?? ""} deck={reviewDeck} /> : body()}
    </section>
  );
}
