import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { isNetworkError } from "../utils";

interface MutationLike {
  mutate: (
    variables: { sentenceId: string; pinned: boolean },
    options?: { onSuccess?: () => void; onError?: (error: unknown) => void },
  ) => void;
  isPending: boolean;
}

export interface ReviewPinButtonProps {
  sentenceId: string;
  /** Câu đang trong Câu cần ôn của chế độ này. */
  pinned: boolean;
  setReview: MutationLike;
}

/** Nút ghim hoặc bỏ ghim câu khỏi Câu cần ôn. Dùng chung cho nghe chép và Shadowing. */
export default function ReviewPinButton({ sentenceId, pinned, setReview }: ReviewPinButtonProps) {
  const { t } = useTranslation("practice");

  const toggle = () => {
    const next = !pinned;
    setReview.mutate(
      { sentenceId, pinned: next },
      {
        onSuccess: () => toast(t(next ? "pin.pinned" : "pin.unpinned"), { icon: next ? "pin" : "pin-off" }),
        onError: (error) => toast(isNetworkError(error) ? t("note.offline") : t("pin.failed"), { icon: "circle-alert" }),
      },
    );
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={pinned}
      disabled={setReview.isPending}
      leftIcon={<Icon name={pinned ? "pin-off" : "pin"} />}
      onClick={toggle}
    >
      {t(pinned ? "pin.unpin" : "pin.pin")}
    </Button>
  );
}
