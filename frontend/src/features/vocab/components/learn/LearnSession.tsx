import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { ReportButton } from "@/features/report";
import { answerCard, firstOpenRound, isRoundDone, nextCard, roundScore, roundsOf, startRound } from "../../learn";
import type { AnswerDraft, LearnCard, LearnMode } from "../../types";
import ChoiceView from "./ChoiceView";
import FlashView from "./FlashView";
import GuessView from "./GuessView";
import { useImagePreload } from "./learnHooks";
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
  /** Hiện nút báo lỗi thẻ; tắt với bộ cá nhân vì không có giáo viên xử lý báo cáo (UC-HT-09). */
  canReport?: boolean;
  onAnswer: (answer: AnswerDraft) => void;
}

/**
 * Học một phần theo từng lượt (UC-HT-02, BR-HT-19): mở ở lượt đầu tiên còn thẻ Mới. Hàng đợi của lượt nằm ở đây, không ở
 * từng cách học, nên đổi cách học giữa chừng vẫn giữ các thẻ đã làm và áp dụng cách học mới từ thẻ hiện tại. Trả lời sai,
 * chọn "Không biết" hoặc Quên thì thẻ xuống cuối lượt để làm lại (BR-HT-14). Hết lượt thì hiện kết quả, rồi học lại, xem
 * từ, sang lượt sau hoặc sang phần tiếp theo.
 */
export default function LearnSession({
  mode,
  cards,
  partNumber,
  nextPartHref,
  deckHref,
  canReport = true,
  onAnswer,
}: LearnSessionProps) {
  const { t } = useTranslation("vocab");
  const rounds = roundsOf(cards);
  const [round, setRound] = useState(() => firstOpenRound(cards));
  const [state, setState] = useState(() => startRound(rounds[round] ?? []));
  const [lastMode, setLastMode] = useState(mode);
  const [showWords, setShowWords] = useState(false);
  const current = rounds[round] ?? [];
  // Nạp sẵn ảnh của thẻ hiện tại và vài thẻ kế tiếp để lúc lật thẻ ảnh đã có.
  useImagePreload(state.queue);

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
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-text-muted">
            {t("learn.round", { current: round + 1, total: rounds.length, count: current.length })}
          </p>
          {rounds.length > 1 && (
            <div className="flex items-center gap-1 border-l border-border pl-2">
              {rounds.map((rCards, idx) => {
                const active = idx === round;
                const rDone = rCards.every((c) => c.status !== "new");
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToRound(idx)}
                    className={`inline-flex h-6 cursor-pointer items-center gap-1 rounded-full px-2.5 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-primary text-white"
                        : rDone
                          ? "bg-success/15 text-success hover:bg-success/25"
                          : "bg-bg-elevated text-text-muted hover:bg-surface-hover hover:text-text"
                    }`}
                  >
                    {rDone && !active && <Icon name="check" className="h-3 w-3" />}
                    <span>{t("learn.roundTab", { n: idx + 1 })}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Icon name="book-open-text" />}
          onClick={() => setShowWords(true)}
        >
          {t("learn.done.words")}
        </Button>
      </div>
      {mode === "guess" && <GuessView key={key} {...viewProps} />}
      {mode === "flashcard" && <FlashView key={key} {...viewProps} />}
      {(mode === "quiz" || mode === "reverse_quiz") && <ChoiceView key={key} mode={mode} {...viewProps} />}
      {/* Báo cáo lỗi của thẻ đang học (UC-BC-01); giá trị hiện tại để chặn bản sửa giống hệt (BR-BC-06). */}
      {canReport && (
      <div className="mt-3 flex justify-end">
        <ReportButton
          targetType="card"
          targetId={card.id}
          label={card.word}
          current={{
            word: card.word,
            ipa_us: card.ipaUs,
            ipa_uk: card.ipaUk,
            meaning_vi: card.meaningVi,
            definition_en: card.definitionEn,
            definition_vi: card.definitionVi,
            example_en: card.exampleEn,
            example_vi: card.exampleVi,
          }}
        />
      </div>
      )}
    </div>
  );
}
