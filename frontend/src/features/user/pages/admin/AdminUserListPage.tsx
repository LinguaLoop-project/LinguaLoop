import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import Skeleton from "@/components/common/Skeleton";
import { formatDate, formatDateTime } from "../../adminFormat";
import { adminUserPath, EMPTY_USER_FILTER, hasUserFilters, listState } from "../../adminUsers";
import { Avatar, FilterSelect, RoleBadge, StatusBadge } from "../../components/admin/AdminBits";
import { useAdminUsers } from "../../hooks";
import type { AccountPlan, AccountRole, AccountStatus, AdminApiError, UserListFilter } from "../../types";

/**
 * Danh sách tài khoản cho quản trị viên (UC-QT-01): tổng số, tìm theo tên hoặc email, lọc theo vai trò, gói, trạng
 * thái; mới tham gia trước, 20 tài khoản mỗi trang (BR-QT-10).
 */
export default function AdminUserListPage() {
  const { t, i18n } = useTranslation("userAdmin");
  const [filter, setFilter] = useState<UserListFilter>(EMPTY_USER_FILTER);
  const [page, setPage] = useState(0);
  const query = useAdminUsers(filter, page);
  const items = query.data?.items;
  const state = listState({
    isLoading: query.isLoading,
    isError: query.isError,
    count: items?.length,
    filtered: hasUserFilters(filter),
  });
  const set = (patch: Partial<UserListFilter>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(0);
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">{t("list.title")}</h1>
        {query.data && (
          <p className="text-sm text-text-muted">{t("list.total", { count: query.data.totalElements })}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          className="min-w-60 flex-1"
          value={filter.q}
          onChange={(q) => set({ q })}
          placeholder={t("list.searchPlaceholder")}
          ariaLabel={t("list.searchPlaceholder")}
        />
        <FilterSelect icon="user" label={t("list.role")} value={filter.role} onChange={(v) => set({ role: v as AccountRole | "" })}>
          <option value="">{t("list.allRoles")}</option>
          <option value="student">{t("roles.student")}</option>
          <option value="teacher">{t("roles.teacher")}</option>
          <option value="admin">{t("roles.admin")}</option>
        </FilterSelect>
        <FilterSelect icon="crown" label={t("list.plan")} value={filter.plan} onChange={(v) => set({ plan: v as AccountPlan | "" })}>
          <option value="">{t("list.allPlans")}</option>
          <option value="free">{t("plans.free")}</option>
          <option value="pro">{t("plans.pro")}</option>
        </FilterSelect>
        <FilterSelect
          icon="shield"
          label={t("list.status")}
          value={filter.status}
          onChange={(v) => set({ status: v as AccountStatus | "" })}
        >
          <option value="">{t("list.allStatuses")}</option>
          <option value="active">{t("status.active")}</option>
          <option value="locked">{t("status.locked")}</option>
        </FilterSelect>
      </div>

      {state === "loading" && <Skeleton className="h-64 w-full" />}
      {state === "error" && (
        <ErrorState
          kind={(query.error as unknown as AdminApiError | null)?.kind === "network" ? "network" : "server"}
          onRetry={() => void query.refetch()}
        />
      )}
      {state === "empty" && <EmptyState icon="users" title={t("list.empty")} />}
      {state === "noResult" && (
        <EmptyState
          icon="search"
          title={t("list.noResult")}
          actionText={t("clearFilters")}
          onAction={() => {
            setFilter(EMPTY_USER_FILTER);
            setPage(0);
          }}
        />
      )}
      {state === "list" && items && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-subtle">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("list.colName")}</th>
                <th className="px-4 py-3 font-semibold">{t("list.colRole")}</th>
                <th className="px-4 py-3 font-semibold">{t("list.colPlan")}</th>
                <th className="px-4 py-3 font-semibold">{t("list.colStatus")}</th>
                <th className="px-4 py-3 font-semibold">{t("list.colJoined")}</th>
                <th className="px-4 py-3 font-semibold">{t("list.colLastActive")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.id} className="relative border-b border-border last:border-0 hover:bg-surface-hover">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.displayName} />
                      <div className="flex min-w-0 flex-col">
                        <Link
                          to={adminUserPath(user.id)}
                          className="truncate font-semibold text-text after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary"
                        >
                          {user.displayName}
                        </Link>
                        <span className="truncate text-xs text-text-muted">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3 text-text">{user.plan ? t(`plans.${user.plan}`) : t("dash")}</td>
                  <td className="px-4 py-3">
                    <StatusBadge locked={user.locked} />
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(user.createdAt, i18n.language)}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {formatDateTime(user.lastActiveAt, i18n.language) ?? t("never")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {query.data && <Pagination page={page} totalPages={query.data.totalPages} onChange={setPage} />}
    </main>
  );
}
