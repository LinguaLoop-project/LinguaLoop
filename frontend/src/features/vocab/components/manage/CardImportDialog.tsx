import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { deckContentApi } from "../../deckContentApi";
import { importFailure, validateImportFile, type ContentFailure, type ImportFailure } from "../../deckContentForm";
import { useImportCards, usePreviewImport } from "../../deckContentHooks";
import type { ImportRowError, TemplateFormat } from "../../deckContentTypes";
import type { DeckApiError, DeckGroup } from "../../deckManageTypes";

export interface CardImportDialogProps {
  deckId: string;
  group: DeckGroup;
  onClose: () => void;
  onFailure: (failure: ContentFailure) => void;
}

const TITLE_ID = "card-import-title";
/** Hiện tối đa chừng này lỗi dòng; còn lại gộp thành "… và N lỗi khác". */
const MAX_ROW_ERRORS = 20;

/** Trường của thẻ mà máy chủ có thể báo lỗi; tên hiển thị trùng tên cột trong tệp mẫu. */
const CARD_FIELDS = new Set([
  "word",
  "meaningVi",
  "ipaUk",
  "ipaUs",
  "pos",
  "definitionEn",
  "definitionVi",
  "exampleEn",
  "exampleVi",
]);

/**
 * Nhập thẻ từ tệp (UC-NT-07): chọn tệp, máy chủ kiểm và trả số thẻ sẽ thêm, giáo viên bấm "Nhập". Tệp hoặc dòng sai thì
 * không thẻ nào được thêm và hiện lý do (luồng 7a, 7b, 7c); "Hủy" đóng hộp (luồng 8a); mất kết nối giữ tệp để nhập lại
 * (luồng 9a). Có liên kết tải tệp mẫu Excel và CSV (luồng 5a).
 */
export default function CardImportDialog({ deckId, group, onClose, onFailure }: Readonly<CardImportDialogProps>) {
  const { t } = useTranslation("vocab");
  const input = useRef<HTMLInputElement>(null);
  const preview = usePreviewImport(deckId, group.id);
  const importCards = useImportCards(deckId, group.id);
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [problem, setProblem] = useState<ImportFailure | null>(null);
  const [failed, setFailed] = useState(false);

  const handle = (failure: ImportFailure) => {
    if (failure.kind !== "content") {
      setProblem(failure);
      return;
    }
    if (failure.failure.kind === "retry" || failure.failure.kind === "fields") {
      setFailed(true);
      return;
    }
    onFailure(failure.failure);
    onClose();
  };

  const choose = (chosen: File | null) => {
    setFile(chosen);
    setCount(null);
    setProblem(null);
    setFailed(false);
    if (!chosen) return;
    const invalid = validateImportFile(chosen);
    if (invalid) {
      setProblem({ kind: "file", reason: invalid, missingColumns: [] });
      return;
    }
    preview.mutate(chosen, {
      onSuccess: (result) => setCount(result.cardCount),
      onError: (e: unknown) => handle(importFailure(e as DeckApiError)),
    });
  };

  const confirm = () => {
    if (!file) return;
    setFailed(false);
    importCards.mutate(file, {
      onSuccess: (result) => {
        toast(t("content.import.done", { count: result.addedCount }), { icon: "circle-check" });
        onClose();
      },
      onError: (e: unknown) => handle(importFailure(e as DeckApiError)),
    });
  };

  const download = (format: TemplateFormat) => {
    deckContentApi.downloadTemplate(format).catch(() => toast(t("content.import.templateFailed"), { icon: "circle-alert" }));
  };

  const rowMessage = (error: ImportRowError) => {
    const field = t(`content.card.fields.${CARD_FIELDS.has(error.field) ? error.field : "word"}`);
    const message = t(`content.import.rowCodes.${error.code}`, {
      field,
      otherRow: error.otherRow,
      defaultValue: t("content.import.rowCodes.Pattern"),
    });
    return t("content.import.row", { row: error.row, message });
  };

  const problemView = () => {
    if (!problem) return null;
    if (problem.kind === "file") {
      return (
        <FormAlert variant="danger">
          {t(`content.import.file.${problem.reason}`, { columns: problem.missingColumns.join(", ") })}
        </FormAlert>
      );
    }
    if (problem.kind === "tooManyRows") {
      return <FormAlert variant="danger">{t("content.import.tooManyRows", { max: problem.max })}</FormAlert>;
    }
    if (problem.kind === "rows") {
      const shown = problem.errors.slice(0, MAX_ROW_ERRORS);
      const more = problem.errors.length - shown.length;
      return (
        <FormAlert variant="danger">
          <p className="font-semibold">{t("content.import.rowsTitle", { count: problem.errors.length })}</p>
          <ul className="mt-1 max-h-48 list-disc overflow-y-auto pl-5">
            {shown.map((error, index) => (
              <li key={`${error.row}-${error.field}-${index}`}>{rowMessage(error)}</li>
            ))}
          </ul>
          {more > 0 && <p className="mt-1">{t("content.import.moreRows", { count: more })}</p>}
        </FormAlert>
      );
    }
    return null;
  };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID} wide>
      <div className="flex max-h-[80vh] flex-col gap-4">
        <div>
          <h2 id={TITLE_ID} className="text-lg font-bold text-text">
            {t("content.import.title")}
          </h2>
          <p className="text-sm text-text-muted">{t("content.import.intoGroup", { name: group.name })}</p>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto">
          <p className="text-[13px] leading-normal text-text-muted">{t("content.import.rules")}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-text">
            <span>{t("content.import.template")}</span>
            <Button size="sm" variant="ghost" leftIcon={<Icon name="download" />} onClick={() => download("xlsx")}>
              {t("content.import.templateXlsx")}
            </Button>
            <Button size="sm" variant="ghost" leftIcon={<Icon name="download" />} onClick={() => download("csv")}>
              {t("content.import.templateCsv")}
            </Button>
          </div>

          <input
            ref={input}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              choose(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex items-center gap-3 rounded-lg border border-dashed border-border-strong p-4 text-left hover:bg-surface-hover"
          >
            <Icon name="file-spreadsheet" className="text-2xl text-fn-vocab" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-semibold text-text">{file ? file.name : t("content.import.choose")}</span>
              {file && <span className="text-[13px] text-text-muted">{t("content.import.change")}</span>}
            </span>
            <Icon name="upload" className="text-xl text-text-muted" />
          </button>

          {preview.isPending && <p className="text-sm text-text-muted">{t("content.import.checking")}</p>}
          {count !== null && !problem && (
            <FormAlert variant="success" role="status">
              {t("content.import.summary", { count })}
            </FormAlert>
          )}
          {problemView()}
          {failed && <FormAlert variant="danger">{t("content.import.failed")}</FormAlert>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" onClick={onClose} disabled={importCards.isPending}>
            {t("content.import.cancel")}
          </Button>
          <Button
            leftIcon={<Icon name="upload" />}
            disabled={count === null || problem !== null || preview.isPending}
            isLoading={importCards.isPending}
            onClick={confirm}
          >
            {t("content.import.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
