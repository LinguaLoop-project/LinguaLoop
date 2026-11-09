import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import { buttonClasses } from "@/components/common/buttonStyles";
import { answerQueue } from "../../answerQueue";
import type { LearnMode } from "../../types";
import type { RoundScore } from "./shared";

export interface RoundDoneProps {
  mode: LearnMode;
  /** Lượt vừa xong, tính từ 1. */
  round: number;
  /** Số phần trên đường dẫn, tính từ 1. */
  partNumber: number;
  score: RoundScore;
  onRestart: () => void;
  onShowWords: () => void;
  /** Có khi phần còn lượt sau. */
  onNextRound: (() => void) | null;
  /** Đường dẫn phần tiếp theo (không bị khoá), hoặc null nếu đây là phần cuối. */
  nextPartHref: string | null;
  deckHref: string;
}

/** Màn hoàn thành một lượt: kết quả và các lối đi tiếp (UC-HT-02, bước 5). */
export default function RoundDone({
  mode,
  round,
  partNumber,
  score,
  onRestart,
  onShowWords,
  onNextRound,
  nextPartHref,
  deckHref,
}: RoundDoneProps) {
  const { t } = useTranslation("vocab");
  const unsent = useSyncExternalStore(answerQueue.subscribe, answerQueue.size);
  const scoreLine =
    mode === "flashcard"
      ? t("learn.done.scoreFlash", { right: score.right, total: score.total })
      : mode === "repeat"
        ? t("learn.done.scoreRepeat", { total: score.total })
        : t("learn.done.scoreChoice", { right: score.right, total: score.total });
  const primary = buttonClasses({ variant: "primary" });

  return (
    <div className="flex flex-col items-center rounded-lg border-2 border-primary bg-surface p-10 text-center shadow-[var(--shadow-card)]">
      <Mascot mood="celebrate" size={120} alt="" />
      <h2 className="mt-4 font-display text-3xl font-bold">{t("learn.done.title")}</h2>
      <p className="mt-1.5 text-text-muted">
        {t("learn.done.subtitle", { mode: t(`learn.modeNames.${mode}`), round, part: partNumber })}
      </p>
      <p className="mt-1 text-sm text-text-muted">{scoreLine}</p>
      {unsent > 0 && (
        <p role="status" className="mt-2 inline-flex items-center gap-1.5 text-sm text-warning">
          <Icon name="wifi-off" className="h-4 w-4" />
          {t("learn.unsent", { count: unsent })}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button variant="ghost" leftIcon={<Icon name="book-open-text" />} onClick={onShowWords}>
          {t("learn.done.words")}
        </Button>
        <Button variant="ghost" leftIcon={<Icon name="rotate-ccw" />} onClick={onRestart}>
          {t("learn.done.restart")}
        </Button>
        {onNextRound ? (
          <Button rightIcon={<Icon name="arrow-right" />} onClick={onNextRound}>
            {t("learn.done.nextRound")}
          </Button>
        ) : nextPartHref ? (
          <Link to={nextPartHref} className={primary}>
            {t("learn.done.nextPart")}
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        ) : (
          <Link to={deckHref} className={primary}>
            {t("learn.done.backToDeck")}
          </Link>
        )}
      </div>
    </div>
  );
}
