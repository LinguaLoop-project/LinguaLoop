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
      <Icon name="layers" className="h-11 w-11 transition-transform duration-300 group-hover:scale-[1.12]" />
      {deck.thumbnailUrl && (
        <img
          src={deck.thumbnailUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent_30%,rgba(255,255,255,0.18)_50%,transparent_70%)] transition-transform duration-700 ease-out group-hover:translate-x-full"
      />
      <span className="absolute left-2.5 top-2.5 flex gap-1.5">
        {deck.pro && (
          <Badge variant="pro" solid>
            <Icon name="crown" />
            {t("deck.pro")}
          </Badge>
        )}
        {deck.cefrLevel && (
          <Badge variant={deck.cefrLevel} solid>
            {deck.cefrLevel}
          </Badge>
        )}
      </span>
      {deck.dueCount > 0 && (
        <span className="absolute right-2.5 top-2.5 inline-flex h-6 items-center gap-1 rounded-full bg-danger px-2.5 text-xs font-bold tabular-nums text-white shadow-sm">
          <Icon name="flame" className="h-3.5 w-3.5" />
          {t("deck.dueBadge", { count: deck.dueCount })}
        </span>
      )}
    </div>
  );
}

/** Thẻ ngang nhỏ gọn cho mục "⚡ Đang học" (tránh lặp lại thẻ dọc lớn với mục "Khám phá bộ từ" bên dưới). */
export function ContinueDeckCard({ deck }: { deck: DeckSummary }) {
  const { t } = useTranslation("vocab");
  const navigate = useNavigate();
  const learned = learnedCount(deck.progress);
  const pct = percentOf(learned, deck.cardCount);
  const href = deckUrl(deck.id);

  return (
    <article
      tabIndex={0}
      aria-label={deck.name}
      onClick={() => navigate(href)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          navigate(href);
        }
      }}
      className="group grid cursor-pointer grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-border bg-surface p-3.5 shadow-[var(--shadow-card)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--primary)_65%,var(--border))] hover:shadow-[0_20px_45px_-15px_rgba(0,0,0,0.5),0_0_30px_color-mix(in_srgb,var(--primary)_40%,transparent)] focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-sm bg-[linear-gradient(135deg,var(--fn-vocab-soft),transparent)] text-fn-vocab">
        <Icon name="layers" className="h-7 w-7" />
        {deck.thumbnailUrl && (
          <img
            src={deck.thumbnailUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-bold leading-snug">{deck.name}</h3>
          {deck.dueCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-bold tabular-nums text-danger">
              <Icon name="flame" className="h-3 w-3" />
              {t("deck.dueBadge", { count: deck.dueCount })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
          <span>
            {t("deck.mastered", { mastered: deck.progress.mastered, total: deck.cardCount })} · {t("deck.parts", { count: deck.groupCount })}
          </span>
          <span className="font-semibold tabular-nums text-text">{t("deck.percent", { percent: pct })}</span>
        </div>
        <DeckProgressBar progress={deck.progress} total={deck.cardCount} />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {deck.dueCount > 0 && (
          <Link
            to={`/student/vocab?tab=review&deck=${encodeURIComponent(deck.id)}`}
            onClick={(e) => e.stopPropagation()}
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            <Icon name="refresh-cw" className="h-3.5 w-3.5" />
            {t("deck.reviewNow", { count: deck.dueCount })}
          </Link>
        )}
        <Link
          to={href}
          onClick={(e) => e.stopPropagation()}
          className={buttonClasses({ variant: "primary", size: "sm" })}
        >
          {t("deck.continue")}
          <Icon name="arrow-right" className="h-4 w-4" />
        </Link>
      </div>
    </article>
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
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)] transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:z-20 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)] before:opacity-0 before:transition-opacity before:duration-300 hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--fn-vocab)_70%,var(--border))] hover:shadow-[0_22px_48px_-14px_rgba(0,0,0,0.55),0_0_32px_color-mix(in_srgb,var(--fn-vocab)_38%,transparent),0_0_72px_color-mix(in_srgb,var(--fn-vocab)_20%,transparent)] hover:before:opacity-100 focus-visible:outline-2 focus-visible:outline-primary"
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
          <h3 className="truncate text-[17px] font-bold transition-colors duration-200 group-hover:text-fn-vocab">{deck.name}</h3>
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
        <div className="mt-auto flex items-center gap-2">
          <Link
            to={href}
            onClick={(e) => e.stopPropagation()}
            className={`${buttonClasses({ variant: started ? "primary" : "ghost", size: "sm" })} flex-1`}
          >
            {started ? t("deck.continue") : t("deck.view")}
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
          {deck.dueCount > 0 && (
            <Link
              to={`/student/vocab?tab=review&deck=${encodeURIComponent(deck.id)}`}
              onClick={(e) => e.stopPropagation()}
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              <Icon name="refresh-cw" className="h-3.5 w-3.5" />
              {t("deck.reviewNow", { count: deck.dueCount })}
            </Link>
          )}
        </div>
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
