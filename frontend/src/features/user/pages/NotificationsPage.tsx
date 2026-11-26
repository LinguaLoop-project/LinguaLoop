import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import Pagination from "@/components/common/Pagination";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import { NETWORK_ERROR, toApiError } from "@/features/auth/errors";
import { toast } from "@/stores/toastStore";
import { useAuthStore } from "@/features/auth";
import {
  dateGroupOf,
  groupNotificationsByDate,
  NOTIFICATION_TONE_CLASS,
  notificationVisual,
  parseNotificationFilter,
  parsePageIndex,
  relativeTime,
  safeInternalLink,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationPage,
  useNotifications,
  type NotificationFilter,
} from "../notifications";
import { useNotificationView } from "../useNotificationView";

/** Trang Thông báo đầy đủ của học viên (UC-TK-09, BR-TK-18): phân nhóm theo ngày, icon theo loại, lọc Tất cả / Chưa đọc. */
export default function NotificationsPage() {
  const { t, i18n } = useTranslation("layout");
  const [params, setParams] = useSearchParams();
  const filter = parseNotificationFilter(params.get("filter"));
  const page = parsePageIndex(params.get("page"));
  const [now] = useState(() => Date.now());
  const timeZone = useAuthStore((state) => state.user?.timezone);
  const query = useNotificationPage(filter, page);
  // Trang trước chỉ để biết nhóm ngày đầu trang này có nối tiếp từ trang trước không.
  const previous = useNotificationPage(filter, Math.max(page - 1, 0), page > 0);
  const unread = useNotifications().data?.unreadCount ?? 0;
  const view = useNotificationView();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const data = query.data;

  const sections = useMemo(() => groupNotificationsByDate(data?.items ?? [], now, timeZone), [data?.items, now, timeZone]);
  const previousItems = previous.data?.items;
  const continuedGroup = useMemo(() => {
    const last = previousItems?.[previousItems.length - 1];
    return page > 0 && last ? dateGroupOf(last.createdAt, now, timeZone) : null;
  }, [page, previousItems, now, timeZone]);

  const update = (next: { filter?: NotificationFilter; page?: number }) => {
    const merged = new URLSearchParams(params);
    const nextFilter = next.filter ?? filter;
    const nextPage = next.page ?? page;
    if (nextFilter === "all") merged.delete("filter");
    else merged.set("filter", nextFilter);
    if (nextPage === 0) merged.delete("page");
    else merged.set("page", String(nextPage + 1));
    setParams(merged, { replace: true });
  };

  // Đánh dấu đã đọc hết trang cuối của bộ lọc Chưa đọc thì lùi về trang cuối còn thông báo.
  useEffect(() => {
    if (data && data.items.length === 0 && page > 0 && data.totalPages > 0) {
      const merged = new URLSearchParams(params);
      if (data.totalPages - 1 === 0) merged.delete("page");
      else merged.set("page", String(data.totalPages));
      setParams(merged, { replace: true });
    }
  }, [data, page, params, setParams]);

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: () => toast(t("notifications.page.markedAll"), { icon: "check-check" }),
    });
  };

  const from = data && data.totalElements > 0 ? data.page * data.size + 1 : 0;
  const to = data ? Math.min((data.page + 1) * data.size, data.totalElements) : 0;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Đầu trang thống nhất phong cách với trang Cài đặt */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-text">
              <Icon name="bell" className="size-3.5" />
              {t("notifications.page.overline")}
            </span>
            {unread > 0 && (
              <span className="inline-flex items-center rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-bold text-danger">
                {t("notifications.page.unreadBadge", { count: unread })}
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl font-bold leading-[1.15] tracking-[-0.02em] sm:text-4xl">
            {t("notifications.title")}
          </h1>
          <p className="mt-1 text-text-muted">{t("notifications.page.sub")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unread > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={markAll.isPending}
              leftIcon={<Icon name="check-check" />}
              onClick={handleMarkAll}
            >
              {t("notifications.markAll")}
            </Button>
          )}
          <Link
            to="/student/settings?tab=notifications"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-text-muted no-underline transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-text"
          >
            <Icon name="sliders-horizontal" className="text-base" />
            <span>{t("notifications.page.preferences")}</span>
          </Link>
        </div>
      </header>

      {/* Thanh bộ lọc + đếm số lượng hiển thị */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          ariaLabel={t("notifications.page.filterAria")}
          value={filter}
          onChange={(value) => update({ filter: parseNotificationFilter(value), page: 0 })}
          options={[
            { value: "all", label: t("notifications.page.all") },
            {
              value: "unread",
              label: unread > 0 ? t("notifications.page.unreadCount", { count: unread }) : t("notifications.page.unread"),
            },
          ]}
        />

        {data && data.totalElements > 0 && (
          <div className="flex items-center gap-2 text-xs font-medium text-text-subtle">
            {query.isFetching && <Icon name="loader-circle" className="animate-spin text-sm text-primary-text" />}
            <span className="tabular-nums">
              {t("notifications.page.showing", { from, to, total: data.totalElements })}
            </span>
          </div>
        )}
      </div>

      {/* Nội dung danh sách thông báo */}
      {query.isError && !data ? (
        <ErrorState
          kind={toApiError(query.error).code === NETWORK_ERROR ? "network" : "server"}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : !data ? (
        <div
          className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]"
          role="status"
          aria-label={t("notifications.loading")}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3.5 px-5 py-4">
              <Skeleton className="size-10 shrink-0 rounded-md" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-3.5 w-20 rounded-sm" />
                </div>
                <Skeleton className="h-4 w-4/5 rounded-sm" />
                <Skeleton className="h-4 w-2/5 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-6 py-12 text-center shadow-[var(--shadow-card)]">
          <Mascot mood={filter === "unread" ? "celebrate" : "hello"} size={96} alt="" />
          <h2 className="mt-3 font-display text-xl font-bold text-text">
            {filter === "unread" ? t("notifications.page.emptyUnread") : t("notifications.empty")}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            {filter === "unread" ? t("notifications.page.emptyUnreadDesc") : t("notifications.page.emptyDesc")}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {filter === "unread" ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => update({ filter: "all", page: 0 })}>
                {t("notifications.page.viewAllFilter")}
              </Button>
            ) : (
              <Link
                to="/student"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--btn-primary)] px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-[var(--btn-primary-hover)]"
              >
                {t("notifications.page.goToday")}
                <Icon name="arrow-right" className="text-sm" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5" aria-busy={query.isFetching}>
          {sections.map((section, index) => (
            <div key={section.group} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-subtle">
                  {t(`notifications.groups.${section.group}`)}
                  {index === 0 && continuedGroup === section.group && ` ${t("notifications.groups.continued")}`}
                </h2>
                <span className="h-px flex-1 bg-border/70" aria-hidden="true" />
              </div>

              <ul className="divide-y divide-border/80 overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]">
                {section.items.map((item) => {
                  const visual = notificationVisual(item.type);
                  const hasLink = Boolean(safeInternalLink(item.link));
                  const clickable = !item.read || hasLink;
                  const exactTime = new Date(item.createdAt).toLocaleString(i18n.language === "en" ? "en-GB" : "vi-VN", { timeZone: timeZone || undefined });

                  return (
                    <li
                      key={item.id}
                      className={`group relative flex items-stretch transition-colors duration-150 ${
                        item.read ? "hover:bg-surface-hover/65" : "bg-primary-soft/45 hover:bg-primary-soft/75"
                      }`}
                    >
                      {!item.read && (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-primary"
                        />
                      )}

                      <button
                        type="button"
                        disabled={!clickable}
                        onClick={() => view.open(item)}
                        className={`flex min-w-0 flex-1 items-start gap-3.5 px-5 py-4 text-left ${
                          clickable ? "cursor-pointer" : "cursor-default"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-md ${NOTIFICATION_TONE_CLASS[visual.tone]}`}
                        >
                          <Icon name={visual.icon} className="text-lg" />
                        </span>

                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${NOTIFICATION_TONE_CLASS[visual.tone]}`}
                            >
                              {t(`notifications.categories.${visual.category}`)}
                            </span>
                            <time dateTime={item.createdAt} title={exactTime} className="text-xs text-text-subtle">
                              {relativeTime(item.createdAt, i18n.language)}
                            </time>
                            {!item.read && (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-text"
                              >
                                <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                                {t("notifications.unread")}
                              </span>
                            )}
                          </span>

                          <span
                            className={`text-sm leading-relaxed ${
                              item.read ? "text-text-muted" : "font-medium text-text"
                            }`}
                          >
                            {view.text(item)}
                          </span>
                        </span>

                        {hasLink && (
                          <span
                            aria-hidden="true"
                            className="mt-2.5 inline-flex shrink-0 items-center text-text-subtle transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary-text"
                          >
                            <Icon name="chevron-right" className="text-base" />
                          </span>
                        )}
                      </button>

                      {/* Đánh dấu đã đọc lẻ từng thông báo mà không cần rời trang */}
                      {!item.read && (
                        <div className="flex shrink-0 items-center pr-3.5">
                          <button
                            type="button"
                            disabled={markRead.isPending && markRead.variables === item.id}
                            onClick={() => markRead.mutate(item.id)}
                            title={t("notifications.page.markOneRead")}
                            aria-label={t("notifications.page.markOneRead")}
                            className="grid size-8 cursor-pointer place-items-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-primary-text disabled:opacity-50"
                          >
                            <Icon name="check" className="text-base" />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onChange={(next) => update({ page: next })} />
      )}
    </section>
  );
}
