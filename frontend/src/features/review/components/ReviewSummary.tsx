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
  /** Số thẻ còn đến hạn sau phiên; lớn hơn 0 thì có "Ôn thêm" (chỉ ở phiên hằng ngày). */
  moreCards?: number;
  /** Đã ôn đủ Định mức ôn ngày: ghi rõ rằng phần còn lại là tùy chọn (chỉ ở phiên hằng ngày). */
  quotaDone?: boolean;
  onContinueCards?: () => void;
  /** Có thì hiện "Ôn thêm" lấy nhóm câu kế tiếp (chỉ ở Ôn câu riêng). */
  onMoreSentences?: () => void;
  /** Có thì hiện nút "Thử lại" cho câu vừa luyện (khi ôn lẻ 1 câu). */
  onRetrySentence?: () => void;
  /** Đích quay về ở nút phụ (mặc định `/student`). */
  backTo?: string;
  /** Nhãn nút quay về (mặc định `t("summary.backToToday")`). */
  backLabel?: string;
}

/** Tổng kết chung của một phiên ôn: kết quả ôn thẻ, kết quả ôn câu và đường đi tiếp. */
export default function ReviewSummary({
  cards,
  sentences,
  exited,
  moreCards = 0,
  quotaDone = false,
  onContinueCards,
  onMoreSentences,
  onRetrySentence,
  backTo = "/student",
  backLabel,
}: ReviewSummaryProps) {
  const { t } = useTranslation("review");
  useScrollTopOn("summary");
  const stats = summarizeSentences(sentences);
  const nothingDone = (cards?.total ?? 0) === 0 && stats.reviewed === 0;

  return (
    <div className="flex flex-col items-center rounded-lg border-2 border-primary bg-surface p-8 text-center shadow-[var(--shadow-card)] sm:p-10">
      <Mascot mood={exited || nothingDone ? "encourage" : "celebrate"} size={120} alt="" />
      <h2 className="mt-4 font-display text-3xl font-bold">{exited ? t("summary.exitedTitle") : t("summary.doneTitle")}</h2>
      <p className="mt-1.5 text-text-muted">{exited ? t("summary.exitedSubtitle") : t("summary.doneSubtitle")}</p>

      <div className="mt-6 grid w-full max-w-md gap-3.5 text-left">
        {cards && (
          <div className="rounded-xl border border-border bg-bg-elevated px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <b className="flex items-center gap-2 text-text">
                <Icon name="layers" className="text-fn-vocab" />
                {t("summary.cards")}
              </b>
              {cards.total > 0 && (
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary-text">
                  {Math.round((cards.right / cards.total) * 100)}%
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-text-muted">
              {cards.total > 0 ? t("summary.cardsScore", { right: cards.right, total: cards.total }) : t("summary.cardsNone")}
            </p>
            {cards.redone > 0 && <p className="mt-0.5 text-sm text-text-muted">{t("summary.cardsRedone", { count: cards.redone })}</p>}
          </div>
        )}
        {(sentences.length > 0 || !cards) && (
          <div className="rounded-xl border border-border bg-bg-elevated px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <b className="flex items-center gap-2 text-text">
                <Icon name="mic" className="text-fn-shadowing" />
                {t("summary.sentences")}
              </b>
              {stats.reviewed > 0 && stats.average !== null && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                    stats.average >= 80
                      ? "bg-success/15 text-success"
                      : stats.average >= 50
                        ? "bg-warning/15 text-warning"
                        : "bg-danger/15 text-danger"
                  }`}
                >
                  {t("summary.averageBadge", { average: stats.average })}
                </span>
              )}
            </div>
            {stats.reviewed > 0 ? (
              <p className="mt-1.5 text-sm text-text-muted">{t("summary.sentencesScore", { count: stats.reviewed, average: stats.average })}</p>
            ) : (
              <p className="mt-1.5 text-sm text-text-muted">{t("summary.sentencesNone")}</p>
            )}
            {stats.skipped > 0 && <p className="mt-0.5 text-sm text-text-muted">{t("summary.sentencesSkipped", { count: stats.skipped })}</p>}
            {sentences.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5 border-t border-border pt-2.5 text-sm">
                {sentences.map((outcome, idx) => {
                  const score = outcome.skipped || outcome.score === null ? null : Math.round(outcome.score);
                  const scoreTone =
                    score === null
                      ? "bg-surface text-text-muted"
                      : score >= 80
                        ? "bg-success/15 text-success"
                        : score >= 50
                          ? "bg-warning/15 text-warning"
                          : "bg-danger/15 text-danger";
                  return (
                    <li
                      key={`${outcome.mode}-${outcome.sentenceId}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-1.5"
                    >
                      <span className="flex items-center gap-1.5 text-text-muted">
                        <Icon
                          name={outcome.mode === "dictation" ? "headphones" : "mic"}
                          className={`h-3.5 w-3.5 ${
                            outcome.mode === "dictation" ? "text-fn-dictation" : "text-fn-shadowing"
                          }`}
                        />
                        <span>#{idx + 1}</span>
                        <span>{t(`mode.${outcome.mode}`)}</span>
                      </span>
                      <b className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${scoreTone}`}>
                        {score === null ? t("summary.skipped") : score}
                      </b>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {quotaDone && <p className="mt-4 text-sm font-semibold text-success">{t("summary.quotaDone")}</p>}
      {moreCards > 0 && <p className="mt-4 text-sm text-text-muted">{t("summary.moreCards", { count: moreCards })}</p>}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to={backTo} className={buttonClasses({ variant: moreCards > 0 || onMoreSentences || onRetrySentence ? "ghost" : "primary" })}>
          {backLabel ?? t("summary.backToToday")}
        </Link>
        {onRetrySentence && (
          <Button variant="secondary" leftIcon={<Icon name="rotate-ccw" />} onClick={onRetrySentence}>
            {t("retry")}
          </Button>
        )}
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
