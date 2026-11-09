import { useState } from "react";
import { useTranslation } from "react-i18next";
import { firstOpenRound, roundsOf } from "../../learn";
import type { LearnCard, LearnMode } from "../../types";
import ChoiceView from "./ChoiceView";
import FlashView from "./FlashView";
import GuessView from "./GuessView";
import RepeatView from "./RepeatView";
import RoundDone from "./RoundDone";
import WordsList from "./WordsList";
import type { AnswerDraft, RoundScore } from "./shared";

interface Finished {
  mode: LearnMode;
  round: number;
  run: number;
  score: RoundScore;
}

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
 * Học một phần theo từng lượt (UC-HT-02): mở ở lượt đầu tiên còn thẻ Mới, đổi cách học thì học lại lượt đó từ đầu và
 * câu trả lời đã gửi vẫn giữ. Hết lượt thì hiện kết quả, rồi học lại, xem từ, sang lượt sau hoặc sang phần tiếp theo.
 */
export default function LearnSession({ mode, cards, partNumber, nextPartHref, deckHref, onAnswer }: LearnSessionProps) {
  const { t } = useTranslation("vocab");
  const rounds = roundsOf(cards);
  const [round, setRound] = useState(() => firstOpenRound(cards));
  const [run, setRun] = useState(0);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [showWords, setShowWords] = useState(false);
  const current = rounds[round] ?? [];

  const done = finished && finished.mode === mode && finished.round === round && finished.run === run ? finished : null;
  const goToRound = (next: number) => {
    setRound(next);
    setRun((value) => value + 1);
    setFinished(null);
    setShowWords(false);
  };

  if (showWords) return <WordsList cards={current} round={round + 1} onBack={() => setShowWords(false)} />;

  if (done) {
    return (
      <RoundDone
        mode={mode}
        round={round + 1}
        partNumber={partNumber}
        score={done.score}
        onRestart={() => goToRound(round)}
        onShowWords={() => setShowWords(true)}
        onNextRound={round + 1 < rounds.length ? () => goToRound(round + 1) : null}
        nextPartHref={nextPartHref}
        deckHref={deckHref}
      />
    );
  }

  const viewProps = {
    cards: current,
    pool: cards,
    onAnswer,
    onFinish: (score: RoundScore) => setFinished({ mode, round, run, score }),
  };
  const key = `${mode}-${round}-${run}`;

  return (
    <div>
      <p className="mb-3 text-sm text-text-muted">
        {t("learn.round", { current: round + 1, total: rounds.length, count: current.length })}
      </p>
      {mode === "guess" && <GuessView key={key} {...viewProps} />}
      {mode === "flashcard" && <FlashView key={key} {...viewProps} />}
      {(mode === "quiz" || mode === "reverse_quiz") && <ChoiceView key={key} mode={mode} {...viewProps} />}
      {mode === "repeat" && <RepeatView key={key} {...viewProps} />}
    </div>
  );
}
