import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { useChatHistory } from "../hooks/useAiChat";
import type { ChatHistoryItem } from "../types";

export interface HistoryDialogProps {
  lessonId: string;
  open: boolean;
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
}

/** Trạng thái hiển thị: phiên đã đóng mà không có nhận xét tổng quát là "dừng giữa chừng". */
const statusKey = (item: ChatHistoryItem) =>
  item.status === "completed" && !item.hasSummary ? "stopped" : item.status;

/** Lịch sử các cuộc trò chuyện của học viên trong bài, mới nhất trước; xem lại miễn phí (BR-AI-05, AC-AI-06). */
export default function HistoryDialog({ lessonId, open, onClose, onOpenSession }: Readonly<HistoryDialogProps>) {
  const { t, i18n } = useTranslation("aichat");
  const history = useChatHistory(lessonId, open);
  const format = new Intl.DateTimeFormat(i18n.language === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" });

  return (
    <Dialog open={open} onClose={onClose} labelledBy="ai-history-title" wide>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="ai-history-title" className="font-display text-xl font-bold">
            {t("history.title")}
          </h2>
          <p className="mt-0.5 text-[13px] text-text-muted">{t("history.free")}</p>
        </div>
        <Button variant="ghost" size="sm" iconOnly aria-label={t("history.close")} onClick={onClose}>
          <Icon name="x" />
        </Button>
      </div>

      <div className="mt-4 max-h-[55vh] overflow-y-auto">
        {history.isPending ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : history.isError ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-text-muted">{t("history.loadFailed")}</p>
            <Button variant="ghost" size="sm" onClick={() => void history.refetch()}>
              {t("history.retry")}
            </Button>
          </div>
        ) : history.data.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">{t("history.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.data.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpenSession(item.id)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-bg-elevated px-4 py-3 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {t("history.item", { when: format.format(new Date(item.startedAt)), count: item.answered })}
                    </span>
                    <span className="text-[13px] text-text-muted">{t(`history.status.${statusKey(item)}`)}</span>
                  </span>
                  <span className="text-[13px] font-semibold text-primary-text">{t("history.open")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
