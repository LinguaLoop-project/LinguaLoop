import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import Skeleton from "@/components/common/Skeleton";
import { toast } from "@/stores/toastStore";
import { formatDate } from "../../adminFormat";
import {
  EMPTY_TRANSFER_FILTER,
  hasTransferFilters,
  listState,
  parsePreselect,
  previewPath,
  selectionKey,
} from "../../adminUsers";
import { FilterSelect } from "../../components/admin/AdminBits";
import TransferDialog, { type TransferMode } from "../../components/admin/TransferDialog";
import { useTransferItems, useTransferOwners } from "../../hooks";
import { SYSTEM_OWNER, type AdminApiError, type ContentType, type TransferFilter, type TransferItem } from "../../types";

/**
 * Nội dung cần giao (UC-QT-05, BR-QT-05): bài học và bộ thẻ đã xuất bản của giáo viên bị khóa, cùng bộ thẻ chưa gán
 * chủ ("Hệ thống"). Chọn nhiều mục để giao (UC-QT-06) hoặc giao toàn bộ nội dung của một giáo viên bị khóa (UC-QT-07).
 * Mở từ chi tiết báo cáo thì mục chứa nội dung bị báo được chọn sẵn (UC-QT-06 nhánh 1a).
 */
export default function AdminContentTransferPage() {
  const { t, i18n } = useTranslation("userAdmin");
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<TransferFilter>(EMPTY_TRANSFER_FILTER);
  const [page, setPage] = useState(0);
  const [selection, setSelection] = useState<Map<string, TransferItem>>(new Map());
  const [mode, setMode] = useState<TransferMode | null>(() => {
    const preselected = parsePreselect(searchParams);
    return preselected ? { kind: "selected", items: [preselected] } : null;
  });
  const query = useTransferItems(filter, page);
  const owners = useTransferOwners();
  const items = query.data?.items;
  const state = listState({
    isLoading: query.isLoading,
    isError: query.isError,
    count: items?.length,
    filtered: hasTransferFilters(filter),
  });

  const set = (patch: Partial<TransferFilter>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(0);
  };

  const toggle = (item: TransferItem) =>
    setSelection((current) => {
      const next = new Map(current);
      const key = selectionKey(item);
      if (next.has(key)) next.delete(key);
      else next.set(key, item);
      return next;
    });

  const pageItems = items ?? [];
  const pageSelected = pageItems.length > 0 && pageItems.every((item) => selection.has(selectionKey(item)));
  const togglePage = () =>
    setSelection((current) => {
      const next = new Map(current);
      pageItems.forEach((item) => (pageSelected ? next.delete(selectionKey(item)) : next.set(selectionKey(item), item)));
      return next;
    });

  const assignSelected = () => {
    if (selection.size === 0) {
      toast(t("transfer.nothingSelected"), { icon: "circle-alert" });
      return;
    }
    setMode({ kind: "selected", items: [...selection.values()] });
  };

  const closeDialog = () => {
    setMode(null);
    if (parsePreselect(searchParams)) setSearchParams({}, { replace: true });
  };

  const selectedOwner = owners.data?.find((o) => o.id !== null && o.id === filter.owner);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">{t("transfer.title")}</h1>
        {query.data && (
          <p className="text-sm text-text-muted">{t("transfer.total", { count: query.data.totalElements })}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          className="min-w-60 flex-1"
          value={filter.q}
          onChange={(q) => set({ q })}
          placeholder={t("transfer.searchPlaceholder")}
          ariaLabel={t("transfer.searchPlaceholder")}
        />
        <FilterSelect icon="user" label={t("transfer.owner")} value={filter.owner} onChange={(owner) => set({ owner })}>
          <option value="">{t("transfer.allOwners")}</option>
          {(owners.data ?? []).map((o) => (
            <option key={o.id ?? SYSTEM_OWNER} value={o.id ?? SYSTEM_OWNER}>
              {o.id ? o.name : t("system")} ({o.itemCount})
            </option>
          ))}
        </FilterSelect>
        <FilterSelect icon="layers" label={t("transfer.type")} value={filter.type} onChange={(v) => set({ type: v as ContentType | "" })}>
          <option value="">{t("transfer.allTypes")}</option>
          <option value="lesson">{t("types.lesson")}</option>
          <option value="deck">{t("types.deck")}</option>
        </FilterSelect>
        {selectedOwner && (
          <Button
            type="button"
            variant="secondary"
            leftIcon={<Icon name="arrow-left-right" />}
            onClick={() =>
              setMode({ kind: "all", teacherId: selectedOwner.id ?? "", teacherName: selectedOwner.name ?? "" })
            }
          >
            {t("transfer.assignAllOf", { name: selectedOwner.name })}
          </Button>
        )}
      </div>

      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-2.5">
        <span className="text-sm text-text-muted">{t("transfer.selected", { count: selection.size })}</span>
        <div className="flex gap-2">
          {selection.size > 0 && (
            <Button type="button" size="sm" variant="ghost" onClick={() => setSelection(new Map())}>
              {t("transfer.clearSelection")}
            </Button>
          )}
          <Button type="button" size="sm" leftIcon={<Icon name="arrow-left-right" />} onClick={assignSelected}>
            {t("transfer.assignSelected")}
          </Button>
        </div>
      </div>

      {state === "loading" && <Skeleton className="h-64 w-full" />}
      {state === "error" && (
        <ErrorState
          kind={(query.error as unknown as AdminApiError | null)?.kind === "network" ? "network" : "server"}
          onRetry={() => void query.refetch()}
        />
      )}
      {state === "empty" && <EmptyState icon="circle-check" title={t("transfer.empty")} />}
      {state === "noResult" && (
        <EmptyState
          icon="search"
          title={t("transfer.noResult")}
          actionText={t("clearFilters")}
          onAction={() => {
            setFilter(EMPTY_TRANSFER_FILTER);
            setPage(0);
          }}
        />
      )}
      {state === "list" && items && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-subtle">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" aria-label={t("transfer.selectPage")} checked={pageSelected} onChange={togglePage} />
                </th>
                <th className="px-4 py-3 font-semibold">{t("transfer.colName")}</th>
                <th className="px-4 py-3 font-semibold">{t("transfer.colOwner")}</th>
                <th className="px-4 py-3 font-semibold">{t("transfer.colLockedAt")}</th>
                <th className="px-4 py-3 font-semibold">{t("transfer.colReports")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={selectionKey(item)} className="border-b border-border last:border-0 hover:bg-surface-hover">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={t("transfer.select", { name: item.name })}
                      checked={selection.has(selectionKey(item))}
                      onChange={() => toggle(item)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Badge variant={item.type === "lesson" ? "info" : "accent"}>{t(`types.${item.type}`)}</Badge>
                      <span className="truncate font-semibold text-text">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text">{item.ownerName ?? t("system")}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(item.lockedAt, i18n.language) ?? ""}</td>
                  <td className="px-4 py-3 text-text">{item.openReports}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={previewPath(item)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary-text hover:underline"
                    >
                      <Icon name="eye" className="size-4" />
                      {t("transfer.view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {query.data && <Pagination page={page} totalPages={query.data.totalPages} onChange={setPage} />}

      {mode && (
        <TransferDialog
          mode={mode}
          onClose={closeDialog}
          onDone={() => {
            if (mode.kind === "selected") setSelection(new Map());
          }}
        />
      )}
    </main>
  );
}
