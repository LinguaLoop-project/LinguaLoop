import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import Skeleton from "@/components/common/Skeleton";
import { formatDate } from "../time";
import {
  CEFR_LEVELS,
  DEFAULT_FILTER,
  type CefrLevel,
  type LessonApiError,
  type LessonItem,
  type LessonListFilter,
  type ManageRole,
  type Page,
  type TopicOption,
} from "../types";
import { lessonActions, type LessonAction } from "../actions";
import { FilterSelect, MetaChip, StatusBadge, ToggleChip, type LessonStatusKey } from "./LessonBits";

const ACTION_ICONS: Record<LessonAction, string> = {
  publish: "send",
  unpublish: "eye-off",
  delete: "trash-2",
  restore: "rotate-ccw",
};

/** Bộ lọc đang khác mặc định (trừ trạng thái, vì "Đã xóa" là một danh sách riêng). */
function hasFilters(filter: LessonListFilter): boolean {
  return filter.q.trim() !== "" || filter.topicId !== null || filter.cefrLevel !== null || filter.pro || filter.ownerId !== null;
}

export interface LessonManageListProps {
  role: ManageRole;
  filter: LessonListFilter;
  onFilterChange: (filter: LessonListFilter) => void;
  page: number;
  onPageChange: (page: number) => void;
  data: Page<LessonItem> | undefined;
  isLoading: boolean;
  error: LessonApiError | null;
  onRetry: () => void;
  topics: TopicOption[];
  /** Giáo viên để quản trị viên lọc theo chủ bài (lấy từ các bài đã thấy). */
  owners?: TopicOption[];
  onCreate?: () => void;
  onOpen: (lesson: LessonItem) => void;
  onAction: (action: LessonAction, lesson: LessonItem) => void;
}

/**
 * Danh sách bài học trên màn quản lý (UC-BH-01): tìm theo tiêu đề, lọc chủ đề, trình độ, Pro, trạng thái (giáo viên)
 * hoặc giáo viên chủ bài (quản trị viên), 10 bài mỗi trang, bài cập nhật gần nhất ở đầu.
 */
export default function LessonManageList(props: Readonly<LessonManageListProps>) {
  const { role, filter, onFilterChange, page, onPageChange, data, isLoading, error, onRetry } = props;
  const { t, i18n } = useTranslation("lessonManage");
  const set = (patch: Partial<LessonListFilter>) => onFilterChange({ ...filter, ...patch });
  const items = data?.items ?? [];

  let body: React.ReactNode;
  if (isLoading && !data) {
    body = <Skeleton className="h-48 w-full" />;
  } else if (error) {
    body = <ErrorState kind={error.kind === "network" ? "network" : "server"} onRetry={onRetry} />;
  } else if (items.length === 0 && hasFilters(filter)) {
    body = (
      <EmptyState
        title={t("list.noResult")}
        actionText={t("list.clearFilters")}
        onAction={() => onFilterChange({ ...DEFAULT_FILTER, status: filter.status })}
      />
    );
  } else if (items.length === 0) {
    const canCreate = role === "teacher" && filter.status !== "deleted";
    body = (
      <EmptyState
        title={filter.status === "deleted" ? t("list.emptyDeleted") : t("list.empty")}
        actionText={canCreate ? t("list.create") : undefined}
        onAction={canCreate ? props.onCreate : undefined}
      />
    );
  } else {
    body = (
      <ul className="flex flex-col gap-2.5">
        {items.map((lesson) => {
          const actions = lessonActions(lesson, role);
          const deleted = lesson.deletedAt !== null;
          const status: LessonStatusKey = deleted ? "deleted" : lesson.status;
          return (
            <li
              key={lesson.id}
              className={`group/lesson relative flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-3 transition-[border-color,box-shadow,transform] duration-150 sm:flex-nowrap ${
                deleted ? "opacity-75" : "hover:-translate-y-px hover:border-border-strong hover:shadow-md"
              }`}
            >
              <div className="h-[72px] w-32 shrink-0 overflow-hidden rounded-lg bg-bg-elevated">
                <img src={lesson.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  {deleted ? (
                    <p className="truncate text-base font-semibold text-text">{lesson.title}</p>
                  ) : (
                    // Nút phủ cả thẻ: bấm chỗ nào cũng mở chi tiết; các nút thao tác nằm trên lớp này.
                    <button
                      type="button"
                      onClick={() => props.onOpen(lesson)}
                      className="block min-w-0 truncate text-left text-base font-semibold text-text after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-primary"
                    >
                      {lesson.title}
                    </button>
                  )}
                  {lesson.pro && (
                    <Badge variant="pro" className="shrink-0">
                      <Icon name="crown" />
                      Pro
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                  <MetaChip icon="folders">{lesson.topicName ?? "—"}</MetaChip>
                  <MetaChip icon="graduation-cap">{lesson.cefrLevel}</MetaChip>
                  <MetaChip icon="list">{t("list.sentenceCount", { count: lesson.sentenceCount })}</MetaChip>
                  {role === "admin" && lesson.ownerName && <MetaChip icon="user">{lesson.ownerName}</MetaChip>}
                </div>
                <p className="flex items-center gap-1 text-xs text-text-subtle">
                  <Icon name={deleted ? "trash-2" : "clock"} className="size-3" />
                  {deleted && lesson.deletedAt
                    ? t("list.deletedOn", { date: formatDate(lesson.deletedAt, i18n.language) })
                    : t("list.updatedOn", { date: formatDate(lesson.updatedAt, i18n.language) })}
                </p>
                {role === "teacher" && lesson.unpublishReason && lesson.status === "draft" && !deleted && (
                  <p className="flex items-center gap-1 text-xs text-warning">
                    <Icon name="triangle-alert" className="size-3" />
                    {t("list.unpublishedByAdmin", { reason: lesson.unpublishReason })}
                  </p>
                )}
              </div>
              <div className="relative z-10 flex shrink-0 items-center gap-2">
                <StatusBadge status={status} label={t(`status.${status}`)} />
                {actions.map((action) => {
                  const label = t(`action.${action}`);
                  return (
                    <Button
                      key={action}
                      size="sm"
                      variant="ghost"
                      iconOnly
                      aria-label={label}
                      title={label}
                      className={action === "delete" ? "text-danger" : undefined}
                      onClick={() => props.onAction(action, lesson)}
                    >
                      <Icon name={ACTION_ICONS[action]} />
                    </Button>
                  );
                })}
              </div>
            </li>
          );
        })}
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
          placeholder={t("list.searchPlaceholder")}
          ariaLabel={t("list.searchPlaceholder")}
        />
        <FilterSelect
          icon="folders"
          label={t("list.topic")}
          value={filter.topicId ?? ""}
          active={filter.topicId !== null}
          onChange={(value) => set({ topicId: value || null })}
        >
          <option value="">{t("list.allTopics")}</option>
          {props.topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          icon="graduation-cap"
          label={t("list.level")}
          value={filter.cefrLevel ?? ""}
          active={filter.cefrLevel !== null}
          onChange={(value) => set({ cefrLevel: (value || null) as CefrLevel | null })}
        >
          <option value="">{t("list.allLevels")}</option>
          {CEFR_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </FilterSelect>
        {role === "teacher" ? (
          <FilterSelect
            icon="circle-dot"
            label={t("list.status")}
            value={filter.status}
            active={filter.status !== "all"}
            onChange={(value) => set({ status: value as LessonListFilter["status"] })}
          >
            <option value="all">{t("status.all")}</option>
            <option value="published">{t("status.published")}</option>
            <option value="draft">{t("status.draft")}</option>
            <option value="deleted">{t("status.deleted")}</option>
          </FilterSelect>
        ) : (
          <FilterSelect
            icon="user"
            label={t("list.owner")}
            value={filter.ownerId ?? ""}
            active={filter.ownerId !== null}
            onChange={(value) => set({ ownerId: value || null })}
          >
            <option value="">{t("list.allOwners")}</option>
            {(props.owners ?? []).map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </FilterSelect>
        )}
        <ToggleChip icon="crown" label={t("list.proOnly")} checked={filter.pro} onChange={(pro) => set({ pro })} />
      </div>

      {filter.status === "deleted" && <p className="text-sm text-text-muted">{t("list.deletedHint")}</p>}

      {body}

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={onPageChange} />}
    </section>
  );
}
