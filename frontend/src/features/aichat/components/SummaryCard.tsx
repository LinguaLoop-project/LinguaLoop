import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import type { ChatSession } from "../types";

export interface SummaryCardProps {
  session: ChatSession;
  /** Phiên vừa bị đóng vì quá 15 phút. */
  expired: boolean;
  /** Chỉ xem lại bản cũ: không có nút trò chuyện mới. */
  readOnly: boolean;
  retrying: boolean;
  onRetry: () => void;
  onAgain: () => void;
  onBack: () => void;
}

/** Nhận xét tổng quát cuối phiên (BR-AI-09). Phiên dừng giữa chừng hoặc chưa tạo được thì nói rõ thay vì để trống. */
export default function SummaryCard({ session, expired, readOnly, retrying, onRetry, onAgain, onBack }: Readonly<SummaryCardProps>) {
  const { t } = useTranslation("aichat");
  const waiting = session.status === "active" && session.awaitingSummary;
  return (
    <section
      aria-label={t("summary.title")}
      className="rounded-xl border border-primary/40 bg-[linear-gradient(135deg,var(--primary-soft),transparent_70%)] p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-primary text-white">
          <Icon name="sparkles" className="size-5" />
        </span>
        <h2 className="font-display text-lg font-bold">{t("summary.title")}</h2>
        <span className="ml-auto text-[13px] text-text-muted">
          {t("summary.answered", { count: session.answered, max: session.maxQuestions })}
        </span>
      </div>

      {expired && <p className="mt-3 text-[13px] text-text-muted">{t("summary.expired")}</p>}
      {session.summary ? (
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{session.summary}</p>
      ) : (
        <p className="mt-3 text-sm text-text-muted">{waiting ? t("summary.failed") : t("summary.stopped")}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {waiting && !readOnly && (
          <Button isLoading={retrying} onClick={onRetry} leftIcon={<Icon name="rotate-cw" />}>
            {t("summary.retry")}
          </Button>
        )}
        {!readOnly && (
          <Button variant={waiting ? "ghost" : "primary"} onClick={onAgain} leftIcon={<Icon name="messages-square" />}>
            {t("summary.again")}
          </Button>
        )}
        <Button variant="ghost" onClick={onBack} leftIcon={<Icon name="arrow-left" />}>
          {t("summary.backToLesson")}
        </Button>
      </div>
    </section>
  );
}
