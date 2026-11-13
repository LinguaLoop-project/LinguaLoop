import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { hintMask, isGuessCorrect, isHintExhausted, letterCount, maskExample } from "../../learn";
import { Feedback, ListenButton, RoundProgress, type CardViewProps } from "./shared";
import { speak, useCardClock, useKeys } from "./learnHooks";

interface Outcome {
  correct: boolean;
  gaveUp: boolean;
}

/**
 * Cách học Đoán (BR-HT-17, BR-HT-18): xem loại từ, nghĩa tiếng Việt và câu ví dụ đã che từ, gõ từ tiếng Anh. Từ cần đoán
 * không xuất hiện ở đâu trên màn hình cho tới khi có kết quả: không hiện ảnh, phiên âm hay giải thích của thẻ.
 */
export default function GuessView({ card, done, total, onAnswer, onNext }: CardViewProps) {
  const { t } = useTranslation("vocab");
  const [value, setValue] = useState("");
  const [hints, setHints] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [empty, setEmpty] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const elapsed = useCardClock(card.id);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const finish = (result: Outcome) => {
    setOutcome(result);
    onAnswer({ cardId: card.id, mode: "guess", correct: result.correct, hintUsed: hints > 0, responseMs: elapsed() });
    speak(card);
  };

  const check = () => {
    if (outcome) return;
    if (value.trim() === "") {
      setEmpty(true);
      return;
    }
    finish({ correct: isGuessCorrect(value, card.word), gaveUp: false });
  };

  const hint = () => {
    if (outcome) return;
    const next = hints + 1;
    setHints(next);
    // Gợi ý tới chữ cái cuối cùng thì coi như "Không biết".
    if (isHintExhausted(card.word, next)) finish({ correct: false, gaveUp: true });
  };

  useKeys((event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onNext();
    }
  }, outcome !== null);

  const masked = maskExample(card.exampleEn, card.word);
  const letters = letterCount(card.word);
  const exhausted = outcome?.gaveUp === true && isHintExhausted(card.word, hints);

  return (
    <div>
      <RoundProgress done={done} total={total} label={t("learn.progress", { current: done + 1, total })} />
      <div className="rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <div className="text-xs font-bold uppercase tracking-wider text-text-muted">{t("learn.guess.prompt")}</div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {card.pos && <Badge variant="default">{card.pos}</Badge>}
          <h2 className="text-2xl font-bold">{card.meaningVi}</h2>
        </div>
        {masked && (
          <div className="mt-4 rounded-md bg-surface-hover p-3.5">
            <p lang="en" className="text-lg">{outcome ? card.exampleEn : masked}</p>
            {card.exampleVi && <p className="mt-1 text-sm text-text-muted">{card.exampleVi}</p>}
          </div>
        )}

        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            check();
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xl tracking-[0.3em] text-text-muted" aria-label={t("learn.guess.letters", { count: letters })}>
              {outcome ? card.word : hintMask(card.word, hints)}
            </span>
            <small className="text-text-muted">{t("learn.guess.letters", { count: letters })}</small>
            {hints > 0 && !outcome && <small className="text-text-muted">· {t("learn.guess.usedHints", { count: hints })}</small>}
          </div>
          <input
            ref={input}
            value={value}
            disabled={outcome !== null}
            onChange={(event) => {
              setValue(event.target.value);
              setEmpty(false);
            }}
            placeholder={t("learn.guess.placeholder")}
            aria-label={t("learn.guess.inputLabel")}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-12 w-full rounded-md border border-border-strong bg-bg-base px-4 text-lg text-text outline-none transition-colors placeholder:text-text-subtle focus:border-primary disabled:opacity-70"
          />
          {empty && (
            <p role="alert" className="text-sm text-warning">
              {t("learn.guess.typeFirst")}
            </p>
          )}
          {!outcome && (
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t("learn.guess.check")}</Button>
              <Button variant="ghost" leftIcon={<Icon name="lightbulb" />} onClick={hint}>
                {t("learn.guess.hint")}
              </Button>
              <Button variant="text" onClick={() => finish({ correct: false, gaveUp: true })}>
                {t("learn.guess.skip")}
              </Button>
            </div>
          )}
        </form>

        {outcome && (
          <Feedback
            correct={outcome.correct}
            title={outcome.correct ? t("learn.guess.correct") : t("learn.guess.wrong")}
            onNext={onNext}
            nextLabel={t("learn.next")}
          >
            <p className="mt-0.5">
              {exhausted ? `${t("learn.guess.gaveUp")} ` : ""}
              {!outcome.correct && (
                <>
                  {t("learn.guess.answer")}: <b lang="en">{card.word}</b>
                </>
              )}
              {card.ipaUs && <span className="ml-2 text-text-muted">{card.ipaUs}</span>}
              <ListenButton card={card} label={t("learn.listenAria", { word: card.word })} className="ml-1 align-middle" />
              {!outcome.correct && <span className="ml-2 text-text-muted">{t("learn.again")}</span>}
            </p>
          </Feedback>
        )}
      </div>
    </div>
  );
}
