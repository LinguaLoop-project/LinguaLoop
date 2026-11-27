import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { AdminApiError } from "@/features/user";
import { toast } from "@/stores/toastStore";

/**
 * Lỗi quyền và lỗi không tìm thấy của màn thống kê một bài hoặc một bộ: không có quyền thì báo ngay trên màn (AC-TN-12,
 * 20); đã bị xóa thì báo và chuyển về danh sách (AC-TN-13, 21). Trả `null` khi lỗi thuộc loại khác.
 */
export function useContentAccessError(error: unknown, notFound: { path: string; message: string }): "forbidden" | "notFound" | null {
  const navigate = useNavigate();
  const status = (error as AdminApiError | null)?.status ?? null;
  const kind = status === 403 ? "forbidden" : status === 404 ? "notFound" : null;
  useEffect(() => {
    if (kind !== "notFound") return;
    toast(notFound.message, { icon: "circle-alert" });
    navigate(notFound.path, { replace: true });
  }, [kind, navigate, notFound.message, notFound.path]);
  return kind;
}
