import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import { buttonClasses } from "@/components/common/buttonStyles";
import type { DeckSummary } from "../types";
import { deckUrl, isStarted, learnedCount, percentOf } from "../utils";
import DeckProgressBar from "./DeckProgressBar";

/** Thẻ một bộ trong danh sách: tên, mức CEFR, nhãn Pro, số thẻ và phần, tiến độ và nút mở bộ. */
export default function DeckCard({ deck }: { deck: DeckSummary }) {
  const { t, i18n } = useTranslation("vocab");
  const started = isStarted(deck);
  const learned = learnedCount(deck.progress);
  const subtitle = i18n.language.startsWith("vi") ? deck.nameVi : null;

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-md bg-fn-vocab-soft text-fn-vocab">
          <Icon name="layers" className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[17px] font-bold">{deck.name}</h3>
          {subtitle && <p className="truncate text-[13px] text-text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
        {deck.cefrLevel && <Badge variant={deck.cefrLevel}>{deck.cefrLevel}</Badge>}
        {deck.pro && <Badge variant="pro">{t("deck.pro")}</Badge>}
        <span>
          {t("deck.cards", { count: deck.cardCount })} · {t("deck.parts", { count: deck.groupCount })}
        </span>
      </div>
      {started && (
        <div className="flex flex-col gap-1.5">
          <DeckProgressBar progress={deck.progress} total={deck.cardCount} />
          <div className="flex justify-between text-[13px] text-text-muted">
            <span>{t("deck.mastered", { mastered: deck.progress.mastered, total: deck.cardCount })}</span>
            <span>{t("deck.percent", { percent: percentOf(learned, deck.cardCount) })}</span>
          </div>
        </div>
      )}
      <Link
        to={deckUrl(deck.slug)}
        className={`${buttonClasses({ variant: started ? "primary" : "ghost", size: "sm" })} mt-auto`}
      >
        {started ? t("deck.continue") : t("deck.view")}
        <Icon name="arrow-right" className="h-4 w-4" />
      </Link>
    </article>
  );
}
