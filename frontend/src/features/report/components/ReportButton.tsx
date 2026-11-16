import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import type { ReportTargetType } from "../types";
import ReportDialog from "./ReportDialog";

export interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  /** Nội dung đang báo (câu hoặc từ vựng), hiện ở đầu hộp báo cáo. */
  label?: string;
  /** Giá trị hiện tại các cột của nội dung, để chặn bản sửa giống hệt (BR-BC-06). */
  current?: Record<string, string | null>;
  className?: string;
}

/** Nút "Báo cáo" ở một câu hoặc một thẻ (BR-BC-01); bấm mở hộp báo cáo. */
export default function ReportButton({ targetType, targetId, label, current, className }: ReportButtonProps) {
  const { t } = useTranslation("report");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={className}
        leftIcon={<Icon name="flag" />}
        onClick={() => setOpen(true)}
      >
        {t("submit.button")}
      </Button>
      {open && (
        <ReportDialog
          targetType={targetType}
          targetId={targetId}
          label={label}
          current={current}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
