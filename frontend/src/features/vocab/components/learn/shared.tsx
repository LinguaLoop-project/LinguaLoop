import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import ProgressBar from "@/components/common/ProgressBar";
import type { AnswerDraft, LearnCard } from "../../types";
import { speak } from "./learnHooks";

/** Kết quả của một lượt: số thẻ nhớ ngay lần đầu, số thẻ phải làm lại và tổng số thẻ. */
export interface RoundScore {
  right: number;
  redone: number;
  total: number;
}

/**
 * Props chung của màn hình một thẻ ở mỗi cách học. Hàng đợi của lượt nằm ở `LearnSession` nên đổi cách học giữa chừng
 * vẫn giữ tiến độ; màn hình thẻ chỉ hiện thẻ đầu hàng và báo câu trả lời lên trên.
 */
export interface CardViewProps {
  card: LearnCard;
  /** Mọi thẻ của phần, để lấy đáp án gây nhiễu. */
  pool: LearnCard[];
  /** Số thẻ đã xong và tổng số thẻ của lượt, cho thanh tiến độ. */
  done: number;
  total: number;
  /** Gửi câu trả lời. Flashcard sang thẻ tiếp ngay; các cách học khác chờ `onNext`. */
  onAnswer: (answer: AnswerDraft) => void;
  onNext: () => void;
}

export function ListenButton({ card, label, className = "" }: { card: LearnCard; label: string; className?: string }) {
  return (
    <Button variant="ghost" size="sm" iconOnly aria-label={label} className={className} onClick={() => speak(card)}>
      <Icon name="volume-2" />
    </Button>
  );
}

/** Thanh tiến độ của lượt kèm "Thẻ 3/10". */
export function RoundProgress({ done, total, label }: { done: number; total: number; label: string }) {
  const { t } = useTranslation("vocab");
  return (
    <div className="mb-4 flex items-center gap-3">
      <ProgressBar tone="vocab" value={total > 0 ? (done / total) * 100 : 0} label={label} className="flex-1" />
      <b className="whitespace-nowrap text-sm">{t("learn.progress", { current: Math.min(done + 1, total), total })}</b>
    </div>
  );
}

/** Khung phản hồi sau khi trả lời: đúng hoặc sai kèm nội dung (ví dụ, đáp án) và nút "Tiếp". */
export function Feedback({
  correct,
  title,
  children,
  onNext,
  nextLabel,
}: {
  correct: boolean;
  title: string;
  children?: ReactNode;
  onNext: () => void;
  nextLabel: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mt-4 flex flex-wrap items-center gap-3 rounded-md border p-3.5 ${
        correct ? "border-success/40 bg-success/10" : "border-danger/40 bg-danger/10"
      }`}
    >
      <Icon name={correct ? "circle-check" : "circle-alert"} className={`h-5 w-5 flex-none ${correct ? "text-success" : "text-danger"}`} />
      <div className="min-w-[200px] flex-1 text-sm">
        <b>{title}</b>
        {children}
      </div>
      <Button size="sm" rightIcon={<Icon name="arrow-right" />} onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  );
}

/** Ảnh của thẻ; ẩn đi khi tải lỗi. */
export function CardImage({ card, className = "" }: { card: LearnCard; className?: string }) {
  if (!card.imageUrl) return null;
  return (
    <img
      src={card.imageUrl}
      alt=""
      loading="lazy"
      className={`rounded-md object-cover ${className}`}
      onError={(event) => {
        (event.target as HTMLElement).style.display = "none";
      }}
    />
  );
}
