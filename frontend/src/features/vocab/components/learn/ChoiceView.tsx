import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import { buildOptions } from "../../learn";
import type { LearnMode } from "../../types";
import { CardImage, Feedback, ListenButton, RoundProgress, type LearnViewProps } from "./shared";
import { speak, useCardClock, useKeys } from "./learnHooks";

/**
 * Trắc nghiệm (xem từ, chọn nghĩa đúng trong 4 nghĩa) và Trắc nghiệm đảo (xem nghĩa, chọn từ đúng trong 4 từ);
 * hai cách học dùng chung một màn hình. Phím 1 đến 4 chọn đáp án, Enter sang thẻ tiếp.
 */
export default function ChoiceView({
  mode,
  cards,
  pool,
  onAnswer,
  onFinish,
}: LearnViewProps & { mode: Extract<LearnMode, "quiz" | "reverse_quiz"> }) {
  const { t } = useTranslation("vocab");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const card = cards[index];
  const reverse = mode === "reverse_quiz";
  const options = useMemo(() => buildOptions(card, pool, mode), [card, pool, mode]);
  const elapsed = useCardClock(card.id);

  const choose = (position: number) => {
    if (picked !== null || position >= options.length) return;
    const option = options[position];
    setPicked(position);
    if (option.correct) setRight((count) => count + 1);
    onAnswer({ cardId: card.id, mode, correct: option.correct, responseMs: elapsed() });
    speak(card);
  };

  const next = () => {
    if (index + 1 >= cards.length) {
      onFinish({ right, total: cards.length });
      return;
    }
    setIndex(index + 1);
    setPicked(null);
  };

  useKeys((event) => {
    if (picked === null && /^[1-4]$/.test(event.key)) choose(Number(event.key) - 1);
    else if (picked !== null && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      next();
    }
  });

  const correct = picked !== null && options[picked].correct;

  return (
    <div>
      <RoundProgress done={index} total={cards.length} label={t("learn.progress", { current: index + 1, total: cards.length })} />
      <div className="flex items-center gap-6 rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        {!reverse && <CardImage card={card} className="hidden h-24 w-24 flex-none sm:block" />}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {reverse ? t("learn.quiz.pickWord") : t("learn.quiz.pickMeaning")}
          </div>
          {reverse ? (
            <h2 className="mt-2 text-3xl font-bold">{card.translationVi}</h2>
          ) : (
            <>
              <h2 lang="en" className="mt-2 text-3xl font-bold">{card.word}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-text-muted">
                {card.pos && <Badge variant="default">{card.pos}</Badge>}
                {card.ipaUs && <span>{card.ipaUs}</span>}
                <ListenButton card={card} label={t("learn.repeat.listenAria", { word: card.word })} />
              </div>
            </>
          )}
          {reverse && card.pos && <Badge variant="default" className="mt-2">{card.pos}</Badge>}
        </div>
      </div>

      {options.length < 2 ? (
        <p className="mt-4 text-sm text-text-muted">{t("learn.quiz.single")}</p>
      ) : (
        <div role="group" aria-label={t("learn.quiz.options")} className="mt-4 flex flex-col gap-2">
          {options.map((option, position) => {
            const chosen = picked === position;
            const showRight = picked !== null && option.correct;
            const showWrong = chosen && !option.correct;
            return (
              <button
                key={option.cardId}
                type="button"
                disabled={picked !== null}
                onClick={() => choose(position)}
                lang={reverse ? "en" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-md border px-4 py-2.5 text-left transition-colors disabled:cursor-default ${
                  showRight
                    ? "border-success bg-success/10"
                    : showWrong
                      ? "border-danger bg-danger/10"
                      : "border-border-strong bg-surface hover:border-primary hover:bg-primary-soft disabled:hover:border-border-strong disabled:hover:bg-surface"
                }`}
              >
                <kbd className="grid h-6 w-6 flex-none place-items-center rounded-sm border border-border-strong text-xs text-text-muted">
                  {position + 1}
                </kbd>
                <span className="flex-1">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {picked !== null && (
        <Feedback
          correct={correct}
          title={correct ? t("learn.quiz.correct") : t("learn.quiz.wrong")}
          onNext={next}
          nextLabel={t("learn.next")}
        >
          {card.exampleEn && (
            <p className="mt-0.5 text-text-muted">
              <span lang="en">“{card.exampleEn}”</span>
              {card.exampleVi && <> — {card.exampleVi}</>}
            </p>
          )}
        </Feedback>
      )}
    </div>
  );
}
