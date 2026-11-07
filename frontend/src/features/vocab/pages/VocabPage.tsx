import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import ErrorState from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import DeckCard from "../components/DeckCard";
import StatCard from "../components/StatCard";
import { useDecks } from "../hooks";
import { groupByCategory, isStarted } from "../utils";

const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

/** Trang `/student/vocab` (UC-VOCAB-03): tổng quan thẻ, các bộ đang học và khám phá bộ hệ thống. */
export default function VocabPage() {
  const { t, i18n } = useTranslation("vocab");
  const query = useDecks();

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
              <Skeleton key={i} className="h-[190px] rounded-lg" />
            ))}
          </div>
        </div>
      );
    }
    if (query.isError) {
      const offline = isAxiosError(query.error) && !query.error.response;
      return <ErrorState kind={offline ? "network" : "server"} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
    }

    const { overview, decks } = query.data;
    const started = decks.filter(isStarted);
    const vi = i18n.language.startsWith("vi");
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
              {groupByCategory(decks).map(({ category, decks: inCategory }) => (
                <div key={category?.slug ?? "other"}>
                  {category && (
                    <h3 className="mb-3 text-base font-bold text-text-muted">
                      {(vi ? category.nameVi : null) ?? category.name}
                    </h3>
                  )}
                  <div className={GRID}>
                    {inCategory.map((deck) => (
                      <DeckCard key={deck.id} deck={deck} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
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
      {body()}
    </section>
  );
}
