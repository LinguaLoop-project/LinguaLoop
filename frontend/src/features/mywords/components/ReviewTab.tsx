import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { LEVEL_CHIP, REVIEW_ADD_BELOW, SCORE_BADGE, scoreTone } from "@/features/dictation/utils";
import { useResolveReview, useReviewSentences } from "../hooks";
import type { ReviewSentence } from "../types";
import { practiceUrl } from "../links";
import { dateFormatter, isNetworkError } from "../utils";
import ListState from "./ListState";

function ReviewRow({ item }: { item: ReviewSentence }) {
  const { t, i18n } = useTranslation("mywords");
  const navigate = useNavigate();
  const resolve = useResolveReview();
  const tone = item.lastScore === null ? null : scoreTone(item.lastScore);

  const onResolve = () =>
    resolve.mutate(item.sentenceId, {
      onSuccess: () => toast(t("review.resolved"), { icon: "check" }),
      onError: (error) => toast(isNetworkError(error) ? t("offline") : t("review.resolveFailed"), { icon: "circle-alert" }),
    });

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-[17px] font-medium">“{item.text}”</span>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex h-[22px] items-center gap-1 rounded-full border border-border px-2 text-[11px]">
            <Icon name="headphones" className="h-3.5 w-3.5" />
            {t("review.mode")}
          </span>
          <span className="inline-flex h-[22px] items-center rounded-full border border-border px-2 text-[11px]">
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
          <Link to={`/student/lessons/${item.lessonSlug}`} className="inline-flex items-center gap-1 text-text-muted hover:text-text">
            <Icon name="play" className="h-3.5 w-3.5" />
            {item.lessonTitle}
          </Link>
          <time dateTime={item.addedAt} className="text-text-muted">
            · {dateFormatter(i18n.language).format(new Date(item.addedAt))}
          </time>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" isLoading={resolve.isPending} leftIcon={<Icon name="check" />} onClick={onResolve}>
          {t("review.resolve")}
        </Button>
        <Button size="sm" onClick={() => navigate(practiceUrl(item.lessonSlug, item.sentenceId, { redo: true }))}>
          {t("review.practice")}
        </Button>
      </div>
    </li>
  );
}

/** Tab "Câu cần ôn": các câu nghe chép làm kém hoặc đã ghim, điểm thấp trước. */
export default function ReviewTab() {
  const { t } = useTranslation("mywords");
  const query = useReviewSentences();
  const items = query.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 rounded-md border border-border bg-bg-elevated px-3.5 py-3 text-sm text-text-muted">
        <Icon name="info" className="mt-0.5 h-4 w-4 flex-none" />
        <span>{t("review.tip", { low: REVIEW_ADD_BELOW, high: 80 })}</span>
      </div>
      <ListState query={query} skeletonRows={3}>
        {items.length === 0 ? (
          <EmptyState title={t("review.emptyTitle")} description={t("review.emptyDesc")} />
        ) : (
          <>
            <p className="text-sm text-text-muted">{t("review.count", { count: items.length })}</p>
            <ul className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]">
              {items.map((item) => (
                <ReviewRow key={item.sentenceId} item={item} />
              ))}
            </ul>
          </>
        )}
      </ListState>
    </div>
  );
}
