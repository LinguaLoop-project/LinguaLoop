import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import { buttonClasses } from "@/components/common/buttonStyles";
import { answerCard, isRoundDone, nextCard, roundScore, startRound } from "../../learn";
import type { AnswerDraft, LearnCard, ReviewQueue } from "../../types";
import FlashView from "../learn/FlashView";
import { useImagePreload } from "../learn/learnHooks";
import UnsentNotice from "../learn/UnsentNotice";

export type RoundSummary = ReturnType<typeof roundScore>;

interface ReviewSessionProps {
  queue: ReviewQueue;
  onAnswer: (answer: AnswerDraft) => void;
  /** Mở lượt ôn tiếp theo cho các thẻ đến hạn còn lại. */
  onContinue: () => void;
  /**
   * Chạy như một chặng của phiên Ôn tập hằng ngày (UC-HT-05): không hiện màn kết thúc riêng, hết lượt thì gọi
   * `onComplete` để khung ngoài chuyển thẳng sang chặng kế; `onExit` là nút "Thoát" giữa chừng (kết quả đã chấm vẫn giữ).
   */
  embedded?: { onComplete: (score: RoundSummary) => void; onExit: (score: RoundSummary) => void };
  /** Ghi chú hiện phía trên thẻ đang ôn, vd nhãn "Từ mới" hay "Củng cố" của khung bài ngày (BR-HT-29). */
  renderNote?: (card: LearnCard) => ReactNode;
}

/**
 * Một lượt ôn (UC-HT-03): hàng đợi chung với Flashcard. Chấm Quên thì thẻ xuống cuối lượt và hiện lại ngay trong lượt
 * (BR-HT-14). Hết lượt thì hiện số thẻ nhớ ngay lần đầu, số thẻ phải ôn lại và "Ôn tiếp" nếu vẫn còn thẻ đến hạn.
 */
export default function ReviewSession({ queue, onAnswer, onContinue, embedded, renderNote }: ReviewSessionProps) {
  const { t } = useTranslation("vocab");
  const [state, setState] = useState(() => startRound(queue.cards));
  const completed = useRef(false);
  const done = isRoundDone(state);
  const onComplete = embedded?.onComplete;
  // Nạp sẵn ảnh của thẻ hiện tại và vài thẻ kế tiếp để lúc lật thẻ ảnh đã có.
  useImagePreload(state.queue);

  useEffect(() => {
    if (!done || !onComplete || completed.current) return;
    completed.current = true;
    onComplete(roundScore(state));
  }, [done, onComplete, state]);

  const handleAnswer = (answer: AnswerDraft) => {
    onAnswer(answer);
    const remembered = (answer.quality ?? 0) >= 3;
    setState((s) => nextCard(answerCard(s, remembered)));
  };

  const heading = queue.deck ? t("review.deckTitle", { name: queue.deck.name }) : t("review.title");

  if (done && embedded) return null;

  if (done) {
    const score = roundScore(state);
    const more = Math.max(0, queue.dueTotal - queue.cards.length);
    const accuracy = score.total > 0 ? Math.round((score.right / score.total) * 100) : 100;
    return (
      <div className="flex flex-col items-center rounded-xl border-2 border-primary bg-surface p-8 text-center shadow-[var(--shadow-card)] sm:p-10">
        <Mascot mood="celebrate" size={120} alt="" />
        <h2 className="mt-4 font-display text-3xl font-bold">{t("review.doneTitle")}</h2>
        <p className="mt-1.5 text-text-muted">{t("review.doneSubtitle", { count: score.total })}</p>

        <div className="mt-5 grid w-full max-w-md grid-cols-3 gap-2.5">
          <div className="rounded-lg border border-border bg-bg-elevated p-3">
            <div className="font-display text-2xl font-bold tabular-nums text-text">{score.total}</div>
            <div className="text-xs text-text-muted">{t("review.stats.reviewed")}</div>
          </div>
          <div className="rounded-lg border border-border bg-bg-elevated p-3">
            <div className="font-display text-2xl font-bold tabular-nums text-success">{score.right}</div>
            <div className="text-xs text-text-muted">{t("review.stats.first")}</div>
          </div>
          <div className="rounded-lg border border-border bg-bg-elevated p-3">
            <div className="font-display text-2xl font-bold tabular-nums text-primary-text">{accuracy}%</div>
            <div className="text-xs text-text-muted">{t("review.stats.accuracy")}</div>
          </div>
        </div>

        <p className="mt-4 text-sm text-text-muted">{t("review.score", { right: score.right, total: score.total })}</p>
        {score.redone > 0 && <p className="text-sm text-text-muted">{t("review.redone", { count: score.redone })}</p>}
        {more > 0 && <p className="mt-1 text-sm font-medium text-primary-text">{t("review.continueHint", { count: more })}</p>}
        <UnsentNotice />
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link to="/student/vocab" className={buttonClasses({ variant: more > 0 ? "ghost" : "primary" })}>
            {t("review.backToDecks")}
          </Link>
          {more > 0 && (
            <Button rightIcon={<Icon name="arrow-right" />} onClick={onContinue}>
              {t("review.continue")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const card = state.queue[0];
  const note = renderNote?.(card);
  return (
    <div>
      {!embedded && (
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-muted shadow-sm">
          <b className="flex items-center gap-2 text-text">
            <Icon name="layers" className="h-4 w-4 text-fn-vocab" />
            {heading}
          </b>
          <span className="rounded-full bg-bg-elevated px-2.5 py-0.5 text-xs font-medium">
            {t("review.queueInfo", { count: queue.cards.length })}
            {queue.dueTotal > queue.cards.length && ` · ${t("review.more", { count: queue.dueTotal - queue.cards.length })}`}
          </span>
        </div>
      )}
      {embedded && (
        <div className="mb-3 flex justify-end">
          <Button variant="ghost" size="sm" leftIcon={<Icon name="log-out" />} onClick={() => embedded.onExit(roundScore(state))}>
            {t("review.exit")}
          </Button>
        </div>
      )}
      {note && <div className="mb-2.5">{note}</div>}
      <FlashView
        key={`${card.id}-${state.turn}`}
        card={card}
        pool={queue.cards}
        done={state.total - state.queue.length}
        total={state.total}
        onAnswer={handleAnswer}
        onNext={() => undefined}
      />
    </div>
  );
}
