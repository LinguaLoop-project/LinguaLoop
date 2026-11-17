import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import { buttonClasses } from "@/components/common/buttonStyles";
import type { RoundSummary } from "@/features/vocab/components/review/ReviewSession";
import { summarizeSentences } from "../flow";
import { useScrollTopOn } from "../hooks";
import type { SentenceOutcome } from "../types";

export interface ReviewSummaryProps {
  /** Kết quả phần thẻ; null nếu phiên không có phần thẻ. */
  cards: RoundSummary | null;
  /** Kết quả phần câu; rỗng nếu phiên không có phần câu hoặc chưa ôn câu nào. */
  sentences: readonly SentenceOutcome[];
  /** Học viên thoát giữa chừng: tiêu đề báo phần đã làm, kết quả vẫn được giữ (3a). */
  exited: boolean;
  /** Số thẻ còn đến hạn sau phiên; lớn hơn 0 thì có "Ôn tiếp" (chỉ ở phiên hằng ngày). */
  moreCards?: number;
  onContinueCards?: () => void;
  /** Có thì hiện "Ôn thêm" lấy nhóm câu kế tiếp (chỉ ở Ôn câu riêng). */
  onMoreSentences?: () => void;
}

/** Tổng kết chung của một phiên ôn: kết quả ôn thẻ, kết quả ôn câu và đường đi tiếp. */
export default function ReviewSummary({ cards, sentences, exited, moreCards = 0, onContinueCards, onMoreSentences }: ReviewSummaryProps) {
  const { t } = useTranslation("review");
  useScrollTopOn("summary");
  const stats = summarizeSentences(sentences);
  const nothingDone = (cards?.total ?? 0) === 0 && stats.reviewed === 0;

  return (
    <div className="flex flex-col items-center rounded-lg border-2 border-primary bg-surface p-8 text-center shadow-[var(--shadow-card)] sm:p-10">
      <Mascot mood={exited || nothingDone ? "encourage" : "celebrate"} size={120} alt="" />
      <h2 className="mt-4 font-display text-3xl font-bold">{exited ? t("summary.exitedTitle") : t("summary.doneTitle")}</h2>
      <p className="mt-1.5 text-text-muted">{exited ? t("summary.exitedSubtitle") : t("summary.doneSubtitle")}</p>

      <div className="mt-6 grid w-full max-w-md gap-3 text-left">
        {cards && (
          <div className="rounded-md border border-border bg-surface-hover px-4 py-3">
            <b className="flex items-center gap-2">
              <Icon name="layers" className="text-fn-vocab" />
              {t("summary.cards")}
            </b>
            <p className="mt-1 text-sm text-text-muted">
              {cards.total > 0 ? t("summary.cardsScore", { right: cards.right, total: cards.total }) : t("summary.cardsNone")}
            </p>
            {cards.redone > 0 && <p className="text-sm text-text-muted">{t("summary.cardsRedone", { count: cards.redone })}</p>}
          </div>
        )}
        {(sentences.length > 0 || !cards) && (
          <div className="rounded-md border border-border bg-surface-hover px-4 py-3">
            <b className="flex items-center gap-2">
              <Icon name="mic" className="text-fn-shadowing" />
              {t("summary.sentences")}
            </b>
            {stats.reviewed > 0 ? (
              <p className="mt-1 text-sm text-text-muted">{t("summary.sentencesScore", { count: stats.reviewed, average: stats.average })}</p>
            ) : (
              <p className="mt-1 text-sm text-text-muted">{t("summary.sentencesNone")}</p>
            )}
            {stats.skipped > 0 && <p className="text-sm text-text-muted">{t("summary.sentencesSkipped", { count: stats.skipped })}</p>}
            {sentences.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {sentences.map((outcome) => (
                  <li key={`${outcome.mode}-${outcome.sentenceId}`} className="flex items-center justify-between gap-2">
                    <span className="text-text-muted">{t(`mode.${outcome.mode}`)}</span>
                    <b>{outcome.skipped || outcome.score === null ? t("summary.skipped") : Math.round(outcome.score)}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {moreCards > 0 && <p className="mt-4 text-sm text-text-muted">{t("summary.moreCards", { count: moreCards })}</p>}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/student" className={buttonClasses({ variant: moreCards > 0 || onMoreSentences ? "ghost" : "primary" })}>
          {t("summary.backToToday")}
        </Link>
        {moreCards > 0 && onContinueCards && (
          <Button rightIcon={<Icon name="arrow-right" />} onClick={onContinueCards}>
            {t("summary.continueCards")}
          </Button>
        )}
        {onMoreSentences && (
          <Button rightIcon={<Icon name="arrow-right" />} onClick={onMoreSentences}>
            {t("summary.moreSentences")}
          </Button>
        )}
      </div>
    </div>
  );
}
