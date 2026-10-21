import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { Kbd } from "./ShortcutsPopover";

export interface InputActionsProps {
  /** Gợi ý phím đứng cạnh Enter, ví dụ "sang ô kế". Bỏ trống thì chỉ có gợi ý nộp bài. */
  extraHint?: string;
  submitting: boolean;
  /** Có thì hiện nút "Gợi ý" (lộ từ đúng kế tiếp); `hinting` là đang chờ backend trả từ. */
  onHint?: () => void;
  hinting?: boolean;
  onSubmit: () => void;
  onGiveUp: () => void;
}

/** Hàng nút dưới ô nhập (Kiểm tra, Hiện cả câu), dùng chung cho `FullInput` và `ClozeInput`. */
export default function InputActions({ extraHint, submitting, onHint, hinting = false, onSubmit, onGiveUp }: InputActionsProps) {
  const { t } = useTranslation("dictation");
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2.5">
      <span className="flex items-center gap-1.5 text-[13px] text-text-muted">
        <Kbd>Enter</Kbd> {t("input.enterHint")}
        {extraHint && (
          <>
            <span aria-hidden="true">·</span>
            <Kbd>Space</Kbd> {extraHint}
          </>
        )}
      </span>
      <span className="grow" />
      {onHint && (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Icon name="lightbulb" />}
          title={t("input.hintTitle")}
          isLoading={hinting}
          disabled={submitting}
          onClick={onHint}
        >
          {t("input.hint")}
        </Button>
      )}
      <Button variant="ghost" size="sm" leftIcon={<Icon name="eye" />} disabled={submitting} onClick={onGiveUp}>
        {t("input.giveUp")}
      </Button>
      <Button onClick={onSubmit} isLoading={submitting}>
        {t("input.submit")}
      </Button>
    </div>
  );
}
