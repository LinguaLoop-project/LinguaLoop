import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/api/axiosClient";

export interface NotificationItem {
  id: string;
  /** Câu tiếng Việt dự phòng; thông báo có loại thì giao diện dựng lại bằng bản dịch (BR-TK-22). */
  message: string;
  read: boolean;
  createdAt: string;
  /** Loại thông báo (ví dụ `PRO_ACTIVATED`); thông báo cũ không có. */
  type?: string | null;
  params?: Record<string, string> | null;
  /** Đường dẫn trong ứng dụng để mở khi bấm vào thông báo. */
  link?: string | null;
}

export interface Notifications {
  items: NotificationItem[];
  unreadCount: number;
}

interface ApiResponse<T> {
  data: T;
}

export const notificationApi = {
  latest: async (): Promise<Notifications> =>
    (await axiosClient.get<ApiResponse<Notifications>>("/notifications")).data.data,
  page: async (filter: NotificationFilter, page: number): Promise<NotificationPage> =>
    (await axiosClient.get<ApiResponse<NotificationPage>>("/notifications/all", { params: { filter, page } })).data.data,
  markRead: async (id: string): Promise<void> => {
    await axiosClient.post(`/notifications/${id}/read`);
  },
  markAllRead: async (): Promise<void> => {
    await axiosClient.post("/notifications/read-all");
  },
};

export type NotificationFilter = "all" | "unread";

export interface NotificationPage {
  items: NotificationItem[];
  /** Từ 0. */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Bộ lọc trên địa chỉ trang; giá trị lạ về "Tất cả". */
export function parseNotificationFilter(raw: string | null): NotificationFilter {
  return raw === "unread" ? "unread" : "all";
}

/** Trang trên địa chỉ đánh số từ 1; giá trị lạ về trang đầu. Trả về chỉ số từ 0. */
export function parsePageIndex(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 5000 ? n - 1 : 0;
}

const KEY = ["notifications"] as const;
/** Thông báo mới (nhắc quá hạn, kết quả duyệt…) đến từ máy chủ; tải lại định kỳ thay cho đẩy thời gian thực. */
const REFRESH_MS = 60_000;

export function useNotifications() {
  return useQuery({
    queryKey: KEY,
    queryFn: notificationApi.latest,
    refetchInterval: REFRESH_MS,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** Một trang của trang Thông báo; cùng tiền tố khoá với chuông nên đánh dấu đã đọc làm mới cả hai. */
export function useNotificationPage(filter: NotificationFilter, page: number) {
  return useQuery({
    queryKey: [...KEY, "page", filter, page],
    queryFn: () => notificationApi.page(filter, page),
    refetchInterval: REFRESH_MS,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markRead,
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

/** "5 phút trước", "2 giờ trước"... theo ngôn ngữ giao diện; quá 7 ngày thì hiện ngày. */
export function relativeTime(iso: string, language: string, now: number = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const format = new Intl.RelativeTimeFormat(language === "en" ? "en" : "vi", { numeric: "auto" });
  const abs = Math.abs(seconds);
  if (abs < 60) return format.format(0, "second");
  if (abs < 3600) return format.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return format.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86_400) return format.format(Math.round(seconds / 86_400), "day");
  return new Date(iso).toLocaleDateString(language === "en" ? "en-GB" : "vi-VN");
}

/** Tra bản dịch của một khóa; trả `null` nếu chưa có để dùng câu dự phòng. */
export type NotificationLookup = (key: string, params: Record<string, string>) => string | null;

/** Hiện ngày theo múi giờ Việt Nam để khớp ngày gói Pro tính theo lịch Việt Nam. */
function formatNoticeDate(iso: string, language: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(language === "en" ? "en-GB" : "vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

/**
 * Nội dung hiển thị của một thông báo (BR-TK-22): có loại và có bản dịch thì dùng bản dịch theo ngôn ngữ giao diện với các
 * tham số đi kèm (ngày được định dạng lại); ngược lại dùng câu đã lưu.
 */
export function notificationText(item: NotificationItem, lookup: NotificationLookup, language: string): string {
  if (!item.type) return item.message;
  const params: Record<string, string> = { ...(item.params ?? {}) };
  if (params.endsAt) params.endsAt = formatNoticeDate(params.endsAt, language);
  return lookup(`notifications.types.${item.type}`, params) ?? item.message;
}

/** Chỉ nhận đường dẫn nội bộ (`/...`), bỏ đường dẫn ra ngoài hoặc dạng `//host` để thông báo không dẫn người dùng đi nơi khác. */
export function safeInternalLink(link: string | null | undefined): string | null {
  if (!link || !link.startsWith("/") || link.startsWith("//") || link.includes("\\")) return null;
  return link;
}

export interface NotificationPreference {
  /** Tên loại, ví dụ `REVIEW_DUE`. */
  type: string;
  enabled: boolean;
}

export interface NotificationPreferences {
  items: NotificationPreference[];
}

const PREFERENCES_KEY = ["notification-preferences"] as const;

/** Các loại nhắc học viên bật hoặc tắt được (BR-TK-23). */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: async () =>
      (await axiosClient.get<ApiResponse<NotificationPreferences>>("/notifications/preferences")).data.data,
    retry: false,
  });
}

/** Đổi một công tắc ngay trên giao diện, lỗi thì hoàn lại giá trị cũ (BR-TK-23). */
export function useSetNotificationPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, enabled }: { type: string; enabled: boolean }) =>
      (await axiosClient.put<ApiResponse<NotificationPreferences>>(`/notifications/preferences/${type}`, { enabled })).data
        .data,
    onMutate: async ({ type, enabled }) => {
      await queryClient.cancelQueries({ queryKey: PREFERENCES_KEY });
      const previous = queryClient.getQueryData<NotificationPreferences>(PREFERENCES_KEY);
      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(PREFERENCES_KEY, {
          items: previous.items.map((item) => (item.type === type ? { ...item, enabled } : item)),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(PREFERENCES_KEY, context.previous);
    },
    onSuccess: (data) => queryClient.setQueryData(PREFERENCES_KEY, data),
  });
}
