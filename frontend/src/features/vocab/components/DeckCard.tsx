import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import { buttonClasses } from "@/components/common/buttonStyles";
import type { DeckSummary } from "../types";
import { deckUrl, isStarted, learnedCount, percentOf } from "../utils";
import DeckProgressBar from "./DeckProgressBar";

/** Ảnh bìa bộ: ảnh `thumbnailUrl` phủ kín khung 16:9; chưa có ảnh (hoặc ảnh lỗi) thì hiện nền chuyển sắc và icon. */
function DeckThumb({ deck }: { deck: DeckSummary }) {
  const { t } = useTranslation("vocab");
  return (
    <div className="relative grid aspect-video place-items-center overflow-hidden bg-[linear-gradient(135deg,var(--fn-vocab-soft),transparent)] text-fn-vocab">
      <Icon name="layers" className="h-11 w-11 transition-transform duration-200 group-hover:scale-[1.08]" />
      {deck.thumbnailUrl && (
        <img
          src={deck.thumbnailUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      )}
      <span className="absolute left-2.5 top-2.5 flex gap-1.5">
        {deck.pro && (
          <Badge variant="pro" solid>
            <Icon name="crown" />
            {t("deck.pro")}
          </Badge>
        )}
      </span>
    </div>
  );
}

/**
 * Thẻ một bộ trong danh sách: ảnh bìa, tên, số thẻ và phần, tiến độ và nút mở bộ. Hiệu ứng nổi lên và quầng sáng khi di
 * chuột giống thẻ bài học (`LessonCard`); cả thẻ bấm được.
 */
export default function DeckCard({ deck }: { deck: DeckSummary }) {
  const { t } = useTranslation("vocab");
  const navigate = useNavigate();
  const started = isStarted(deck);
  const learned = learnedCount(deck.progress);
  const subtitle: string | null = null;
  const href = deckUrl(deck.id);

  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--primary)_65%,var(--border))] hover:shadow-[0_20px_45px_-15px_rgba(0,0,0,0.5),0_0_30px_color-mix(in_srgb,var(--primary)_40%,transparent),0_0_70px_color-mix(in_srgb,var(--primary)_25%,transparent)] focus-visible:outline-2 focus-visible:outline-primary"
      tabIndex={0}
      aria-label={deck.name}
      data-deck={deck.id}
      onClick={() => navigate(href)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          navigate(href);
        }
      }}
    >
      <DeckThumb deck={deck} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-bold">{deck.name}</h3>
          {subtitle && <p className="truncate text-[13px] text-text-muted">{subtitle}</p>}
        </div>
        <p className="text-[13px] text-text-muted">
          {t("deck.cards", { count: deck.cardCount })} · {t("deck.parts", { count: deck.groupCount })}
        </p>
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
          to={href}
          onClick={(e) => e.stopPropagation()}
          className={`${buttonClasses({ variant: started ? "primary" : "ghost", size: "sm" })} mt-auto`}
        >
          {started ? t("deck.continue") : t("deck.view")}
          <Icon name="arrow-right" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export function DeckCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="skeleton aspect-video bg-surface-hover" />
      <div className="flex flex-col gap-2.5 p-4">
        <div className="skeleton h-[18px] w-[75%] rounded-sm bg-surface-hover" />
        <div className="skeleton h-3.5 w-[45%] rounded-sm bg-surface-hover" />
        <div className="skeleton h-9 rounded-md bg-surface-hover" />
      </div>
    </div>
  );
}
