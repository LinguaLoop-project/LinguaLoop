import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { notificationText, safeInternalLink, useMarkNotificationRead, type NotificationItem } from "./notifications";

/**
 * Cách hiển thị và mở một thông báo, dùng chung cho chuông và trang Thông báo (BR-TK-22): nội dung dịch theo ngôn ngữ giao
 * diện (thiếu bản dịch thì dùng câu đã lưu); bấm vào thì đánh dấu đã đọc và, nếu có đường dẫn nội bộ, chuyển tới trang đó.
 */
export function useNotificationView(onNavigate?: () => void) {
  const { t, i18n } = useTranslation("layout");
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();

  const lookup = (key: string, params: Record<string, string>) =>
    i18n.exists(key, { ns: "layout" }) ? String(t(key, params)) : null;

  return {
    text: (item: NotificationItem) => notificationText(item, lookup, i18n.language),
    open: (item: NotificationItem) => {
      if (!item.read) markRead.mutate(item.id);
      const to = safeInternalLink(item.link);
      if (to) {
        onNavigate?.();
        navigate(to);
      }
    },
  };
}
