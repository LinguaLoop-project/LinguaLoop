import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import NameFormDialog from "@/components/common/NameFormDialog";
import type { NameSubmitResult } from "@/components/common/nameField";
import SearchInput from "@/components/common/SearchInput";
import Skeleton from "@/components/common/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatNumber, type AdminApiError } from "@/features/user";
import { toast } from "@/stores/toastStore";
import { categoryListState, categorySaveError, type AdminCategory } from "../../categoryAdmin";
import { useAdminCategories, useCreateCategory, useRenameCategory } from "../../categoryAdminHooks";

const SEARCH_DEBOUNCE_MS = 300;

/** null = đóng; "new" = thêm danh mục; một danh mục = sửa tên danh mục đó. */
type FormState = "new" | AdminCategory | null;

/**
 * Danh sách danh mục bộ thẻ của quản trị viên theo thứ tự hiển thị (UC-CD-04): tìm theo tên, thêm danh mục (UC-CD-05)
 * và sửa tên (UC-CD-06).
 */
export default function AdminCategoryPage() {
  const { t, i18n } = useTranslation("catalogAdmin");
  const [search, setSearch] = useState("");
  const q = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const query = useAdminCategories(q);
  const create = useCreateCategory();
  const rename = useRenameCategory();
  const [form, setForm] = useState<FormState>(null);

  const submit = async (name: string): Promise<NameSubmitResult> => {
    const editing = form !== "new" && form !== null ? form : null;
    if (editing && name === editing.name) {
      setForm(null);
      return { ok: true };
    }
    try {
      if (editing) await rename.mutateAsync({ id: editing.id, name });
      else await create.mutateAsync(name);
    } catch (raw) {
      return categorySaveError(raw as AdminApiError, {
        nameTaken: t("categories.form.nameTaken"),
        invalid: t("categories.form.required"),
        saveFailed: t("saveFailed"),
      });
    }
    toast(t(editing ? "categories.form.renamed" : "categories.form.created", { name }), { icon: "circle-check" });
    setForm(null);
    return { ok: true };
  };

  const items = query.data ?? [];
  const state = query.data ? categoryListState(items, q) : null;
  const systemEmpty = state === "none";

  let body;
  if (query.isLoading) {
    body = <Skeleton className="h-64 w-full" />;
  } else if (query.isError || !query.data) {
    body = (
      <div className="flex flex-col items-start gap-3">
        <FormAlert variant="danger">{t("categories.loadFailed")}</FormAlert>
        <Button type="button" leftIcon={<Icon name="rotate-cw" />} onClick={() => void query.refetch()}>
          {t("reload")}
        </Button>
      </div>
    );
  } else if (state === "none") {
    body = (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-text-muted">{t("categories.empty")}</p>
        <Button type="button" leftIcon={<Icon name="plus" />} onClick={() => setForm("new")}>
          {t("categories.add")}
        </Button>
      </div>
    );
  } else if (state === "noMatch") {
    body = (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-text-muted">{t("categories.noMatch")}</p>
        <Button type="button" variant="secondary" leftIcon={<Icon name="x" />} onClick={() => setSearch("")}>
          {t("clearFilters")}
        </Button>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-text-muted">{t("categories.count", { count: items.length })}</p>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-semibold">{t("categories.columns.name")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("categories.columns.publishedDecks")}</th>
                <th className="px-4 py-3 font-semibold">{t("columns.updatedAt")}</th>
                <th className="px-4 py-3" aria-label={t("columns.actions")} />
              </tr>
            </thead>
            <tbody>
              {items.map((category) => (
                <tr key={category.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold text-text">{category.name}</td>
                  <td className="px-4 py-3 text-right text-text">
                    {formatNumber(category.publishedDecks, i18n.language)}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(category.updatedAt, i18n.language)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button type="button" size="sm" variant="ghost" leftIcon={<Icon name="pencil" />}
                        onClick={() => setForm(category)}>
                        {t("rename")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">{t("categories.title")}</h1>
          <p className="mt-1 text-sm text-text-muted">{t("categories.subtitle")}</p>
        </div>
        {query.data && !systemEmpty && (
          <Button type="button" leftIcon={<Icon name="plus" />} onClick={() => setForm("new")}>
            {t("categories.add")}
          </Button>
        )}
      </header>
      {!systemEmpty && (
        <SearchInput
          className="min-w-60"
          value={search}
          onChange={setSearch}
          placeholder={t("categories.searchPlaceholder")}
          ariaLabel={t("categories.searchPlaceholder")}
        />
      )}
      {body}
      {form !== null && (
        <NameFormDialog
          title={
            form === "new" ? t("categories.form.addTitle") : t("categories.form.renameTitle", { name: form.name })
          }
          label={t("categories.form.name")}
          initialName={form === "new" ? "" : form.name}
          texts={{
            required: t("categories.form.required"),
            tooLong: t("categories.form.tooLong"),
            save: t("save"),
            cancel: t("cancel"),
          }}
          onSubmit={submit}
          onClose={() => setForm(null)}
        />
      )}
    </main>
  );
}
