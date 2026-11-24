import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import { GRADE_QUALITIES, intervalParts } from "../../learn";
import Icon from "@/components/common/Icon";
import { CardImage, ListenButton, RoundProgress, type CardViewProps } from "./shared";
import { speak, useCardClock, useKeys } from "./learnHooks";

const GRADE_KEYS = ["forget", "hard", "good", "easy"] as const;
const GRADE_TONE = [
  "border-danger/45 text-danger hover:border-danger hover:bg-danger/10 hover:shadow-[0_8px_20px_-6px_color-mix(in_srgb,var(--danger)_35%,transparent)]",
  "border-warning/45 text-warning hover:border-warning hover:bg-warning/10 hover:shadow-[0_8px_20px_-6px_color-mix(in_srgb,var(--warning)_35%,transparent)]",
  "border-success/45 text-success hover:border-success hover:bg-success/10 hover:shadow-[0_8px_20px_-6px_color-mix(in_srgb,var(--success)_35%,transparent)]",
  "border-info/45 text-info hover:border-info hover:bg-info/10 hover:shadow-[0_8px_20px_-6px_color-mix(in_srgb,var(--info)_35%,transparent)]",
];

/**
 * Flashcard (UC-HT-02): lật thẻ rồi tự chấm Quên, Khó, Được hoặc Dễ; server chấm theo SM-2 và mỗi nút hiện trước khoảng
 * ôn sẽ đặt (BR-HT-11). Chọn Quên thì thẻ xuống cuối lượt (BR-HT-14, xử lý ở `LearnSession`) và sang thẻ tiếp ngay.
 * Space lật thẻ, phím 1 đến 4 chấm.
 */
export default function FlashView({ card, done, total, onAnswer }: CardViewProps) {
  const { t } = useTranslation("vocab");
  const [flipped, setFlipped] = useState(false);
  const cardButton = useRef<HTMLDivElement>(null);
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
      {/* div role="button" thay cho <button>: bên trong có nút nghe, mà HTML không cho nút lồng trong nút. */}
      <div
        ref={cardButton}
        role="button"
        tabIndex={0}
        onClick={flip}
        onKeyDown={(event) => {
          // Chỉ khi chính thẻ đang được focus; Space hoặc Enter trên nút nghe là việc của nút đó.
          if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            flip();
          }
        }}
        aria-label={t("learn.flash.cardAria", { word: card.word })}
        aria-pressed={flipped}
        className="group relative flex min-h-[320px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-surface p-8 text-center shadow-[var(--shadow-card)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] before:pointer-events-none before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_18px_36px_-12px_rgba(0,0,0,0.45),0_0_24px_color-mix(in_srgb,var(--primary)_22%,transparent)]"
      >
        {!flipped ? (
          <div className="flex flex-col items-center gap-3.5">
            <span lang="en" className="font-display text-5xl font-bold tracking-tight text-primary-text">
              {card.word}
            </span>
            <span className="flex flex-wrap items-center justify-center gap-2 text-text-muted">
              {card.pos && <Badge variant="default">{card.pos}</Badge>}
              {card.ipaUs && <span className="font-mono text-sm">{card.ipaUs}</span>}
              <ListenButton card={card} label={t("learn.listenAria", { word: card.word })} />
            </span>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-text-subtle transition-colors group-hover:border-border-strong group-hover:text-text-muted">
              <Icon name="rotate-cw" className="h-3.5 w-3.5" />
              {t("learn.flash.front")}
            </span>
          </div>
        ) : (
          <div className="flex w-full max-w-xl flex-col items-center gap-2.5">
            {/* Giữ lại dòng từ tiếng Anh + IPA + nút nghe ở đầu mặt sau để đối chiếu Từ - Nghĩa */}
            <div className="mb-1 flex flex-wrap items-center justify-center gap-2 border-b border-border pb-2.5 text-sm text-text-muted">
              <span lang="en" className="font-display text-lg font-bold text-primary-text">
                {card.word}
              </span>
              {card.pos && <Badge variant="default">{card.pos}</Badge>}
              {card.ipaUs && <span className="font-mono text-xs">{card.ipaUs}</span>}
              <ListenButton card={card} label={t("learn.listenAria", { word: card.word })} />
            </div>

            <CardImage url={card.imageUrl} className="mb-1" />
            <span className="font-display text-3xl font-bold leading-snug text-text">{card.meaningVi}</span>

            {card.exampleEn && (
              <div className="mt-2 w-full rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-center">
                <p lang="en" className="italic text-text">
                  “{card.exampleEn}”
                </p>
                {card.exampleVi && <p className="mt-0.5 text-sm text-text-muted">{card.exampleVi}</p>}
              </div>
            )}
            {card.definitionVi && <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-muted">{card.definitionVi}</p>}
          </div>
        )}
      </div>
      {flipped && card.contextEn && (
        <div className="mt-3 rounded-xl border border-border border-l-[3px] border-l-fn-vocab bg-surface p-4 text-sm shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fn-vocab">
            <Icon name="quote" className="h-3.5 w-3.5" />
            {t("review.context")}
          </div>
          <p lang="en" className="mt-1.5 font-medium italic text-text">
            &ldquo;{card.contextEn}&rdquo;
          </p>
          {card.contextVi && <p className="mt-0.5 text-text-muted">{card.contextVi}</p>}
          {card.lesson && (
            <Link
              to={`/student/lessons/${card.lesson.id}`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-text transition-colors hover:underline"
            >
              <Icon name="play" className="h-3.5 w-3.5" />
              {t("review.fromLesson", { title: card.lesson.title })}
            </Link>
          )}
        </div>
      )}

      <div
        role="group"
        aria-label={t("learn.flash.gradesLabel")}
        className={`mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 ${flipped ? "" : "invisible"}`}
      >
        {GRADE_QUALITIES.map((quality, position) => {
          const preview = previewOf(quality);
          const { unit, count } = preview ? intervalParts(preview.minutes) : { unit: "day" as const, count: 1 };
          return (
            <button
              key={quality}
              type="button"
              tabIndex={flipped ? 0 : -1}
              onClick={() => grade(quality)}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border bg-surface px-3 py-3 font-semibold transition-all duration-150 hover:-translate-y-0.5 ${GRADE_TONE[position]}`}
            >
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-current/30 bg-current/10 px-1.5 py-0.5 font-mono text-xs font-bold">
                  {position + 1}
                </kbd>
                {t(`learn.flash.grades.${GRADE_KEYS[position]}`)}
              </span>
              {preview && (
                <small className="font-normal text-text-muted">{t(`learn.interval.${unit}`, { count })}</small>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
