import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import { buttonClasses } from "@/components/common/buttonStyles";
import { answerCard, isRoundDone, nextCard, roundScore, startRound } from "../../learn";
import type { AnswerDraft, ReviewQueue } from "../../types";
import FlashView from "../learn/FlashView";
import UnsentNotice from "../learn/UnsentNotice";

interface ReviewSessionProps {
  queue: ReviewQueue;
  onAnswer: (answer: AnswerDraft) => void;
  /** Mở lượt ôn tiếp theo cho các thẻ đến hạn còn lại. */
  onContinue: () => void;
}

/**
 * Một lượt ôn (UC-HT-03): hàng đợi chung với Flashcard. Chấm Quên thì thẻ xuống cuối lượt và hiện lại ngay trong lượt
 * (BR-HT-14). Hết lượt thì hiện số thẻ nhớ ngay lần đầu, số thẻ phải ôn lại và "Ôn tiếp" nếu vẫn còn thẻ đến hạn.
 */
export default function ReviewSession({ queue, onAnswer, onContinue }: ReviewSessionProps) {
  const { t } = useTranslation("vocab");
  const [state, setState] = useState(() => startRound(queue.cards));

  const handleAnswer = (answer: AnswerDraft) => {
    onAnswer(answer);
    const remembered = (answer.quality ?? 0) >= 3;
    setState((s) => nextCard(answerCard(s, remembered)));
  };

  const heading = queue.deck ? t("review.deckTitle", { name: queue.deck.name }) : t("review.title");

  if (isRoundDone(state)) {
    const score = roundScore(state);
    const more = Math.max(0, queue.dueTotal - queue.cards.length);
    return (
      <div className="flex flex-col items-center rounded-lg border-2 border-primary bg-surface p-10 text-center shadow-[var(--shadow-card)]">
        <Mascot mood="celebrate" size={120} alt="" />
        <h2 className="mt-4 font-display text-3xl font-bold">{t("review.doneTitle")}</h2>
        <p className="mt-1.5 text-text-muted">{t("review.doneSubtitle", { count: score.total })}</p>
        <p className="mt-1 text-sm text-text-muted">{t("review.score", { right: score.right, total: score.total })}</p>
        {score.redone > 0 && <p className="text-sm text-text-muted">{t("review.redone", { count: score.redone })}</p>}
        {more > 0 && <p className="text-sm text-text-muted">{t("review.continueHint", { count: more })}</p>}
        <UnsentNotice />
        <div className="mt-6 flex flex-wrap justify-center gap-2">
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
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-text-muted">
        <b className="text-text">{heading}</b>
        <span>
          {t("review.queueInfo", { count: queue.cards.length })}
          {queue.dueTotal > queue.cards.length && ` · ${t("review.more", { count: queue.dueTotal - queue.cards.length })}`}
        </span>
      </div>
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
