import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { FormAlert } from "@/components/common/FormAlert";
import TextField from "@/components/common/TextField";
import {
  EMPTY_CREATE_DECK,
  cancelCreateDeck,
  submitCreateDeck,
  type CreateDeckErrors,
  type CreateDeckValues,
} from "../../createDeckForm";
import { useCreateTeacherDeck, useDeckCategories } from "../../deckManageHooks";
import { TEACHER_DECKS_PATH } from "../../deckManagePaths";

/**
 * Biểu mẫu tạo bộ thẻ (UC-BT-02): tên (bắt buộc), ảnh JPG/PNG tối đa 2 MB, danh mục, yêu cầu gói Pro. Lỗi giữ nguyên
 * dữ liệu đã nhập; tạo xong chuyển tới màn quản lý bộ.
 */
export default function TeacherDeckCreatePage() {
  const { t } = useTranslation("vocab");
  const navigate = useNavigate();
  const [values, setValues] = useState<CreateDeckValues>(EMPTY_CREATE_DECK);
  const [errors, setErrors] = useState<CreateDeckErrors>({});
  const mutation = useCreateTeacherDeck();
  const categories = useDeckCategories("teacher").data ?? [];
  const set = (patch: Partial<CreateDeckValues>) => setValues((v) => ({ ...v, ...patch }));

  const nameError: Record<string, string> = {
    NotBlank: t("manage.form.nameRequired"),
    Size: t("manage.form.nameTooLong"),
    Duplicate: t("manage.form.nameDuplicate"),
  };
  const imageError = t("manage.form.imageInvalid");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await submitCreateDeck(values, (input, image) => mutation.mutateAsync({ input, image }));
    if (result.ok) {
      navigate(`${TEACHER_DECKS_PATH}/${result.deck.id}`, { state: { created: true } });
      return;
    }
    setValues(result.values);
    setErrors(result.errors);
  };

  const onCancel = () => {
    setValues(cancelCreateDeck());
    navigate(TEACHER_DECKS_PATH);
  };

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 p-6">
      <h1 className="text-2xl font-bold text-text">{t("manage.create")}</h1>
      <form className="flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)} noValidate>
        {errors.form && <FormAlert variant="danger">{t("manage.form.failed")}</FormAlert>}
        <TextField
          id="deck-name"
          label={t("manage.form.name")}
          value={values.name}
          maxLength={120}
          onChange={(e) => set({ name: e.target.value })}
          error={errors.name ? nameError[errors.name] : undefined}
        />
        <label className="flex flex-col gap-1 text-sm text-text">
          {t("manage.form.image")}
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => set({ image: e.target.files?.[0] ?? null })}
          />
          {errors.image && <span className="text-danger">{imageError}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm text-text">
          {t("manage.category")}
          <select
            className="rounded-md border border-border bg-surface px-3 py-2"
            value={values.categoryId ?? ""}
            onChange={(e) => set({ categoryId: e.target.value || null })}
          >
            <option value="">{t("manage.noCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <span className="text-danger">{t("manage.form.categoryInvalid")}</span>
          )}
        </label>
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={values.pro} onChange={(e) => set({ pro: e.target.checked })} />
          {t("manage.form.pro")}
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} leftIcon={<Icon name="x" />}>
            {t("manage.form.cancel")}
          </Button>
          <Button type="submit" isLoading={mutation.isPending} leftIcon={<Icon name="plus" />}>
            {t("manage.form.submit")}
          </Button>
        </div>
      </form>
    </main>
  );
}
