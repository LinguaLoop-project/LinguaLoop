import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import SearchInput from "@/components/common/SearchInput";
import Skeleton from "@/components/common/Skeleton";
import { deckActions, type DeckAction } from "../../deckActions";
import { clearDeckFilters, deckListState } from "../../deckListState";
import type { CategoryOption } from "../../deckManageHooks";
import type { DeckApiError, DeckListFilter, ManageDeckItem, ManageRole, Page } from "../../deckManageTypes";
import { FilterSelect, MetaChip, StatusBadge, ToggleChip, type DeckStatusKey } from "./DeckBits";

const OTHER = "__other__";

/** Icon của từng thao tác; chữ của thao tác nằm ở `aria-label` và tooltip. */
const ACTION_ICONS: Record<DeckAction, string> = {
  publish: "send",
  unpublish: "eye-off",
  delete: "trash-2",
  restore: "rotate-ccw",
};

export interface ManageDeckListProps {
  role: ManageRole;
  filter: DeckListFilter;
  onFilterChange: (filter: DeckListFilter) => void;
  page: number;
  onPageChange: (page: number) => void;
  data: Page<ManageDeckItem> | undefined;
  isLoading: boolean;
  error: DeckApiError | null;
  onRetry: () => void;
  categories: CategoryOption[];
  /** Lựa chọn lọc chủ bộ của quản trị viên (giáo viên đã thấy trong danh sách). */
  owners?: CategoryOption[];
  onCreate?: () => void;
  /** Bấm vào dòng: mở trang bộ (xem và sửa tại chỗ). */
  onOpen?: (deck: ManageDeckItem) => void;
  onAction?: (action: DeckAction, deck: ManageDeckItem) => void;
}

function formatDate(iso: string, language: string): string {
  return new Date(iso).toLocaleDateString(language === "en" ? "en-GB" : "vi-VN");
}

const STATUS_LABEL: Record<DeckStatusKey, string> = {
  published: "manage.statusPublished",
  draft: "manage.statusDraft",
  deleted: "manage.statusDeleted",
};

/**
 * Danh sách bộ thẻ trên màn quản lý (UC-BT-01): tìm theo tên, lọc danh mục/"Khác", lọc Pro, lọc trạng thái (giáo viên)
 * hoặc chủ bộ (quản trị viên), 10 bộ mỗi trang. Trạng thái trống, không có kết quả và lỗi tải theo `deckListState`.
 */
export default function ManageDeckList(props: ManageDeckListProps) {
  const { role, filter, onFilterChange, page, onPageChange, data, isLoading, error, onRetry } = props;
  const { t, i18n } = useTranslation("vocab");
  const state = deckListState({ role, filter, isLoading, isError: error !== null, items: data?.items });
  const set = (patch: Partial<DeckListFilter>) => onFilterChange({ ...filter, ...patch });
  const categoryValue = filter.other ? OTHER : (filter.categoryId ?? "");
  const ownerValue = filter.system ? "system" : (filter.ownerId ?? "");

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          className="min-w-60 flex-1"
          value={filter.q}
          onChange={(q) => set({ q })}
          placeholder={t("manage.searchPlaceholder")}
          ariaLabel={t("manage.searchPlaceholder")}
        />
        <FilterSelect
          icon="folders"
          label={t("manage.category")}
          value={categoryValue}
          active={categoryValue !== ""}
          onChange={(value) => set({ other: value === OTHER, categoryId: value && value !== OTHER ? value : null })}
        >
          <option value="">{t("manage.allCategories")}</option>
          {props.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={OTHER}>{t("manage.otherCategory")}</option>
        </FilterSelect>
        {role === "teacher" ? (
          <FilterSelect
            icon="circle-dot"
            label={t("manage.status")}
            value={filter.status}
            active={filter.status !== "all"}
            onChange={(value) => set({ status: value as DeckListFilter["status"] })}
          >
            <option value="all">{t("manage.statusAll")}</option>
            <option value="published">{t("manage.statusPublished")}</option>
            <option value="draft">{t("manage.statusDraft")}</option>
            <option value="deleted">{t("manage.statusDeleted")}</option>
          </FilterSelect>
        ) : (
          <FilterSelect
            icon="user"
            label={t("manage.owner")}
            value={ownerValue}
            active={ownerValue !== ""}
            onChange={(value) => set({ system: value === "system", ownerId: value && value !== "system" ? value : null })}
          >
            <option value="">{t("manage.allOwners")}</option>
            {(props.owners ?? []).map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
            <option value="system">{t("manage.system")}</option>
          </FilterSelect>
        )}
        <ToggleChip icon="crown" label={t("manage.proOnly")} checked={filter.pro} onChange={(pro) => set({ pro })} />
      </div>

      {state.kind === "loading" && <Skeleton className="h-48 w-full" />}
      {state.kind === "error" && (
        <ErrorState kind={error?.kind === "network" ? "network" : "server"} onRetry={onRetry} />
      )}
      {state.kind === "empty" && (
        <EmptyState
          title={t("manage.empty")}
          actionText={state.canCreate ? t("manage.create") : undefined}
          onAction={state.canCreate ? props.onCreate : undefined}
        />
      )}
      {state.kind === "noResult" && (
        <EmptyState
          title={t("manage.noResult")}
          actionText={t("manage.clearFilters")}
          onAction={() => onFilterChange(clearDeckFilters())}
        />
      )}
      {state.kind === "list" && (
        <ul className="flex flex-col gap-2.5">
          {state.items.map((deck) => {
            const { actions, deletedAt, openable } = deckActions(deck, role);
            const canOpen = openable && props.onOpen !== undefined;
            const owner = "ownerId" in deck ? (deck.ownerName ?? t("manage.system")) : null;
            const status: DeckStatusKey = deletedAt ? "deleted" : deck.status;
            return (
              <li
                key={deck.id}
                className={`group/deck relative flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-3 transition-[border-color,box-shadow,transform] duration-150 sm:flex-nowrap ${
                  canOpen
                    ? "hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--fn-vocab)_45%,var(--border))] hover:shadow-[0_6px_20px_-12px_var(--fn-vocab)]"
                    : ""
                } ${deletedAt ? "opacity-75" : ""}`}
                data-deck={deck.id}
              >
                <div className="grid h-[72px] w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,var(--fn-vocab-soft),var(--primary-soft))]">
                  {deck.imageUrl ? (
                    <img src={deck.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon name="gallery-vertical-end" className="text-3xl text-fn-vocab" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    {canOpen ? (
                      // Nút phủ cả thẻ: bấm chỗ nào cũng mở trang bộ; các nút thao tác nằm trên lớp này.
                      <button
                        type="button"
                        onClick={() => props.onOpen?.(deck)}
                        className="block min-w-0 truncate text-left text-base font-semibold text-text after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-primary"
                      >
                        {deck.name}
                      </button>
                    ) : (
                      <p className="truncate text-base font-semibold text-text">{deck.name}</p>
                    )}
                    {deck.pro && (
                      <Badge variant="pro" className="shrink-0">
                        <Icon name="crown" />
                        {t("deck.pro")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                    <MetaChip icon="folders">{deck.categoryName ?? t("manage.otherCategory")}</MetaChip>
                    <MetaChip icon="layers">{t("manage.groupCount", { count: deck.groupCount })}</MetaChip>
                    <MetaChip icon="sticky-note">{t("manage.cardCount", { count: deck.cardCount })}</MetaChip>
                    {owner && <MetaChip icon="user">{owner}</MetaChip>}
                  </div>
                  <p className="flex items-center gap-1 text-xs text-text-subtle">
                    <Icon name={deletedAt ? "trash-2" : "clock"} className="size-3" />
                    {deletedAt
                      ? t("manage.deletedOn", { date: formatDate(deletedAt, i18n.language) })
                      : t("manage.updatedOn", { date: formatDate(deck.updatedAt, i18n.language) })}
                  </p>
                  {"unpublishReason" in deck && deck.unpublishReason && deck.status === "draft" && !deletedAt && (
                    <p className="flex items-center gap-1 text-xs text-warning">
                      <Icon name="triangle-alert" className="size-3" />
                      {t("manage.unpublishedByAdmin", { reason: deck.unpublishReason })}
                    </p>
                  )}
                </div>
                <div className="relative z-10 flex shrink-0 items-center gap-2">
                  <StatusBadge status={status} label={t(STATUS_LABEL[status])} />
                  {actions.map((action) => {
                    const label = t(`manage.action.${action}`);
                    return (
                      <Button
                        key={action}
                        size="sm"
                        variant="ghost"
                        iconOnly
                        aria-label={label}
                        title={label}
                        className={action === "delete" ? "text-danger" : undefined}
                        onClick={() => props.onAction?.(action, deck)}
                      >
                        <Icon name={ACTION_ICONS[action]} />
                      </Button>
                    );
                  })}
                  {canOpen && (
                    <span className="pointer-events-none hidden text-lg text-text-subtle transition-transform group-hover/deck:translate-x-0.5 group-hover/deck:text-fn-vocab sm:block">
                      <Icon name="chevron-right" />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label={t("manage.pagination")}>
          <Button
            size="sm"
            variant="secondary"
            iconOnly
            aria-label={t("manage.prev")}
            title={t("manage.prev")}
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            <Icon name="chevron-left" />
          </Button>
          <span className="text-sm text-text-muted">
            {page + 1} / {data.totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            iconOnly
            aria-label={t("manage.next")}
            title={t("manage.next")}
            disabled={page + 1 >= data.totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <Icon name="chevron-right" />
          </Button>
        </nav>
      )}
    </section>
  );
}
