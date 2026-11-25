import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileUploadError, uploadFile } from "@/api/fileUpload";
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { toApiError, useAuthStore } from "@/features/auth";
import { userApi } from "../api";
import { AVATAR_INPUT_TYPES, avatarProblem, cropAndCompressAvatar } from "../avatarImage";

type Notice = { kind: "success" | "danger"; key: string } | null;

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

/**
 * Ảnh đại diện ở tab Tài khoản (UC-TK-10, BR-TK-19): chọn ảnh, cắt vuông và nén ngay trên trình duyệt, tải thẳng lên S3 rồi
 * lưu khóa tệp; "Gỡ ảnh" quay về ảnh Google hoặc chữ cái đầu. Mọi bước lỗi đều báo bằng một câu và không đổi ảnh cũ.
 */
export default function AvatarPicker({ name }: { name: string }) {
  const { t } = useTranslation("auth");
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  if (!user) return null;

  const choose = async (file: File) => {
    const problem = avatarProblem(file);
    if (problem) {
      setNotice({ kind: "danger", key: problem === "type" ? "type" : "inputSize" });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const small = await cropAndCompressAvatar(file);
      const key = await uploadFile("AVATAR", small);
      const response = await userApi.setAvatar(key);
      setUser(response.data.data);
      setNotice({ kind: "success", key: "saved" });
    } catch (err: unknown) {
      setNotice({ kind: "danger", key: errorKeyOf(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await userApi.removeAvatar();
      setUser(response.data.data);
      setNotice({ kind: "success", key: "removed" });
    } catch (err: unknown) {
      setNotice({ kind: "danger", key: errorKeyOf(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="size-20 rounded-full border border-border object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span aria-hidden="true" className="grid size-20 place-items-center rounded-full bg-primary-soft font-display text-2xl font-bold text-primary-text">
          {initialsOf(name)}
        </span>
      )}
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
      <div className="flex flex-wrap justify-center gap-1.5">
        <Button type="button" variant="secondary" size="sm" disabled={busy} isLoading={busy} leftIcon={<Icon name="image-plus" />} onClick={() => inputRef.current?.click()}>
          {busy ? t("settings.account.avatar.uploading") : t("settings.account.avatar.change")}
        </Button>
        {user.customAvatar && (
          <Button type="button" variant="ghost" size="sm" disabled={busy} leftIcon={<Icon name="trash-2" />} onClick={() => void remove()}>
            {t("settings.account.avatar.remove")}
          </Button>
        )}
      </div>
      <p className="max-w-[12rem] text-center text-xs text-text-muted">{t("settings.account.avatar.hint")}</p>
      {notice && (
        <FormAlert variant={notice.kind}>
          {t(notice.kind === "success" ? `settings.account.avatar.${notice.key}` : `settings.account.avatar.errors.${notice.key}`)}
        </FormAlert>
      )}
    </div>
  );
}
