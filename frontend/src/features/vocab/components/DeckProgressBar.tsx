import { useTranslation } from "react-i18next";
import type { DeckProgress } from "../types";

export interface DeckProgressBarProps {
  progress: DeckProgress;
  total: number;
}

/** Thanh nhiều đoạn: đã thuộc, đang ôn, đang học trên tổng số thẻ của bộ (phần còn lại là thẻ Mới). */
export default function DeckProgressBar({ progress, total }: DeckProgressBarProps) {
  const { t } = useTranslation("vocab");
  const width = (count: number) => `${total > 0 ? (count / total) * 100 : 0}%`;
  return (
    <div
      role="img"
      aria-label={t("deck.barLabel", { ...progress, total })}
      className="flex h-2 w-full overflow-hidden rounded-full bg-border"
    >
      <i className="h-full bg-success" style={{ width: width(progress.mastered) }} />
      <i className="h-full bg-info" style={{ width: width(progress.reviewing) }} />
      <i className="h-full bg-warning" style={{ width: width(progress.learning) }} />
    </div>
  );
}
