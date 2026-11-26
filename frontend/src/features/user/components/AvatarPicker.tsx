import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FileUploadError, uploadFile } from "@/api/fileUpload";
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { toApiError, useAuthStore } from "@/features/auth";
import { toast } from "@/stores/toastStore";
import { userApi } from "../api";
import { AVATAR_INPUT_TYPES, avatarProblem, cropAndCompressAvatar } from "../avatarImage";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0]?.[0] ?? "?"];
  return letters.join("").toUpperCase();
}

/** Khóa thông báo lỗi (dưới `settings.account.avatar.errors`) cho từng nguyên nhân tải ảnh thất bại. */
function errorKeyOf(err: unknown): string {
  if (err instanceof FileUploadError) return "uploadFailed";
  if (err instanceof DOMException || (err instanceof Error && !("response" in err))) return "unreadable";
  const error = toApiError(err);
  if (error.code === "STORAGE_UNAVAILABLE") return "unavailable";
  const code = error.errors[0]?.code;
  if (code === "ImageType" || code === "UploadType") return "type";
  if (code === "MaxBytes") return "size";
  return "failed";
}

export interface AvatarPickerProps {
  name: string;
  /** Nội dung thông tin tài khoản hiển thị bên cạnh ảnh đại diện (tên, email, huy hiệu). */
  children?: ReactNode;
}

/**
 * Ảnh đại diện ở tab Tài khoản (UC-TK-10, BR-TK-19): chọn ảnh (qua nút camera trên ảnh hoặc nút Đổi ảnh), cắt vuông và
 * nén ngay trên trình duyệt, tải thẳng lên S3 rồi lưu khóa tệp; "Gỡ ảnh" quay về ảnh Google hoặc chữ cái đầu.
 */
export default function AvatarPicker({ name, children }: AvatarPickerProps) {
  const { t } = useTranslation("auth");
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  if (!user) return null;

  const choose = async (file: File) => {
    const problem = avatarProblem(file);
    if (problem) {
      setErrorKey(problem === "type" ? "type" : "inputSize");
      return;
    }
    setBusy(true);
    setErrorKey(null);
    try {
      const small = await cropAndCompressAvatar(file);
      const key = await uploadFile("AVATAR", small);
      const response = await userApi.setAvatar(key);
      setUser(response.data.data);
      toast(t("settings.account.avatar.saved"), { icon: "circle-check" });
    } catch (err: unknown) {
      setErrorKey(errorKeyOf(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setErrorKey(null);
    try {
      const response = await userApi.removeAvatar();
      setUser(response.data.data);
      toast(t("settings.account.avatar.removed"), { icon: "circle-check" });
    } catch (err: unknown) {
      setErrorKey(errorKeyOf(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="size-20 rounded-full border border-border object-cover shadow-xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-20 place-items-center rounded-full border border-border-strong bg-primary-soft font-display text-2xl font-bold text-primary-text"
            >
              {initialsOf(name)}
            </span>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            aria-label={t("settings.account.avatar.change")}
            title={t("settings.account.avatar.change")}
            className="absolute -bottom-0.5 -right-0.5 grid size-8 cursor-pointer place-items-center rounded-full border-2 border-surface bg-[var(--btn-primary)] text-white shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-[var(--btn-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name={busy ? "loader-circle" : "camera"} className={`text-sm ${busy ? "animate-spin" : ""}`} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_INPUT_TYPES.join(",")}
          className="hidden"
          aria-label={t("settings.account.avatar.change")}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void choose(file);
          }}
        />

        {children}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            isLoading={busy}
            leftIcon={<Icon name="image-plus" />}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? t("settings.account.avatar.uploading") : t("settings.account.avatar.change")}
          </Button>
          {user.customAvatar && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              className="text-text-muted hover:text-danger"
              leftIcon={<Icon name="trash-2" />}
              onClick={() => void remove()}
            >
              {t("settings.account.avatar.remove")}
            </Button>
          )}
        </div>
        <p className="text-xs text-text-subtle">{t("settings.account.avatar.hint")}</p>
      </div>

      {errorKey && <FormAlert variant="danger">{t(`settings.account.avatar.errors.${errorKey}`)}</FormAlert>}
    </div>
  );
}
