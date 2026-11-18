import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { useSubmitReport } from "../hooks";
import {
  REASONS,
  REPORT_TEXT_MAX,
  defaultFixField,
  fixFieldsOf,
  requiresFix,
  toSubmitInput,
  validateReportForm,
  type ReportFormErrors,
  type ReportFormValues,
} from "../reportForm";
import type { ReportApiError, ReportReason, ReportTargetType } from "../types";

export interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  /** Nội dung đang báo (câu hoặc từ vựng), hiện ở đầu hộp để học viên chắc chắn báo đúng chỗ. */
  label?: string;
  /** Giá trị hiện tại các cột của nội dung (khóa như `text_vi`, `word`) để chặn bản sửa giống hệt; không bắt buộc. */
  current?: Record<string, string | null>;
  onClose: () => void;
}

const TITLE_ID = "report-dialog-title";

const REASON_ICONS: Record<ReportReason, string> = {
  subtitle_en: "pencil-line",
  ipa: "audio-lines",
  translation: "globe",
  timing: "timer",
  word: "book-open-text",
  phonetic: "volume-2",
  meaning: "lightbulb",
  example: "messages-square",
  offensive: "triangle-alert",
  other: "ellipsis",
};

function charCount(text: string): number {
  return Array.from(text.trim()).length;
}

/** Ô nhập nhiều dòng cùng kiểu với `TextField`: viền, vòng focus, lỗi kèm icon, bộ đếm ký tự. */
function TextArea({
  id,
  label,
  required,
  value,
  onChange,
  placeholder,
  error,
  aside,
}: Readonly<{
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  aside?: React.ReactNode;
}>) {
  const count = charCount(value);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-text">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        )}
      </label>
      {aside}
      <div
        className={`rounded-md border bg-surface transition-[border-color,box-shadow] duration-150 focus-within:shadow-[0_0_0_3px_var(--primary-soft)] ${
          error
            ? "border-danger focus-within:border-danger focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--danger)_22%,transparent)]"
            : "border-border-strong focus-within:border-primary"
        }`}
      >
        <textarea
          id={id}
          rows={3}
          value={value}
          placeholder={placeholder}
          maxLength={REPORT_TEXT_MAX + 100}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          className="block w-full resize-none border-0 bg-transparent px-3.5 pt-3 text-[15px] leading-[1.45] text-text outline-none placeholder:text-text-subtle"
        />
        <div className="flex justify-end px-3.5 pb-2 text-xs tabular-nums">
          <span className={count > REPORT_TEXT_MAX ? "text-danger" : "text-text-subtle"}>
            {count}/{REPORT_TEXT_MAX}
          </span>
        </div>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-[13px] text-danger">
          <Icon name="circle-alert" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/** Lỗi theo trường do server trả về, đổi về mã lỗi của biểu mẫu. */
function formErrorsOf(error: ReportApiError): ReportFormErrors {
  const next: ReportFormErrors = {};
  for (const { field, code } of error.fieldErrors) {
    if (field === "reason" || field === "fixField" || field === "suggestedFix" || field === "description") {
      next[field] = code === "Size" || code === "Different" ? code : "NotBlank";
    }
  }
  return next;
}

/** Một ô lý do: icon, tên, dấu đã chọn; Phản cảm dùng màu cảnh báo. Radio thật được ẩn nên bàn phím vẫn chọn được. */
function ReasonOption({
  reason,
  label,
  selected,
  onSelect,
}: Readonly<{ reason: ReportReason; label: string; selected: boolean; onSelect: () => void }>) {
  const danger = reason === "offensive";
  const accent = danger ? "text-danger" : "text-primary";
  let tone = "border-border text-text-muted hover:border-border-strong hover:text-text";
  if (selected) {
    tone = danger
      ? "border-danger bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-text"
      : "border-primary bg-[var(--primary-soft)] text-text";
  }
  return (
    <label
      className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${tone}`}
    >
      <input
        type="radio"
        name="report-reason"
        value={reason}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <Icon name={REASON_ICONS[reason]} className={`size-4 shrink-0 ${selected ? accent : ""}`} />
      <span className="flex-1 font-medium">{label}</span>
      {selected && <Icon name="circle-check" className={`size-4 ${accent}`} />}
    </label>
  );
}

/**
 * Chọn trường cần sửa của lý do gồm nhiều trường (BR-BC-11), mỗi trường kèm giá trị hiện tại để học viên đối chiếu.
 * Radio thật được ẩn nên bàn phím vẫn chọn được.
 */
function FieldPicker({
  fields,
  value,
  current,
  onChange,
  error,
}: Readonly<{
  fields: string[];
  value: string;
  current?: Record<string, string | null>;
  onChange: (field: string) => void;
  error?: string;
}>) {
  const { t } = useTranslation("report");
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-text">
        {t("submit.fixField")}
        <span aria-hidden="true" className="ml-0.5 text-danger">
          *
        </span>
      </legend>
      <div className="flex flex-col gap-1.5">
        {fields.map((field) => {
          const selected = value === field;
          const shown = current?.[field];
          return (
            <label
              key={field}
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
                selected
                  ? "border-primary bg-[var(--primary-soft)]"
                  : "border-border hover:border-border-strong"
              }`}
            >
              <input
                type="radio"
                name="report-fix-field"
                value={field}
                checked={selected}
                onChange={() => onChange(field)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-primary" : "border-border-strong"
                }`}
              >
                {selected && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-medium text-text">{t(`fields.${field}`)}</span>
                <span className="truncate text-[13px] text-text-muted">{shown || t("submit.emptyField")}</span>
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-[13px] text-danger">
          <Icon name="circle-alert" />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}

/**
 * Hộp "Báo cáo nội dung" của học viên (UC-BC-01): chọn một lý do theo loại nội dung, nhập bản sửa đúng hoặc mô tả lỗi
 * (BR-BC-05). "Hủy" đóng hộp, không lưu gì. Mất kết nối thì giữ nguyên dữ liệu đã nhập để gửi lại.
 */
export default function ReportDialog({ targetType, targetId, label, current, onClose }: Readonly<ReportDialogProps>) {
  const { t } = useTranslation("report");
  const submit = useSubmitReport();
  const [values, setValues] = useState<ReportFormValues>({
    reason: "",
    fixField: "",
    suggestedFix: "",
    description: "",
  });
  const [errors, setErrors] = useState<ReportFormErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const reason = values.reason;
  const needsFix = reason !== "" && requiresFix(reason);
  const fields = reason !== "" ? fixFieldsOf(reason) : [];
  const currentValue = values.fixField ? current?.[values.fixField] : null;

  const send = () => {
    setFailure(null);
    const found = validateReportForm(values, current);
    setErrors(found);
    if (Object.keys(found).length > 0 || values.reason === "") return;
    submit.mutate(toSubmitInput(targetType, targetId, { ...values, reason: values.reason }), {
      onSuccess: () => {
        toast(t("submit.done"), { icon: "circle-check" });
        onClose();
      },
      onError: (error) => {
        const e = error as unknown as ReportApiError;
        if (e.kind === "validation" && e.fieldErrors.length > 0) {
          setErrors(formErrorsOf(e));
        } else if (e.kind === "conflict") {
          toast(t("submit.duplicate"), { icon: "circle-alert" });
          onClose();
        } else if (e.kind === "notFound") {
          toast(t("submit.notFound"), { icon: "circle-alert" });
          onClose();
        } else {
          setFailure(e.kind === "network" ? t("submit.network") : t("submit.failed"));
        }
      },
    });
  };

  const fixError = errors.suggestedFix
    ? {
        NotBlank: t("submit.errors.fixRequired"),
        Size: t("submit.errors.tooLong"),
        Different: t("submit.errors.fixSame"),
      }[errors.suggestedFix]
    : undefined;
  let descriptionError: string | undefined;
  if (errors.description === "Size") descriptionError = t("submit.errors.tooLong");
  else if (errors.description) descriptionError = t("submit.errors.descriptionRequired");

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID} wide>
      <form
        className="flex max-h-[80vh] flex-col gap-5 overflow-y-auto"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <header className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-danger">
            <Icon name="flag" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={TITLE_ID} className="text-lg font-bold text-text">
              {t("submit.title")}
            </h2>
            <p className="truncate text-sm text-text-muted">
              {t(`type.${targetType}`)}
              {label && (
                <>
                  {": "}
                  <span className="font-semibold text-text">{label}</span>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("submit.close")}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-subtle transition-colors hover:bg-bg-elevated hover:text-text"
          >
            <Icon name="x" />
          </button>
        </header>

        {failure && <FormAlert variant="danger">{failure}</FormAlert>}

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-sm font-semibold text-text">{t("submit.reason")}</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {REASONS[targetType].map((r) => (
              <ReasonOption
                key={r}
                reason={r}
                label={t(`reasons.${r}`)}
                selected={reason === r}
                onSelect={() => setValues((v) => ({ ...v, reason: r, fixField: defaultFixField(r) }))}
              />
            ))}
          </div>
          {errors.reason && (
            <p className="flex items-center gap-1.5 text-[13px] text-danger">
              <Icon name="circle-alert" />
              <span>{t("submit.errors.reason")}</span>
            </p>
          )}
        </fieldset>

        {needsFix && fields.length > 1 && (
          <FieldPicker
            fields={fields}
            value={values.fixField}
            current={current}
            onChange={(fixField) => setValues((v) => ({ ...v, fixField }))}
            error={errors.fixField ? t("submit.errors.fixField") : undefined}
          />
        )}

        {needsFix && (
          <TextArea
            id="report-fix"
            label={t("submit.fix")}
            required
            value={values.suggestedFix}
            onChange={(suggestedFix) => setValues((v) => ({ ...v, suggestedFix }))}
            placeholder={t("submit.fixPlaceholder")}
            error={fixError}
            aside={
              fields.length === 1 && currentValue ? (
                <p className="rounded-md bg-bg-elevated px-3 py-2 text-[13px] text-text-muted">
                  {t("submit.current")}: <span className="font-medium text-text">{currentValue}</span>
                </p>
              ) : undefined
            }
          />
        )}

        {reason !== "" && (
          <TextArea
            id="report-description"
            label={needsFix ? t("submit.descriptionOptional") : t("submit.description")}
            required={!needsFix}
            value={values.description}
            onChange={(description) => setValues((v) => ({ ...v, description }))}
            placeholder={t("submit.descriptionPlaceholder")}
            error={descriptionError}
          />
        )}

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submit.isPending}>
              {t("submit.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={submit.isPending || reason === ""}
              isLoading={submit.isPending}
              leftIcon={<Icon name="send" />}
            >
              {failure ? t("submit.retry") : t("submit.send")}
            </Button>
          </div>
        </footer>
      </form>
    </Dialog>
  );
}
