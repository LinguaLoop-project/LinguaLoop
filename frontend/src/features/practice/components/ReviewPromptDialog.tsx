import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { toast } from "@/stores/toastStore";
import type { ReviewPrompt } from "../reviewPrompt";
import type { ReviewReason } from "../types";
import { isNetworkError } from "../utils";

interface MutationLike {
  mutate: (
    variables: { sentenceId: string; pinned: boolean; reason?: ReviewReason },
    options?: { onSuccess?: () => void; onError?: (error: unknown) => void },
  ) => void;
  isPending: boolean;
}

export interface ReviewPromptDialogProps {
  /** Lời hỏi đang hiện; null là đóng. */
  prompt: ReviewPrompt | null;
  setReview: MutationLike;
  /** Đóng hộp hỏi (sau khi người học chọn, hoặc Esc, bấm ra ngoài: coi như "Không" hay "Giữ lại"). */
  onClose: () => void;
}

/**
 * Hỏi người học sau một lượt: lưu câu điểm thấp vào Câu cần ôn, hoặc bỏ câu đã tốt khỏi danh sách. Danh sách chỉ đổi
 * khi người học bấm nút đầu; Esc hay bấm ra ngoài thì không đổi gì. Dùng chung cho nghe chép và Shadowing.
 */
export default function ReviewPromptDialog({ prompt, setReview, onClose }: ReviewPromptDialogProps) {
  const { t } = useTranslation("practice");
  if (!prompt) return null;
  const save = prompt.kind === "save";
  const values = { score: Math.round(prompt.score), mode: t(`modes.${prompt.mode}`) };

  const confirm = () => {
    setReview.mutate(
      save ? { sentenceId: prompt.sentenceId, pinned: true, reason: "low_score" } : { sentenceId: prompt.sentenceId, pinned: false },
      {
        onSuccess: () => {
          toast(t(save ? "pin.pinned" : "pin.unpinned"), { icon: save ? "pin" : "pin-off" });
          onClose();
        },
        onError: (error) => toast(isNetworkError(error) ? t("note.offline") : t("pin.failed"), { icon: "circle-alert" }),
      },
    );
  };

  return (
    <Dialog open onClose={onClose} labelledBy="review-prompt-title">
      <h2 id="review-prompt-title" className="font-display text-lg font-bold">
        {t(save ? "prompt.saveTitle" : "prompt.removeTitle")}
      </h2>
      <p className="mt-2 text-sm text-text-muted">{t(save ? "prompt.saveBody" : "prompt.removeBody", values)}</p>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={setReview.isPending}>
          {t(save ? "prompt.skip" : "prompt.keep")}
        </Button>
        <Button autoFocus isLoading={setReview.isPending} onClick={confirm}>
          {t(save ? "prompt.save" : "prompt.remove")}
        </Button>
      </div>
    </Dialog>
  );
}
