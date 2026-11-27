import { useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import FilterSelect from "@/components/common/FilterSelect";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import NameFormDialog from "@/components/common/NameFormDialog";
import type { NameSubmitResult } from "@/components/common/nameField";
import SearchInput from "@/components/common/SearchInput";
import Skeleton from "@/components/common/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatNumber, type AdminApiError } from "@/features/user";
import { toast } from "@/stores/toastStore";
import {
  EMPTY_TOPIC_FILTER,
  topicListState,
  topicSaveError,
  type AdminTopic,
  type TopicVisibilityFilter,
} from "../../adminTopics";
import { useAdminTopics, useCreateTopic, useRenameTopic } from "../../hooks/useAdminTopics";

const SEARCH_DEBOUNCE_MS = 300;

/** null = đóng; "new" = thêm chủ đề; một chủ đề = sửa tên chủ đề đó. */
type FormState = "new" | AdminTopic | null;

/**
 * Danh sách chủ đề của quản trị viên theo thứ tự hiển thị (UC-CD-01): tìm theo tên, lọc theo trạng thái hiển thị, thêm
 * chủ đề (UC-CD-02) và sửa tên (UC-CD-03).
 */
export default function AdminTopicPage() {
  const { t, i18n } = useTranslation("catalogAdmin");
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<TopicVisibilityFilter>("");
  const filter = { q: useDebounce(search, SEARCH_DEBOUNCE_MS), visibility };
  const query = useAdminTopics(filter);
  const create = useCreateTopic();
  const rename = useRenameTopic();
  const [form, setForm] = useState<FormState>(null);

  const clearFilters = () => {
    setSearch("");
    setVisibility(EMPTY_TOPIC_FILTER.visibility);
  };

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
      return topicSaveError(raw as AdminApiError, {
        nameTaken: t("topics.form.nameTaken"),
        invalid: t("topics.form.required"),
        saveFailed: t("saveFailed"),
      });
    }
    toast(t(editing ? "topics.form.renamed" : "topics.form.created", { name }), { icon: "circle-check" });
    setForm(null);
    return { ok: true };
  };

  const items = query.data ?? [];
  const state = query.data ? topicListState(items, filter) : null;
  const systemEmpty = state === "none";

  let body;
  if (query.isLoading) {
    body = <Skeleton className="h-64 w-full" />;
  } else if (query.isError || !query.data) {
    body = (
      <div className="flex flex-col items-start gap-3">
        <FormAlert variant="danger">{t("topics.loadFailed")}</FormAlert>
        <Button type="button" leftIcon={<Icon name="rotate-cw" />} onClick={() => void query.refetch()}>
          {t("reload")}
        </Button>
      </div>
    );
  } else if (state === "none") {
    body = (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-text-muted">{t("topics.empty")}</p>
        <Button type="button" leftIcon={<Icon name="plus" />} onClick={() => setForm("new")}>
          {t("topics.add")}
        </Button>
      </div>
    );
  } else if (state === "noMatch") {
    body = (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-text-muted">{t("topics.noMatch")}</p>
        <Button type="button" variant="secondary" leftIcon={<Icon name="x" />} onClick={clearFilters}>
          {t("clearFilters")}
        </Button>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-text-muted">{t("topics.count", { count: items.length })}</p>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-semibold">{t("topics.columns.name")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("topics.columns.publishedLessons")}</th>
                <th className="px-4 py-3 font-semibold">{t("topics.columns.status")}</th>
                <th className="px-4 py-3 font-semibold">{t("columns.updatedAt")}</th>
                <th className="px-4 py-3" aria-label={t("columns.actions")} />
              </tr>
            </thead>
            <tbody>
              {items.map((topic) => (
                <tr key={topic.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold text-text">{topic.name}</td>
                  <td className="px-4 py-3 text-right text-text">
                    {formatNumber(topic.publishedLessons, i18n.language)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={topic.visible ? "success" : "default"}>
                      {topic.visible ? t("topics.visible") : t("topics.hidden")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(topic.updatedAt, i18n.language)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button type="button" size="sm" variant="ghost" leftIcon={<Icon name="pencil" />}
                        onClick={() => setForm(topic)}>
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
          <h1 className="font-display text-2xl font-bold text-text">{t("topics.title")}</h1>
          <p className="mt-1 text-sm text-text-muted">{t("topics.subtitle")}</p>
        </div>
        {query.data && !systemEmpty && (
          <Button type="button" leftIcon={<Icon name="plus" />} onClick={() => setForm("new")}>
            {t("topics.add")}
          </Button>
        )}
      </header>
      {!systemEmpty && (
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchInput
            className="min-w-60 flex-1"
            value={search}
            onChange={setSearch}
            placeholder={t("topics.searchPlaceholder")}
            ariaLabel={t("topics.searchPlaceholder")}
          />
          <FilterSelect
            icon="eye"
            label={t("topics.visibility")}
            value={visibility}
            onChange={(value) => setVisibility(value as TopicVisibilityFilter)}
          >
            <option value="">{t("topics.allStatuses")}</option>
            <option value="visible">{t("topics.visible")}</option>
            <option value="hidden">{t("topics.hidden")}</option>
          </FilterSelect>
        </div>
      )}
      {body}
      {form !== null && (
        <NameFormDialog
          title={form === "new" ? t("topics.form.addTitle") : t("topics.form.renameTitle", { name: form.name })}
          label={t("topics.form.name")}
          initialName={form === "new" ? "" : form.name}
          texts={{
            required: t("topics.form.required"),
            tooLong: t("topics.form.tooLong"),
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
