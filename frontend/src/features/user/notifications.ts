import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/api/axiosClient";

export interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
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
  markRead: async (id: string): Promise<void> => {
    await axiosClient.post(`/notifications/${id}/read`);
  },
  markAllRead: async (): Promise<void> => {
    await axiosClient.post("/notifications/read-all");
  },
};

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
