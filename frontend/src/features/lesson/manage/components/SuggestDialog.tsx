import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import SegmentedControl from "@/components/common/SegmentedControl";
import { errorMessage } from "../errors";
import { useSuggest } from "../hooks";
import {
  suggestTargets,
  type DraftRow,
  type SuggestMode,
  type SuggestScope,
} from "../sentenceDraft";
import type { SuggestionResult } from "../types";

const TITLE_ID = "suggest-title";

export interface SuggestDialogProps {
  lessonId: string;
  rows: DraftRow[];
  selected: Set<string>;
  onClose: () => void;
  /** Điền gợi ý vào các ô (chưa lưu); `mode` cho biết có ghi đè ô đã có hay không. */
  onApply: (result: SuggestionResult, mode: SuggestMode) => void;
}

/**
 * Sinh gợi ý bản dịch tiếng Việt bằng AI cho các câu (UC-BH-10). Chọn phạm vi, nội dung, cách
 * điền; "Ghi đè" phải xác nhận (3a).
 */
export default function SuggestDialog({ lessonId, rows, selected, onClose, onApply }: Readonly<SuggestDialogProps>) {
  const { t } = useTranslation("lessonManage");
  const [scope, setScope] = useState<SuggestScope>(selected.size > 0 ? "selected" : "all");
  const [mode, setMode] = useState<SuggestMode>("empty");
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggest = useSuggest(lessonId);
  const targets = suggestTargets(rows, selected, scope, mode);
  // Lần gọi trước lỗi (AI lỗi, mất kết nối): nút chạy thành "Thử lại" (UC-BH-10 4b, 4c).
  let runLabel = t("suggest.run");
  if (confirmOverwrite) runLabel = t("suggest.confirmOverwrite");
  else if (error) runLabel = t("suggest.retry");

  const run = () => {
    if (mode === "overwrite" && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }
    setError(null);
    suggest.mutate(
      {
        sentences: targets.map((r) => ({ id: r.id, textEn: r.textEn.trim() })),
        // Chỉ sinh bản dịch: IPA do server tạo khi lưu, giáo viên không sửa (BR-BH-13).
        translation: true,
        ipa: false,
      },
      {
        onSuccess: (result) => {
          onApply(result, mode);
          onClose();
        },
        onError: (e) => {
          setConfirmOverwrite(false);
          setError(errorMessage(t, e));
        },
      },
    );
  };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID} wide>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t("suggest.title")}
        </h2>
        <p className="-mt-2 text-sm text-text-muted">{t("suggest.desc")}</p>
        {error && <FormAlert variant="danger">{error}</FormAlert>}

        <div className="flex flex-col gap-1.5 text-sm text-text">
          <span className="font-medium">{t("suggest.scope")}</span>
          <SegmentedControl
            ariaLabel={t("suggest.scope")}
            value={scope}
            onChange={(v) => setScope(v as SuggestScope)}
            options={[
              { value: "selected", label: t("suggest.scopeSelected", { count: selected.size }) },
              { value: "all", label: t("suggest.scopeAll") },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-text">
          <span className="font-medium">{t("suggest.mode")}</span>
          <SegmentedControl
            ariaLabel={t("suggest.mode")}
            value={mode}
            onChange={(v) => {
              setMode(v as SuggestMode);
              setConfirmOverwrite(false);
            }}
            options={[
              { value: "empty", label: t("suggest.modeEmpty") },
              { value: "overwrite", label: t("suggest.modeOverwrite") },
            ]}
          />
        </div>

        <p className="text-sm text-text-muted">
          {t("suggest.targets", { count: targets.length })}
        </p>
        {confirmOverwrite && <FormAlert variant="warning">{t("suggest.overwriteConfirm")}</FormAlert>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={suggest.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="button" isLoading={suggest.isPending} disabled={targets.length === 0} onClick={run}>
            {runLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
