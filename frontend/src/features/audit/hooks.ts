import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { auditApi } from "./api";
import type { AuditFilter } from "./types";

const AUDIT_KEY = ["admin", "audit-logs"] as const;

/** Danh sách nhật ký theo bộ lọc; giữ trang cũ khi đổi lọc để danh sách không nháy (UC-NK-01). */
export function useAuditLogs(filter: AuditFilter, page: number) {
  return useQuery({
    queryKey: [...AUDIT_KEY, "list", filter, page],
    queryFn: () => auditApi.list(filter, page),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** Chi tiết một mục; chỉ tải khi đã chọn mục. Nhật ký không đổi nên không cần tải lại. */
export function useAuditDetail(id: number | null) {
  return useQuery({
    queryKey: [...AUDIT_KEY, "detail", id],
    queryFn: () => auditApi.detail(id as number),
    enabled: id !== null,
    staleTime: Infinity,
    retry: false,
  });
}
