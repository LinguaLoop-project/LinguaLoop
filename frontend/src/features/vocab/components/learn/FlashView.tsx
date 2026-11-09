import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import { GRADE_QUALITIES, intervalParts } from "../../learn";
import { CardImage, ListenButton, RoundProgress, type CardViewProps } from "./shared";
import { speak, useCardClock, useKeys } from "./learnHooks";

const GRADE_KEYS = ["forget", "hard", "good", "easy"] as const;
const GRADE_TONE = ["border-danger/50 text-danger", "border-warning/50 text-warning", "border-success/50 text-success", "border-info/50 text-info"];

/**
 * Flashcard (UC-HT-02): lật thẻ rồi tự chấm Quên, Khó, Được hoặc Dễ; server chấm theo SM-2 và mỗi nút hiện trước khoảng
 * ôn sẽ đặt (BR-HT-11). Chọn Quên thì thẻ xuống cuối lượt (BR-HT-14, xử lý ở `LearnSession`) và sang thẻ tiếp ngay.
 * Space lật thẻ, phím 1 đến 4 chấm.
 */
export default function FlashView({ card, done, total, onAnswer }: CardViewProps) {
  const { t } = useTranslation("vocab");
  const [flipped, setFlipped] = useState(false);
  const cardButton = useRef<HTMLButtonElement>(null);
  const elapsed = useCardClock(card.id);

  useEffect(() => {
    cardButton.current?.focus();
  }, []);

  const flip = () => {
    if (!flipped) speak(card);
    setFlipped((value) => !value);
  };

  const grade = (quality: number) => {
    if (!flipped) return;
    onAnswer({ cardId: card.id, mode: "flashcard", correct: quality >= 3, quality, responseMs: elapsed() });
  };

  useKeys((event) => {
    if (event.key === " ") {
      event.preventDefault();
      flip();
    } else if (/^[1-4]$/.test(event.key)) {
      grade(GRADE_QUALITIES[Number(event.key) - 1]);
    }
  });

  const previewOf = (quality: number) => card.previews.find((preview) => preview.quality === quality);

  return (
    <div>
      <RoundProgress done={done} total={total} label={t("learn.progress", { current: done + 1, total })} />
      <button
        ref={cardButton}
        type="button"
        onClick={flip}
        aria-label={t("learn.flash.cardAria", { word: card.word })}
        aria-pressed={flipped}
        className="relative block min-h-[300px] w-full cursor-pointer rounded-lg border border-border bg-surface p-8 text-center shadow-[var(--shadow-card)] transition-colors hover:border-border-strong"
      >
        {!flipped ? (
          <div className="flex flex-col items-center gap-3">
            <CardImage card={card} className="h-28 w-28" />
            <span lang="en" className="font-display text-5xl font-bold text-primary-text">{card.word}</span>
            <span className="flex items-center gap-2 text-text-muted">
              {card.pos && <Badge variant="default">{card.pos}</Badge>}
              {card.ipaUs}
            </span>
            <span className="mt-2 text-sm text-text-subtle">{t("learn.flash.front")}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {card.pos && <Badge variant="default">{card.pos}</Badge>}
            <span className="text-3xl font-bold">{card.translationVi}</span>
            {card.exampleEn && (
              <>
                <p lang="en" className="mt-3 italic">“{card.exampleEn}”</p>
                {card.exampleVi && <p className="text-sm text-text-muted">{card.exampleVi}</p>}
              </>
            )}
            {card.explanationVi && <p className="mt-2 max-w-xl text-sm text-text-muted">{card.explanationVi}</p>}
          </div>
        )}
      </button>
      <div className="mt-2 flex justify-center">
        <ListenButton card={card} label={t("learn.listenAria", { word: card.word })} />
      </div>

      <div role="group" aria-label={t("learn.flash.gradesLabel")} className={`mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 ${flipped ? "" : "invisible"}`}>
        {GRADE_QUALITIES.map((quality, position) => {
          const preview = previewOf(quality);
          const { unit, count } = preview ? intervalParts(preview.minutes) : { unit: "day" as const, count: 1 };
          return (
            <button
              key={quality}
              type="button"
              tabIndex={flipped ? 0 : -1}
              onClick={() => grade(quality)}
              className={`flex flex-col items-center gap-0.5 rounded-md border bg-surface px-3 py-2.5 font-semibold transition-colors hover:bg-surface-hover ${GRADE_TONE[position]}`}
            >
              <span>
                <kbd className="mr-1.5 text-xs opacity-70">{position + 1}</kbd>
                {t(`learn.flash.grades.${GRADE_KEYS[position]}`)}
              </span>
              {preview && <small className="font-normal text-text-muted">{t(`learn.interval.${unit}`, { count })}</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
