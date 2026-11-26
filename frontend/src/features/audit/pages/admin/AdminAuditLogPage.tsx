import { useState } from "react";
import { useTranslation } from "react-i18next";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import type { AdminApiError } from "@/features/user";
import {
  AUDIT_ACTION_GROUPS,
  AUDIT_ACTOR_ROLES,
  AUDIT_ENTITY_TYPES,
  AUDIT_PERIODS,
  DEFAULT_AUDIT_FILTER,
  hasAuditFilters,
  widerPeriod,
} from "../../auditFormat";
import AuditDetailDialog from "../../components/AuditDetailDialog";
import AuditTable from "../../components/AuditTable";
import FilterSelect from "@/components/common/FilterSelect";
import { useAuditLogs } from "../../hooks";
import type { AuditAction, AuditActorRole, AuditEntityType, AuditFilter, AuditPeriod } from "../../types";

/**
 * Nhật ký hoạt động (UC-NK-01): mặc định 7 ngày gần nhất, mới nhất trước, 50 mục mỗi trang; lọc kết hợp theo hành
 * động, loại đối tượng, vai trò người thực hiện, khoảng thời gian và từ khóa (BR-NK-04).
 */
export default function AdminAuditLogPage() {
  const { t } = useTranslation("auditAdmin");
  const [filter, setFilter] = useState<AuditFilter>(DEFAULT_AUDIT_FILTER);
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);
  const query = useAuditLogs(filter, page);
  const data = query.data;
  const filtered = hasAuditFilters(filter);
  const wider = widerPeriod(filter.period);

  const set = (patch: Partial<AuditFilter>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(0);
  };
  const clear = () => {
    setFilter(DEFAULT_AUDIT_FILTER);
    setPage(0);
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">{t("list.title")}</h1>
        {data && <p className="text-sm text-text-muted">{t("list.total", { count: data.totalElements })}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SegmentedControl
          ariaLabel={t("list.period")}
          options={AUDIT_PERIODS.map((p) => ({ value: p, label: t(`periods.${p}`) }))}
          value={filter.period}
          onChange={(p) => set({ period: p as AuditPeriod })}
        />
        <SearchInput
          className="min-w-60 flex-1"
          value={filter.q}
          onChange={(q) => set({ q })}
          placeholder={t("list.searchPlaceholder")}
          ariaLabel={t("list.searchPlaceholder")}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <FilterSelect icon="zap" label={t("list.action")} value={filter.action} onChange={(v) => set({ action: v as AuditAction | "" })}>
          <option value="">{t("list.allActions")}</option>
          {AUDIT_ACTION_GROUPS.map((group) => (
            <optgroup key={group.key} label={t(`actionGroups.${group.key}`)}>
              {group.actions.map((a) => (
                <option key={a} value={a}>
                  {t(`actions.${a}`)}
                </option>
              ))}
            </optgroup>
          ))}
        </FilterSelect>
        <FilterSelect
          icon="layers"
          label={t("list.entity")}
          value={filter.targetType}
          onChange={(v) => set({ targetType: v as AuditEntityType | "" })}
        >
          <option value="">{t("list.allEntities")}</option>
          {AUDIT_ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`entities.${type}`)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          icon="user"
          label={t("list.actorRole")}
          value={filter.actorRole}
          onChange={(v) => set({ actorRole: v as AuditActorRole | "" })}
        >
          <option value="">{t("list.allRoles")}</option>
          {AUDIT_ACTOR_ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`roles.${role}`)}
            </option>
          ))}
        </FilterSelect>
      </div>

      {query.isLoading && <Skeleton className="h-64 w-full" />}
      {query.isError && !data && (
        <ErrorState
          title={t("list.loadError")}
          kind={(query.error as unknown as AdminApiError | null)?.kind === "network" ? "network" : "server"}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      )}
      {data && data.items.length === 0 && !filtered && (
        <EmptyState
          icon="history"
          title={t("list.empty")}
          actionText={wider ? t("list.widen", { period: t(`periods.${wider}`) }) : undefined}
          onAction={wider ? () => set({ period: wider }) : undefined}
        />
      )}
      {data && data.items.length === 0 && filtered && (
        <EmptyState icon="search" title={t("list.noResult")} actionText={t("list.clearFilters")} onAction={clear} />
      )}
      {data && data.items.length > 0 && (
        <AuditTable rows={data.items} onOpen={setOpenId} targetHeader={t("list.colTarget")} stale={query.isPlaceholderData} />
      )}

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}

      <AuditDetailDialog entryId={openId} onClose={() => setOpenId(null)} />
    </main>
  );
}
