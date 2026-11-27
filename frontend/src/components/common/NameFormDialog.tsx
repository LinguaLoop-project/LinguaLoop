import { useId, useState } from "react";
import Button from "./Button";
import Dialog from "./Dialog";
import { FormAlert } from "./FormAlert";
import { CATALOG_NAME_MAX, validateName, type NameSubmitResult } from "./nameField";

export interface NameFormDialogProps {
  title: string;
  label: string;
  /** Tên hiện có khi sửa; bỏ trống khi thêm mới. */
  initialName?: string;
  maxLength?: number;
  texts: { required: string; tooLong: string; save: string; cancel: string };
  /** Gọi khi tên hợp lệ; trả về lỗi để hiện trên biểu mẫu, giữ nguyên tên đã nhập. */
  onSubmit: (name: string) => Promise<NameSubmitResult>;
  onClose: () => void;
}

/**
 * Biểu mẫu một ô tên dùng cho thêm và sửa tên chủ đề, danh mục (UC-CD-02, 03, 05, 06). Hủy thì đóng và không lưu gì;
 * lưu lỗi thì giữ nguyên tên đã nhập để lưu lại.
 */
export default function NameFormDialog({
  title,
  label,
  initialName = "",
  maxLength = CATALOG_NAME_MAX,
  texts,
  onSubmit,
  onClose,
}: Readonly<NameFormDialogProps>) {
  const titleId = useId();
  const inputId = useId();
  const [name, setName] = useState(initialName);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setNotice(null);
    const error = validateName(name, maxLength);
    if (error) {
      setFieldError(error === "required" ? texts.required : texts.tooLong);
      return;
    }
    setPending(true);
    try {
      const result = await onSubmit(name.trim());
      if (!result.ok) {
        setFieldError(result.fieldError ?? null);
        setNotice(result.notice ?? null);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open onClose={pending ? () => undefined : onClose} labelledBy={titleId}>
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <h2 id={titleId} className="text-lg font-bold text-text">
          {title}
        </h2>
        {notice && <FormAlert variant="danger">{notice}</FormAlert>}
        <label htmlFor={inputId} className="flex flex-col gap-1 text-sm text-text">
          {label}
          <input
            id={inputId}
            value={name}
            autoFocus
            maxLength={maxLength + 20}
            onChange={(e) => {
              setName(e.target.value);
              setFieldError(null);
            }}
            aria-invalid={fieldError ? true : undefined}
            className={`h-10 rounded-md border bg-surface px-3 text-text ${fieldError ? "border-danger" : "border-border"}`}
          />
          {fieldError && <span className="text-danger">{fieldError}</span>}
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {texts.cancel}
          </Button>
          <Button type="submit" isLoading={pending}>
            {texts.save}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
