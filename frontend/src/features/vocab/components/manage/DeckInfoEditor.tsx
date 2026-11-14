import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { useDeckCategories, useUpdateTeacherDeck } from "../../deckManageHooks";
import type { DeckDetail } from "../../deckManageTypes";
import { FilterSelect, ToggleChip } from "./DeckBits";
import {
  editValuesFromDetail,
  isEditDirty,
  submitEditDeck,
  type EditDeckErrors,
  type EditDeckValues,
} from "../../editDeckForm";

export interface DeckInfoEditorProps {
  deck: DeckDetail;
  /** Bộ đã bị xóa ở nơi khác khi lưu (AC-BT-18). */
  onGone: () => void;
}

/**
 * Sửa thông tin bộ ngay trên trang bộ (UC-BT-03): tên, ảnh, danh mục, yêu cầu Pro. Có thay đổi thì hiện thanh
 * "Lưu / Hủy" ở đáy màn hình; lỗi hiện cạnh ô và giữ nguyên thay đổi (AC-BT-19, 21). Rời trang khi chưa lưu thì trình
 * duyệt hỏi lại.
 */
export default function DeckInfoEditor({ deck, onGone }: DeckInfoEditorProps) {
  const { t } = useTranslation("vocab");
  const [values, setValues] = useState<EditDeckValues>(() => editValuesFromDetail(deck));
  const [errors, setErrors] = useState<EditDeckErrors>({});
  const fileInput = useRef<HTMLInputElement>(null);
  const mutation = useUpdateTeacherDeck(deck.id);
  const categories = useDeckCategories("teacher").data ?? [];
  const dirty = isEditDirty(values, deck);
  const set = (patch: Partial<EditDeckValues>) => setValues((v) => ({ ...v, ...patch }));

  const localPreview = useMemo(() => (values.image ? URL.createObjectURL(values.image) : null), [values.image]);
  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);
  const shownImage = localPreview ?? (values.removeImage ? null : deck.imageUrl);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const nameError: Record<string, string> = {
    NotBlank: t("manage.form.nameRequired"),
    Size: t("manage.form.nameTooLong"),
    Duplicate: t("manage.form.nameDuplicate"),
  };

  const reset = () => {
    setValues(editValuesFromDetail(deck));
    setErrors({});
    if (fileInput.current) fileInput.current.value = "";
  };

  const save = async () => {
    const result = await submitEditDeck(values, (input, image) => mutation.mutateAsync({ input, image }));
    if (result.ok) {
      setValues(editValuesFromDetail(result.deck));
      setErrors({});
      if (fileInput.current) fileInput.current.value = "";
      toast(t("manage.feedback.updateDone"), { icon: "circle-check" });
      return;
    }
    if (result.errors.form === "notFound") {
      onGone();
      return;
    }
    setValues(result.values);
    setErrors(result.errors);
  };

  return (
    <form
      className="flex min-w-0 flex-1 flex-wrap items-start gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      noValidate
    >
      <div className="flex flex-col items-center gap-1">
        <div className="group relative">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            aria-label={t("manage.form.changeImage")}
            title={t("manage.form.changeImage")}
            className="relative grid h-28 w-36 place-items-center overflow-hidden rounded-xl border border-border bg-[linear-gradient(135deg,var(--fn-vocab-soft),var(--primary-soft))] focus-visible:outline-2 focus-visible:outline-primary"
          >
            {shownImage ? (
              <img src={shownImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon name="gallery-vertical-end" className="text-4xl text-fn-vocab" />
            )}
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[rgba(7,5,13,.55)] text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <Icon name="image-plus" className="text-xl" />
              {t("manage.form.changeImage")}
            </span>
          </button>
          {shownImage && (
            <button
              type="button"
              aria-label={t("manage.form.removeImage")}
              title={t("manage.form.removeImage")}
              onClick={() => {
                set({ image: null, removeImage: true });
                if (fileInput.current) fileInput.current.value = "";
              }}
              className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full border border-border-strong bg-surface text-text-muted shadow-[var(--shadow-card)] transition-colors hover:border-danger hover:text-danger focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Icon name="x" className="size-4" />
            </button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => set({ image: e.target.files?.[0] ?? null, removeImage: false })}
        />
        {errors.image && <span className="max-w-36 text-center text-xs text-danger">{t("manage.form.imageInvalid")}</span>}
      </div>

      <div className="flex min-w-60 flex-1 flex-col gap-2">
        <label className="sr-only" htmlFor="deck-name">
          {t("manage.form.name")}
        </label>
        <div className="group/name relative">
          <input
            id="deck-name"
            value={values.name}
            maxLength={120}
            onChange={(e) => set({ name: e.target.value })}
            aria-invalid={errors.name !== undefined}
            className="w-full rounded-md border border-transparent bg-transparent py-1 pl-2 pr-9 text-2xl font-bold text-text transition-colors hover:border-border focus:border-border-strong focus:outline-none"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 text-text-subtle opacity-0 transition-opacity group-hover/name:opacity-100 group-focus-within/name:opacity-0">
            <Icon name="pencil-line" />
          </span>
        </div>
        {errors.name && <span className="px-2 text-sm text-danger">{nameError[errors.name]}</span>}
        <div className="flex flex-wrap items-center gap-2 px-2">
          <FilterSelect
            icon="folders"
            label={t("manage.category")}
            value={values.categoryId ?? ""}
            onChange={(value) => set({ categoryId: value || null })}
          >
            <option value="">{t("manage.otherCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FilterSelect>
          <ToggleChip icon="crown" label={t("manage.form.pro")} checked={values.pro} onChange={(pro) => set({ pro })} />
        </div>
        {errors.categoryId && <span className="px-2 text-sm text-danger">{t("manage.form.categoryInvalid")}</span>}
        {errors.form === "failed" && <FormAlert variant="danger">{t("manage.form.saveFailed")}</FormAlert>}
        {errors.form === "forbidden" && <FormAlert variant="danger">{t("manage.feedback.forbidden")}</FormAlert>}
      </div>

      {dirty && (
        <div
          role="region"
          aria-label={t("manage.form.unsaved")}
          className="fixed bottom-6 left-1/2 z-50 flex w-[min(560px,calc(100vw-32px))] -translate-x-1/2 items-center gap-3 rounded-lg border border-border-strong bg-surface px-4 py-3 shadow-[var(--shadow-card)]"
        >
          <Icon name="circle-dot" className="text-warning" />
          <span className="flex-1 text-sm text-text">{t("manage.form.unsaved")}</span>
          <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={mutation.isPending}>
            {t("manage.form.cancel")}
          </Button>
          <Button type="submit" size="sm" isLoading={mutation.isPending} leftIcon={<Icon name="save" />}>
            {t("manage.form.save")}
          </Button>
        </div>
      )}
    </form>
  );
}
