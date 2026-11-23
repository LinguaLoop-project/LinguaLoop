import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Pagination from "@/components/common/Pagination";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import {
  parseNotificationFilter,
  parsePageIndex,
  relativeTime,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationPage,
  useNotifications,
  type NotificationFilter,
} from "../notifications";

/** Trang Thông báo đầy đủ của học viên (UC-TK-09, BR-TK-18): lọc Tất cả hoặc Chưa đọc, 20 thông báo mỗi trang. */
export default function NotificationsPage() {
  const { t, i18n } = useTranslation("layout");
  const [params, setParams] = useSearchParams();
  const filter = parseNotificationFilter(params.get("filter"));
  const page = parsePageIndex(params.get("page"));
  const query = useNotificationPage(filter, page);
  const unread = useNotifications().data?.unreadCount ?? 0;
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const data = query.data;

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

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text">
            {t("notifications.page.overline")}
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{t("notifications.title")}</h1>
          <p className="mt-1 text-text-muted">{t("notifications.page.sub")}</p>
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" isLoading={markAll.isPending} onClick={() => markAll.mutate()}>
            <Icon name="check-check" />
            {t("notifications.markAll")}
          </Button>
        )}
      </header>

      <SegmentedControl
        ariaLabel={t("notifications.page.filterAria")}
        value={filter}
        onChange={(value) => update({ filter: parseNotificationFilter(value), page: 0 })}
        options={[
          { value: "all", label: t("notifications.page.all") },
          { value: "unread", label: unread > 0 ? t("notifications.page.unreadCount", { count: unread }) : t("notifications.page.unread") },
        ]}
      />

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]" aria-busy={query.isFetching}>
        {query.isError && !data ? (
          <p className="px-5 py-10 text-center text-sm text-text-muted">
            {t("notifications.error")}{" "}
            <button type="button" className="cursor-pointer font-semibold text-primary hover:underline" onClick={() => void query.refetch()}>
              {t("notifications.retry")}
            </button>
          </p>
        ) : !data ? (
          <div className="flex flex-col gap-3 p-5" role="status" aria-label={t("notifications.loading")}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-text-muted">
            <Icon name="bell" className="size-7 text-text-subtle" />
            {filter === "unread" ? t("notifications.page.emptyUnread") : t("notifications.empty")}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!item.read) markRead.mutate(item.id);
                  }}
                  className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-hover ${
                    item.read ? "cursor-default" : "cursor-pointer bg-primary-soft"
                  }`}
                >
                  <span aria-hidden="true" className={`mt-2 size-2 shrink-0 rounded-full ${item.read ? "bg-transparent" : "bg-primary"}`} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={`text-sm leading-snug ${item.read ? "text-text-muted" : "font-medium text-text"}`}>{item.message}</span>
                    <time dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString(i18n.language === "en" ? "en-GB" : "vi-VN")} className="text-xs text-text-subtle">
                      {relativeTime(item.createdAt, i18n.language)}
                    </time>
                  </span>
                  {!item.read && <span className="sr-only">{t("notifications.unread")}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.totalPages > 1 && <Pagination page={data.page} totalPages={data.totalPages} onChange={(next) => update({ page: next })} />}
    </section>
  );
}
