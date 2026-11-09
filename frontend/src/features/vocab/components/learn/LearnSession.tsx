import { useState } from "react";
import { useTranslation } from "react-i18next";
import { answerCard, firstOpenRound, isRoundDone, nextCard, roundScore, roundsOf, startRound } from "../../learn";
import type { AnswerDraft, LearnCard, LearnMode } from "../../types";
import ChoiceView from "./ChoiceView";
import FlashView from "./FlashView";
import GuessView from "./GuessView";
import RoundDone from "./RoundDone";
import WordsList from "./WordsList";

export interface LearnSessionProps {
  mode: LearnMode;
  /** Mọi thẻ của phần; chia thành các lượt 10 thẻ. */
  cards: LearnCard[];
  /** Số phần trên đường dẫn, tính từ 1. */
  partNumber: number;
  nextPartHref: string | null;
  deckHref: string;
  onAnswer: (answer: AnswerDraft) => void;
}

/**
 * Học một phần theo từng lượt (UC-HT-02, BR-HT-19): mở ở lượt đầu tiên còn thẻ Mới. Hàng đợi của lượt nằm ở đây, không ở
 * từng cách học, nên đổi cách học giữa chừng vẫn giữ các thẻ đã làm và áp dụng cách học mới từ thẻ hiện tại. Trả lời sai,
 * chọn "Không biết" hoặc Quên thì thẻ xuống cuối lượt để làm lại (BR-HT-14). Hết lượt thì hiện kết quả, rồi học lại, xem
 * từ, sang lượt sau hoặc sang phần tiếp theo.
 */
export default function LearnSession({ mode, cards, partNumber, nextPartHref, deckHref, onAnswer }: LearnSessionProps) {
  const { t } = useTranslation("vocab");
  const rounds = roundsOf(cards);
  const [round, setRound] = useState(() => firstOpenRound(cards));
  const [state, setState] = useState(() => startRound(rounds[round] ?? []));
  const [lastMode, setLastMode] = useState(mode);
  const [showWords, setShowWords] = useState(false);
  const current = rounds[round] ?? [];

  // Đổi cách học khi thẻ hiện tại đã trả lời và đang chờ "Tiếp" thì cách học mới bắt đầu từ thẻ kế tiếp; thẻ chưa trả lời
  // giữ nguyên và chuyển sang cách học mới ngay (UC-HT-02, luồng 3a).
  if (lastMode !== mode) {
    setLastMode(mode);
    setState(nextCard(state));
  }

  const goToRound = (next: number) => {
    setRound(next);
    setState(startRound(rounds[next] ?? []));
    setShowWords(false);
  };

  const handleAnswer = (answer: AnswerDraft) => {
    onAnswer(answer);
    const remembered = answer.quality !== undefined ? answer.quality >= 3 : answer.correct;
    setState((s) => {
      const answered = answerCard(s, remembered);
      // Flashcard chấm xong là sang thẻ tiếp ngay; các cách học khác hiện kết quả rồi chờ "Tiếp".
      return answer.mode === "flashcard" ? nextCard(answered) : answered;
    });
  };

  if (showWords) return <WordsList cards={current} round={round + 1} onBack={() => setShowWords(false)} />;

  if (isRoundDone(state)) {
    return (
      <RoundDone
        round={round + 1}
        partNumber={partNumber}
        mode={mode}
        score={roundScore(state)}
        onRestart={() => goToRound(round)}
        onShowWords={() => setShowWords(true)}
        onNextRound={round + 1 < rounds.length ? () => goToRound(round + 1) : null}
        nextPartHref={nextPartHref}
        deckHref={deckHref}
      />
    );
  }

  const card = state.queue[0];
  const viewProps = {
    card,
    pool: cards,
    done: state.total - state.queue.length,
    total: state.total,
    onAnswer: handleAnswer,
    onNext: () => setState((s) => nextCard(s)),
  };
  const key = `${mode}-${card.id}-${state.turn}`;

  return (
    <div>
      <p className="mb-3 text-sm text-text-muted">
        {t("learn.round", { current: round + 1, total: rounds.length, count: current.length })}
      </p>
      {mode === "guess" && <GuessView key={key} {...viewProps} />}
      {mode === "flashcard" && <FlashView key={key} {...viewProps} />}
      {(mode === "quiz" || mode === "reverse_quiz") && <ChoiceView key={key} mode={mode} {...viewProps} />}
    </div>
  );
}
