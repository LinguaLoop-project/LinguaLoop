import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import { buildOptions } from "../../learn";
import type { LearnMode } from "../../types";
import { Feedback, ListenButton, RoundProgress, type CardViewProps } from "./shared";
import { speak, useCardClock, useKeys } from "./learnHooks";

/**
 * Trắc nghiệm (xem từ, chọn nghĩa đúng trong 4 nghĩa) và Trắc nghiệm đảo (xem nghĩa, chọn từ đúng trong 4 từ);
 * hai cách học dùng chung một màn hình. Phím 1 đến 4 chọn đáp án, Enter sang thẻ tiếp.
 */
export default function ChoiceView({
  mode,
  card,
  pool,
  done,
  total,
  onAnswer,
  onNext,
}: CardViewProps & { mode: Extract<LearnMode, "quiz" | "reverse_quiz"> }) {
  const { t } = useTranslation("vocab");
  const [picked, setPicked] = useState<number | null>(null);
  const reverse = mode === "reverse_quiz";
  const options = useMemo(() => buildOptions(card, pool, mode), [card, pool, mode]);
  const elapsed = useCardClock(card.id);

  const choose = (position: number) => {
    if (picked !== null || position >= options.length) return;
    setPicked(position);
    onAnswer({ cardId: card.id, mode, correct: options[position].correct, responseMs: elapsed() });
    speak(card);
  };

  useKeys((event) => {
    if (picked === null && /^[1-4]$/.test(event.key)) choose(Number(event.key) - 1);
    else if (picked !== null && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onNext();
    }
  });

  const correct = picked !== null && options[picked].correct;

  return (
    <div>
      <RoundProgress done={done} total={total} label={t("learn.progress", { current: done + 1, total })} />
      <div className="flex items-center gap-6 rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {reverse ? t("learn.quiz.pickWord") : t("learn.quiz.pickMeaning")}
          </div>
          {reverse ? (
            <h2 className="mt-2 text-3xl font-bold">{card.meaningVi}</h2>
          ) : (
            <>
              <h2 lang="en" className="mt-2 text-3xl font-bold">{card.word}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-text-muted">
                {card.pos && <Badge variant="default">{card.pos}</Badge>}
                {card.ipaUs && <span>{card.ipaUs}</span>}
                <ListenButton card={card} label={t("learn.listenAria", { word: card.word })} />
              </div>
            </>
          )}
          {reverse && card.pos && <Badge variant="default" className="mt-2">{card.pos}</Badge>}
        </div>
      </div>

      {options.length < 2 ? (
        <p className="mt-4 text-sm text-text-muted">{t("learn.quiz.single")}</p>
      ) : (
        <div role="group" aria-label={t("learn.quiz.options")} className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
                className={`group flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150 disabled:cursor-default ${
                  showRight
                    ? "border-success bg-success/12 shadow-sm"
                    : showWrong
                      ? "border-danger bg-danger/12"
                      : "border-border-strong bg-surface hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft/60 disabled:hover:translate-y-0 disabled:hover:border-border-strong disabled:hover:bg-surface"
                }`}
              >
                <kbd
                  className={`grid h-7 w-7 flex-none place-items-center rounded-md border font-mono text-xs font-bold transition-colors ${
                    showRight
                      ? "border-success bg-success text-white"
                      : showWrong
                        ? "border-danger bg-danger text-white"
                        : "border-border-strong bg-bg-elevated text-text-muted group-hover:border-primary group-hover:text-primary-text"
                  }`}
                >
                  {position + 1}
                </kbd>
                <span className="flex-1 font-medium">{option.label}</span>
                {showRight && <Icon name="circle-check" className="h-5 w-5 flex-none text-success" />}
                {showWrong && <Icon name="circle-alert" className="h-5 w-5 flex-none text-danger" />}
              </button>
            );
          })}
        </div>
      )}

      {picked !== null && (
        <Feedback
          correct={correct}
          title={correct ? t("learn.quiz.correct") : t("learn.quiz.wrong")}
          onNext={onNext}
          nextLabel={t("learn.next")}
        >
          {card.exampleEn && (
            <p className="mt-0.5 text-text-muted">
              <span lang="en">“{card.exampleEn}”</span>
              {card.exampleVi && <> — {card.exampleVi}</>}
            </p>
          )}
          {!correct && <p className="mt-0.5 text-text-muted">{t("learn.again")}</p>}
        </Feedback>
      )}
    </div>
  );
}
