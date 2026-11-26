import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import {
  NOTIFICATION_TONE_CLASS,
  notificationVisual,
  relativeTime,
  safeInternalLink,
  useMarkAllNotificationsRead,
  useNotifications,
  type NotificationItem,
} from "../notifications";
import { useNotificationView } from "../useNotificationView";

export interface NotificationBellProps {
  /** Lớp cho nút chuông, để khớp cụm nút trên thanh trên. */
  buttonClassName?: string;
  /** Đường dẫn trang Thông báo đầy đủ; có thì hộp chuông hiện liên kết "Xem tất cả thông báo" (UC-TK-09). */
  allHref?: string;
  /** Đường dẫn tới cài đặt nhắc nhở; có thì hiện nút lối tắt trong đầu bảng. */
  preferencesHref?: string;
}

/**
 * Chuông thông báo trên thanh trên cho mọi vai trò: chấm đỏ đếm số chưa đọc, bấm mở danh sách 20 thông báo mới nhất.
 * Bấm một thông báo thì đánh dấu đã đọc; có nút đánh dấu tất cả đã đọc và lối tắt sang cài đặt nhắc nhở.
 */
export default function NotificationBell({ buttonClassName = "", allHref, preferencesHref }: Readonly<NotificationBellProps>) {
  const { t } = useTranslation("layout");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const query = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const unread = query.data?.unreadCount ?? 0;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread > 0 ? t("notifications.ariaUnread", { count: unread }) : t("notifications.title")}
        title={t("notifications.title")}
        className={`relative ${buttonClassName}`}
      >
        <Icon name="bell" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white ring-2 ring-surface">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("notifications.title")}
          className="absolute right-0 top-[48px] z-[70] w-[min(380px,calc(100vw-24px))] animate-[menu-in_200ms_var(--ease-out)] overflow-hidden rounded-lg border border-border-strong bg-surface shadow-[0_24px_48px_-16px_rgba(0,0,0,.55),0_0_0_1px_var(--border)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text">{t("notifications.title")}</span>
              {unread > 0 && (
                <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-bold tabular-nums text-danger">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAll.mutate()}
                  disabled={markAll.isPending}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-xs font-semibold text-primary-text transition-colors hover:bg-primary-soft disabled:opacity-60"
                >
                  <Icon name="check-check" className="size-3.5" />
                  {t("notifications.markAll")}
                </button>
              )}
              {preferencesHref && (
                <Link
                  to={preferencesHref}
                  onClick={() => setOpen(false)}
                  title={t("notifications.page.preferences")}
                  aria-label={t("notifications.page.preferences")}
                  className="grid size-7 place-items-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
                >
                  <Icon name="sliders-horizontal" className="size-4" />
                </Link>
              )}
            </div>
          </div>
          <PanelBody
            isLoading={query.isLoading}
            isError={query.isError}
            items={query.data?.items ?? []}
            onRetry={() => void query.refetch()}
            onNavigate={() => setOpen(false)}
          />
          {allHref && (
            <Link
              to={allHref}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-center text-sm font-semibold text-primary-text transition-colors hover:bg-surface-hover"
            >
              <span>{t("notifications.viewAll")}</span>
              <Icon name="arrow-right" className="text-sm" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function PanelBody({
  isLoading,
  isError,
  items,
  onRetry,
  onNavigate,
}: Readonly<{
  isLoading: boolean;
  isError: boolean;
  items: NotificationItem[];
  onRetry: () => void;
  onNavigate: () => void;
}>) {
  const { t, i18n } = useTranslation("layout");
  const view = useNotificationView(onNavigate);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4" role="status" aria-label={t("notifications.loading")}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="size-8 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-full rounded-sm" />
              <Skeleton className="h-3 w-1/3 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <p className="px-4 py-6 text-center text-sm text-text-muted">
        {t("notifications.error")}{" "}
        <button type="button" className="cursor-pointer font-semibold text-primary-text hover:underline" onClick={onRetry}>
          {t("notifications.retry")}
        </button>
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-text-muted">
        <span className="grid size-10 place-items-center rounded-full bg-bg-elevated text-text-subtle">
          <Icon name="bell" className="size-5" />
        </span>
        {t("notifications.empty")}
      </div>
    );
  }
  return (
    <ul className="max-h-[380px] divide-y divide-border/60 overflow-y-auto">
      {items.map((item) => {
        const visual = notificationVisual(item.type);
        const hasLink = Boolean(safeInternalLink(item.link));
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => view.open(item)}
              className={`group relative flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors ${
                item.read ? "hover:bg-surface-hover/70" : "bg-primary-soft/45 hover:bg-primary-soft/75"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md ${NOTIFICATION_TONE_CLASS[visual.tone]}`}
              >
                <Icon name={visual.icon} className="text-base" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={`text-sm leading-snug ${item.read ? "text-text-muted" : "font-medium text-text"}`}>
                  {view.text(item)}
                </span>
                <span className="flex items-center gap-2 text-xs text-text-subtle">
                  <span>{relativeTime(item.createdAt, i18n.language)}</span>
                  {!item.read && <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />}
                </span>
              </span>
              {hasLink && (
                <Icon
                  name="chevron-right"
                  className="mt-2 shrink-0 text-sm text-text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-primary-text"
                />
              )}
              {!item.read && <span className="sr-only">{t("notifications.unread")}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
