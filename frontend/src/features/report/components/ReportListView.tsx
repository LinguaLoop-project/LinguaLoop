import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import Skeleton from "@/components/common/Skeleton";
import { DEFAULT_REPORT_FILTER, isFiltered, reasonFilterGroups, reasonFitsType } from "../reportForm";
import type { Page, ReportApiError, ReportFilter, ReportItem, ReportOwner, ReportStatus, ReviewRole } from "../types";
import { formatDate, statusKey } from "../reportFormat";
import { FilterSelect, StatusPill, ToggleChip } from "./reportBits";

export interface ReportListViewProps {
  role: ReviewRole;
  filter: ReportFilter;
  onFilterChange: (filter: ReportFilter) => void;
  page: number;
  onPageChange: (page: number) => void;
  data: Page<ReportItem> | undefined;
  isLoading: boolean;
  error: ReportApiError | null;
  onRetry: () => void;
  onOpen: (item: ReportItem) => void;
  /** Tên học viên đang lọc (quản trị viên lọc từ chi tiết báo cáo). */
  reporterName?: string | null;
  /** Giáo viên chủ cho bộ lọc của quản trị viên (AC-XL-09). */
  owners?: ReportOwner[];
}

/** Các trạng thái còn lại vai trò thấy được; giáo viên không thấy báo cáo Phản cảm nên không có waiting_admin. */
const OTHER_STATUSES: Record<ReviewRole, ReportStatus[]> = {
  teacher: ["resolved", "rejected"],
  admin: ["waiting_teacher", "resolved", "rejected"],
};

/**
 * Danh sách báo cáo (UC-XL-01): mỗi dòng gộp các báo cáo trùng (BR-XL-06), 10 dòng mỗi trang, lọc theo trạng thái,
 * loại nội dung, lý do, "Quá hạn"; quản trị viên lọc thêm "Không có giáo viên xử lý" và "Học viên có nhiều báo cáo bị
 * từ chối" (BR-XL-03). Không hiển thị tên học viên trong danh sách (BR-XL-09).
 */
export default function ReportListView(props: Readonly<ReportListViewProps>) {
  const { role, filter, onFilterChange, page, onPageChange, data, isLoading, error, onRetry, onOpen } = props;
  const { t, i18n } = useTranslation("report");
  const set = (patch: Partial<ReportFilter>) => onFilterChange({ ...filter, ...patch });
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  let body;
  if (isLoading && !data) {
    body = <Skeleton className="h-48 w-full" />;
  } else if (error) {
    body = <ErrorState kind={error.kind === "network" ? "network" : "server"} onRetry={onRetry} />;
  } else if (items.length === 0 && isFiltered(filter)) {
    body = (
      <EmptyState
        title={t("list.noResult")}
        actionText={t("list.clearFilters")}
        onAction={() => onFilterChange(DEFAULT_REPORT_FILTER)}
      />
    );
  } else if (items.length === 0) {
    body = (
      <EmptyState
        title={t("list.emptyWaiting")}
        actionText={t("list.showAll")}
        onAction={() => set({ status: "all" })}
      />
    );
  } else {
    body = (
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="flex w-full flex-col gap-2 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={item.status} label={t(statusKey(role, item.status))} />
                <Badge tone={item.reason === "offensive" ? "danger" : "info"}>{t(`reasons.${item.reason}`)}</Badge>
                <Badge tone="primary">{t(`type.${item.targetType}`)}</Badge>
                {item.reportCount > 1 && <Badge tone="accent">{t("list.count", { count: item.reportCount })}</Badge>}
                {item.overdue && <Badge tone="warning">{t("list.overdue")}</Badge>}
                {role === "admin" && item.noHandler && item.status === "waiting_teacher" && (
                  <Badge tone="danger">{t("list.noHandler")}</Badge>
                )}
                {item.containerDeleted && <Badge tone="danger">{t("list.deleted")}</Badge>}
              </div>
              <p className="line-clamp-2 font-semibold text-text">{item.content}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Icon name={item.targetType === "sentence" ? "circle-play" : "layers"} className="size-3.5" />
                  {item.containerName}
                </span>
                {role === "admin" && (
                  <span>{item.ownerName ? t("list.owner", { name: item.ownerName }) : t("list.noOwner")}</span>
                )}
                <span>
                  {t("list.firstLast", {
                    first: formatDate(item.firstReportedAt, i18n.language),
                    last: formatDate(item.lastReportedAt, i18n.language),
                  })}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          className="min-w-60 flex-1"
          value={filter.q}
          onChange={(q) => set({ q })}
          placeholder={t("list.search")}
          ariaLabel={t("list.search")}
        />
        <FilterSelect
          icon="circle-dot"
          label={t("list.status")}
          value={filter.status}
          active={filter.status !== "default"}
          onChange={(value) => set({ status: value as ReportFilter["status"] })}
        >
          {/* "default" là trạng thái đang chờ chính tác nhân (BR-XL-03), nên mang luôn tên trạng thái đó thay vì lặp lại. */}
          <option value="default">{t("status.pending")}</option>
          {OTHER_STATUSES[role].map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
          <option value="all">{t("list.statusAll")}</option>
        </FilterSelect>
        <FilterSelect
          icon="shapes"
          label={t("list.type")}
          value={filter.type}
          active={filter.type !== ""}
          onChange={(value) => {
            const type = value as ReportFilter["type"];
            set(reasonFitsType(filter.reason, type) ? { type } : { type, reason: "" });
          }}
        >
          <option value="">{t("list.typeAll")}</option>
          <option value="sentence">{t("type.sentence")}</option>
          <option value="card">{t("type.card")}</option>
        </FilterSelect>
        <FilterSelect
          icon="tag"
          label={t("list.reason")}
          value={filter.reason}
          active={filter.reason !== ""}
          onChange={(value) => set({ reason: value as ReportFilter["reason"] })}
        >
          <option value="">{t("list.reasonAll")}</option>
          {reasonFilterGroups(filter.type, role).map(({ group, reasons }) => (
            <optgroup key={group} label={t(`list.reasonGroup.${group}`)}>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {t(`reasons.${r}`)}
                </option>
              ))}
            </optgroup>
          ))}
        </FilterSelect>
        <FilterSelect
          icon="arrow-up-down"
          label={t("list.sort")}
          value={filter.sort}
          active={filter.sort !== "newest"}
          onChange={(value) => set({ sort: value as ReportFilter["sort"] })}
        >
          <option value="newest">{t("list.sortNewest")}</option>
          <option value="oldest">{t("list.sortOldest")}</option>
        </FilterSelect>
        <ToggleChip icon="clock-alert" label={t("list.overdue")} checked={filter.overdue} onChange={(overdue) => set({ overdue })} />
        {role === "admin" && (
          <>
            <FilterSelect
              icon="user"
              label={t("list.ownerFilter")}
              value={filter.ownerId ?? ""}
              active={filter.ownerId !== null}
              onChange={(value) => set({ ownerId: value || null })}
            >
              <option value="">{t("list.ownerAll")}</option>
              {(props.owners ?? []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </FilterSelect>
            <ToggleChip
              icon="user-x"
              label={t("list.noHandler")}
              checked={filter.noHandler}
              onChange={(noHandler) => set({ noHandler })}
            />
            <ToggleChip
              icon="shield-alert"
              label={t("list.frequentRejected")}
              checked={filter.frequentRejected}
              onChange={(frequentRejected) => set({ frequentRejected })}
            />
          </>
        )}
      </div>
      {role === "admin" && filter.reporterId && (
        <div className="flex items-center gap-2 text-sm text-text">
          <Icon name="user" className="size-4" />
          {t("list.reporterFilter", { name: props.reporterName ?? "" })}
          <Button type="button" variant="text" size="sm" onClick={() => set({ reporterId: null })}>
            {t("list.clearReporter")}
          </Button>
        </div>
      )}

      {body}

      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </section>
  );
}
