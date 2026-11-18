import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import type { ReportTargetType } from "../types";

const TITLE = "content-preview-title";

export interface ContentPreviewDialogProps {
  targetType: ReportTargetType;
  /** Nội dung hiện tại của câu hoặc thẻ; rỗng khi nội dung đã bị xóa. */
  content: Record<string, string | null>;
  /** Ảnh minh họa của thẻ, nếu có. */
  imageUrl?: string | null;
  containerName: string;
  onClose: () => void;
}

/**
 * Xem nội dung bị báo đúng như học viên thấy (UC-XL-01 nhánh 8a): câu với phụ đề, IPA và bản dịch; thẻ với từ, phiên
 * âm, nghĩa, định nghĩa và câu ví dụ. Chỉ xem, không đổi nội dung hay báo cáo.
 */
export default function ContentPreviewDialog({
  targetType,
  content,
  imageUrl,
  containerName,
  onClose,
}: Readonly<ContentPreviewDialogProps>) {
  const { t } = useTranslation("report");
  const empty = Object.keys(content).length === 0;

  let body;
  if (empty) {
    body = <p className="text-sm text-text-muted">{t("preview.deleted")}</p>;
  } else if (targetType === "sentence") {
    body = <SentencePreview content={content} />;
  } else {
    body = <CardPreview content={content} imageUrl={imageUrl ?? null} />;
  }

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 id={TITLE} className="text-lg font-bold text-text">
            {t("preview.title")}
          </h2>
          <p className="text-sm text-text-muted">{containerName}</p>
        </div>
        {body}
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("preview.close")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function Ipa({ label, value }: Readonly<{ label: string; value: string | null | undefined }>) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
      <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-[11px] font-semibold">{label}</span>
      <span className="font-mono">{value}</span>
    </span>
  );
}

function SentencePreview({ content }: Readonly<{ content: Record<string, string | null> }>) {
  const { t } = useTranslation("report");
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <p className="text-xl font-semibold leading-relaxed text-text">{content.text_en}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Ipa label="US" value={content.ipa_us} />
        <Ipa label="UK" value={content.ipa_uk} />
      </div>
      <p className="border-t border-border pt-3 text-base text-text">{content.text_vi ?? t("preview.noTranslation")}</p>
    </div>
  );
}

function CardPreview({
  content,
  imageUrl,
}: Readonly<{ content: Record<string, string | null>; imageUrl: string | null }>) {
  const { t } = useTranslation("report");
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={content.word ?? ""}
          className="aspect-video w-full rounded-lg border border-border bg-bg-elevated object-cover"
        />
      )}
      <div className="flex flex-col gap-1.5">
        <p className="text-2xl font-bold text-text">{content.word}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Ipa label="UK" value={content.ipa_uk} />
          <Ipa label="US" value={content.ipa_us} />
        </div>
      </div>
      <p className="text-base font-semibold text-fn-vocab">{content.meaning_vi}</p>
      {(content.definition_en || content.definition_vi) && (
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("preview.definition")}</span>
          {content.definition_en && <p className="text-text">{content.definition_en}</p>}
          {content.definition_vi && <p className="text-text-muted">{content.definition_vi}</p>}
        </div>
      )}
      {(content.example_en || content.example_vi) && (
        <div className="flex flex-col gap-1 border-l-2 border-fn-vocab pl-3 text-sm">
          {content.example_en && <p className="italic text-text">{content.example_en}</p>}
          {content.example_vi && <p className="text-text-muted">{content.example_vi}</p>}
        </div>
      )}
    </div>
  );
}
