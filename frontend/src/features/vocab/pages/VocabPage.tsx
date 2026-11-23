import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import Button from "@/components/common/Button";
import Chip from "@/components/common/Chip";
import ErrorState from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import LoopiSay from "@/components/common/LoopiSay";
import SearchInput from "@/components/common/SearchInput";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import DeckCard, { ContinueDeckCard, DeckCardSkeleton } from "../components/DeckCard";
import MyDecksPanel from "../components/mine/MyDecksPanel";
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
  learnedCount,
  OTHER_CATEGORY,
  percentOf,
  type DeckFilter,
  type DeckStateFilter,
} from "../utils";

type DeckSort = "default" | "due" | "progress" | "cards";

const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";
const STATES: DeckStateFilter[] = ["all", "learning", "new"];
const SORTS: DeckSort[] = ["default", "due", "progress", "cards"];

const categoryName = (category: DeckCategory) => category.name;

/** Các bộ gom theo danh mục, mỗi danh mục một tiêu đề nhỏ. */
function CategoryGroups({ decks }: { decks: DeckSummary[] }) {
  const { t } = useTranslation("vocab");
  return (
    <div className="flex flex-col gap-6">
      {groupByCategory(decks).map(({ category, decks: inCategory }) => (
        <div key={category?.id ?? "other"}>
          <h3 className="mb-3 text-base font-bold text-text-muted">{category ? categoryName(category) : t("category.other")}</h3>
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

/** Ô tìm và bộ lọc: danh mục, tình trạng học, sắp xếp và lọc nhanh (miễn phí, có thẻ đến hạn). */
function Filters({
  decks,
  filter,
  sort,
  freeOnly,
  dueOnly,
  onChange,
  onSortChange,
  onFreeOnlyChange,
  onDueOnlyChange,
}: {
  decks: DeckSummary[];
  filter: DeckFilter;
  sort: DeckSort;
  freeOnly: boolean;
  dueOnly: boolean;
  onChange: (filter: DeckFilter) => void;
  onSortChange: (sort: DeckSort) => void;
  onFreeOnlyChange: (freeOnly: boolean) => void;
  onDueOnlyChange: (dueOnly: boolean) => void;
}) {
  const { t } = useTranslation("vocab");
  const categories = groupByCategory(decks).flatMap((group) => (group.category ? [{ ...group.category, count: group.decks.length }] : []));
  const hasOther = decks.some((deck) => !deck.category);
  const patch = (change: Partial<DeckFilter>) => onChange({ ...filter, ...change });

  return (
    <div className="flex flex-col gap-3" role="search" aria-label={t("filter.label")}>
      <div className="flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-center">
        <SearchInput
          className="w-full min-w-[220px] sm:flex-1"
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
        <SegmentedControl
          ariaLabel={t("filter.sorts.label")}
          value={sort}
          onChange={(value) => onSortChange(value as DeckSort)}
          options={SORTS.map((value) => ({ value, label: t(`filter.sorts.${value}`) }))}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {categories.length + (hasOther ? 1 : 0) > 1 && (
          <div role="group" aria-label={t("filter.category.label")} className="flex flex-wrap gap-2">
            <Chip active={filter.category === "all"} onClick={() => patch({ category: "all" })} count={decks.length}>
              {t("filter.category.all")}
            </Chip>
            {categories.map((category) => (
              <Chip
                key={category.id}
                active={filter.category === category.id}
                onClick={() => patch({ category: category.id })}
                count={category.count}
              >
                {categoryName(category)}
              </Chip>
            ))}
            {hasOther && (
              <Chip
                active={filter.category === OTHER_CATEGORY}
                onClick={() => patch({ category: OTHER_CATEGORY })}
                count={decks.filter((deck) => !deck.category).length}
              >
                {t("category.other")}
              </Chip>
            )}
          </div>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Chip active={freeOnly} onClick={() => onFreeOnlyChange(!freeOnly)}>
            <Icon name="lock-open" className="text-lg" />
            {t("filter.freeOnly")}
          </Chip>
          <Chip active={dueOnly} onClick={() => onDueOnlyChange(!dueOnly)}>
            <Icon name="flame" className="text-lg" />
            {t("filter.dueOnly")}
          </Chip>
        </div>
      </div>
    </div>
  );
}

/** Trang `/student/vocab` (UC-HT-01): tổng quan thẻ, tìm và lọc bộ, các bộ đang học và khám phá bộ hệ thống. */
export default function VocabPage() {
  const { t } = useTranslation("vocab");
  const query = useDecks();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab = tabParam === "review" || tabParam === "mine" ? tabParam : "decks";
  const reviewDeck = params.get("deck") ?? undefined;
  const [filter, setFilter] = useState<DeckFilter>(EMPTY_DECK_FILTER);
  const [sort, setSort] = useState<DeckSort>("default");
  const [freeOnly, setFreeOnly] = useState(false);
  const [dueOnly, setDueOnly] = useState(false);

  const decks = useMemo(() => query.data?.decks ?? [], [query.data]);
  const filtered = useMemo(() => {
    const base = filterDecks(decks, filter).filter((d) => {
      if (freeOnly && d.pro) return false;
      if (dueOnly && d.dueCount <= 0) return false;
      return true;
    });
    if (sort === "default") return base;
    const copy = [...base];
    if (sort === "due") {
      copy.sort((a, b) => b.dueCount - a.dueCount);
    } else if (sort === "progress") {
      copy.sort(
        (a, b) =>
          percentOf(learnedCount(b.progress), b.cardCount) -
          percentOf(learnedCount(a.progress), a.cardCount),
      );
    } else if (sort === "cards") {
      copy.sort((a, b) => b.cardCount - a.cardCount);
    }
    return copy;
  }, [decks, dueOnly, filter, freeOnly, sort]);

  const active = isDeckFilterActive(filter) || freeOnly || dueOnly || sort !== "default";
  const due = query.data?.overview.due ?? 0;

  const resetAllFilters = () => {
    setFilter(EMPTY_DECK_FILTER);
    setSort("default");
    setFreeOnly(false);
    setDueOnly(false);
  };

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
          <StatCard
            label={t("overview.due")}
            value={overview.due}
            hint={t("overview.dueHint")}
            tone="text-danger"
            icon="flame"
            active={dueOnly}
            onClick={() => {
              if (overview.due > 0 && !dueOnly) {
                setParams({ tab: "review" });
              } else {
                setDueOnly((v) => !v);
              }
            }}
          />
          <StatCard
            label={t("overview.learning")}
            value={overview.learning}
            hint={t("overview.learningHint")}
            tone="text-warning"
            icon="hourglass"
            active={filter.state === "learning"}
            onClick={() =>
              setFilter((curr) => ({ ...curr, state: curr.state === "learning" ? "all" : "learning" }))
            }
          />
          <StatCard
            label={t("overview.reviewing")}
            value={overview.reviewing}
            hint={t("overview.reviewingHint")}
            tone="text-info"
            icon="refresh-cw"
            active={dueOnly}
            onClick={() => setDueOnly((v) => !v)}
          />
          <StatCard
            label={t("overview.mastered")}
            value={overview.mastered}
            hint={t("overview.masteredHint")}
            tone="text-success"
            icon="circle-check"
          />
        </div>

        {decks.length === 0 ? (
          <EmptyState title={t("empty.title")} description={t("empty.desc")} />
        ) : (
          <>
            <Filters
              decks={decks}
              filter={filter}
              sort={sort}
              freeOnly={freeOnly}
              dueOnly={dueOnly}
              onChange={setFilter}
              onSortChange={setSort}
              onFreeOnlyChange={setFreeOnly}
              onDueOnlyChange={setDueOnly}
            />

            {active ? (
              <section aria-labelledby="vocab-results" aria-live="polite">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 id="vocab-results" className="flex items-center gap-2 text-xl font-bold">
                    <Icon name="search" className="h-5 w-5 text-fn-vocab" />
                    {t("filter.results", { count: filtered.length })}
                  </h2>
                  <Button variant="text" size="sm" leftIcon={<Icon name="x" />} onClick={resetAllFilters}>
                    {t("filter.clear")}
                  </Button>
                </div>
                {filtered.length === 0 ? (
                  <EmptyState
                    title={t("filter.noMatchTitle")}
                    description={t("filter.noMatchDesc")}
                    actionText={t("filter.clear")}
                    onAction={resetAllFilters}
                  />
                ) : sort !== "default" ? (
                  <div className={GRID}>
                    {filtered.map((deck) => (
                      <DeckCard key={deck.id} deck={deck} />
                    ))}
                  </div>
                ) : (
                  <CategoryGroups decks={filtered} />
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
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {started.map((deck) => (
                        <ContinueDeckCard key={deck.id} deck={deck} />
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
                  <CategoryGroups decks={decks} />
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
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:flex-nowrap">
        <div className="min-w-0 lg:flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-fn-vocab">
            <Icon name="layers" className="h-3.5 w-3.5" />
            {t("overline")}
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{t("title")}</h1>
          <p className="mt-1 text-text-muted">{t("subtitle")}</p>
        </div>

        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-3">
          <LoopiSay
            mood={due > 0 ? "correct" : "celebrate"}
            text={due > 0 ? t("say.due", { count: due }) : t("say.clear")}
          />
          <Link to="/student/review/daily" className={buttonClasses({ variant: "primary", size: "sm" })}>
            <Icon name="play" className="h-4 w-4" />
            {t("reviewToday")}
          </Link>
        </div>
      </header>
      <div className="mb-6">
        <SegmentedControl
          ariaLabel={t("tabs.label")}
          value={tab}
          onChange={(value) => setParams(value === "decks" ? {} : { tab: value })}
          options={[
            { value: "decks", label: t("tabs.decks"), icon: <Icon name="layers" className="h-4 w-4" /> },
            {
              value: "review",
              label: due > 0 ? `${t("tabs.review")} · ${due}` : t("tabs.review"),
              icon: <Icon name="refresh-cw" className="h-4 w-4" />,
            },
            { value: "mine", label: t("tabs.mine"), icon: <Icon name="folders" className="h-4 w-4" /> },
          ]}
        />
      </div>
      {tab === "review" && <ReviewPanel key={reviewDeck ?? ""} deck={reviewDeck} />}
      {tab === "mine" && <MyDecksPanel />}
      {tab === "decks" && body()}
    </section>
  );
}
