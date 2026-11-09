import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { CardImage, RoundProgress, type LearnViewProps } from "./shared";
import { speak, useCardClock, useKeys } from "./learnHooks";

/**
 * Lặp lại (BR-HT-17): nghe âm thanh của thẻ rồi tự đọc theo, bấm sang thẻ tiếp. Giọng nói không được gửi đi chấm nên
 * không dùng hạn mức Azure; thẻ không có âm thanh thì dùng giọng đọc của trình duyệt.
 */
export default function RepeatView({ cards, onAnswer, onFinish }: LearnViewProps) {
  const { t } = useTranslation("vocab");
  const [index, setIndex] = useState(0);
  const card = cards[index];
  const elapsed = useCardClock(card.id);

  // Tự phát khi sang thẻ mới; trình duyệt chặn phát tự động thì người học bấm "Nghe".
  useEffect(() => {
    speak(card);
  }, [card]);

  const next = () => {
    onAnswer({ cardId: card.id, mode: "repeat", correct: true, responseMs: elapsed() });
    if (index + 1 >= cards.length) onFinish({ right: cards.length, total: cards.length });
    else setIndex(index + 1);
  };

  useKeys((event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      next();
    } else if (event.key === " ") {
      event.preventDefault();
      speak(card);
    }
  });

  return (
    <div>
      <RoundProgress done={index} total={cards.length} label={t("learn.progress", { current: index + 1, total: cards.length })} />
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-10 text-center shadow-[var(--shadow-card)]">
        <div className="text-xs font-bold uppercase tracking-wider text-text-muted">{t("learn.repeat.prompt")}</div>
        <CardImage card={card} className="h-28 w-28" />
        <h2 lang="en" className="font-display text-5xl font-bold text-primary-text">{card.word}</h2>
        <div className="flex items-center gap-2 text-text-muted">
          {card.pos && <Badge variant="default">{card.pos}</Badge>}
          {card.ipaUs && <span>{card.ipaUs}</span>}
          <Button variant="ghost" size="sm" iconOnly aria-label={t("learn.repeat.listenAria", { word: card.word })} onClick={() => speak(card)}>
            <Icon name="volume-2" />
          </Button>
        </div>
        <p className="text-text-muted">{card.translationVi}</p>
        <Button size="lg" leftIcon={<Icon name="mic" />} onClick={next} className="mt-4">
          {t("learn.repeat.next")}
        </Button>
        <small className="text-text-subtle">{t("learn.repeat.note")}</small>
      </div>
    </div>
  );
}
