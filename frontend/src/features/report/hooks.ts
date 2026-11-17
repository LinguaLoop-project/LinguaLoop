import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportApi } from "./api";
import { DEFAULT_REPORT_FILTER } from "./reportForm";
import type { RepublishTarget, ReportFilter, ReviewRole, SubmitReportInput } from "./types";

export const reportKeys = {
  all: ["report"] as const,
  list: (role: ReviewRole, filter: ReportFilter, page: number) => [...reportKeys.all, "list", role, filter, page] as const,
  detail: (role: ReviewRole, reportId: string) => [...reportKeys.all, "detail", role, reportId] as const,
  takedown: (targetType: RepublishTarget, targetId: string) =>
    [...reportKeys.all, "takedown", targetType, targetId] as const,
  offensiveCount: (targetType: RepublishTarget, targetId: string) =>
    [...reportKeys.all, "offensive-count", targetType, targetId] as const,
  republishList: (page: number) => [...reportKeys.all, "republish", "list", page] as const,
  republishDetail: (requestId: string) => [...reportKeys.all, "republish", "detail", requestId] as const,
};

/** Không tự thử lại: lỗi hiện ngay kèm nút "Thử lại". */
export function useReportList(role: ReviewRole, filter: ReportFilter, page: number) {
  return useQuery({
    queryKey: reportKeys.list(role, filter, page),
    queryFn: () => reportApi.list(role, filter, page),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** Mục menu có số đếm: báo cáo đang chờ chính vai trò xử lý, hoặc yêu cầu xuất bản lại đang chờ duyệt. */
export type ReportBadgeKind = ReviewRole | "republish";

const BADGE_REFRESH_MS = 60_000;

/**
 * Số trên mục menu, lấy từ cùng truy vấn trang 1 với bộ lọc mặc định của màn danh sách (cùng khóa cache) nên luôn khớp
 * với số dòng màn đó báo; mỗi dòng là một nhóm báo cáo trùng (BR-XL-06). Tự làm mới mỗi phút và sau mọi thao tác xử lý.
 * {@code kind} null thì không gọi máy chủ.
 */
export function useReportBadge(kind: ReportBadgeKind | null): number | undefined {
  const reports = useQuery({
    queryKey: reportKeys.list(kind === "admin" ? "admin" : "teacher", DEFAULT_REPORT_FILTER, 0),
    queryFn: () => reportApi.list(kind === "admin" ? "admin" : "teacher", DEFAULT_REPORT_FILTER, 0),
    enabled: kind === "teacher" || kind === "admin",
    refetchInterval: BADGE_REFRESH_MS,
    retry: false,
  });
  const republish = useQuery({
    queryKey: reportKeys.republishList(0),
    queryFn: () => reportApi.republishList(0),
    enabled: kind === "republish",
    refetchInterval: BADGE_REFRESH_MS,
    retry: false,
  });
  if (kind === "republish") return republish.data?.totalElements;
  return kind ? reports.data?.totalElements : undefined;
}

/** Danh sách giáo viên chủ cho bộ lọc của quản trị viên; giáo viên không gọi. */
export function useReportOwners(enabled: boolean) {
  return useQuery({
    queryKey: [...reportKeys.all, "owners"],
    queryFn: () => reportApi.owners(),
    enabled,
    retry: false,
  });
}

export function useReportDetail(role: ReviewRole, reportId: string | undefined) {
  return useQuery({
    queryKey: reportKeys.detail(role, reportId ?? ""),
    queryFn: () => reportApi.detail(role, reportId ?? ""),
    enabled: Boolean(reportId),
    retry: false,
  });
}

/** Sau mọi thao tác xử lý, tải lại danh sách và chi tiết (dòng có thể đã đổi ở nơi khác). */
function useReportMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: reportKeys.all }),
  });
}

export function useApplyFix() {
  return useReportMutation(({ reportId, entryId }: { reportId: string; entryId: string }) =>
    reportApi.applyFix(reportId, entryId),
  );
}

export function useResolveReport() {
  return useReportMutation(({ reportId, note }: { reportId: string; note: string }) => reportApi.resolve(reportId, note));
}

export function useRejectReport(role: ReviewRole) {
  return useReportMutation(({ reportId, note }: { reportId: string; note: string }) =>
    reportApi.reject(role, reportId, note),
  );
}

export function useRejectAllByReporter() {
  return useReportMutation(({ studentId, note }: { studentId: string; note: string }) =>
    reportApi.rejectAllByReporter(studentId, note),
  );
}

export function useSubmitReport() {
  return useMutation({ mutationFn: (input: SubmitReportInput) => reportApi.submit(input) });
}

export function useTakedownReport() {
  return useReportMutation(({ reportId, note }: { reportId: string; note: string }) =>
    reportApi.takedown(reportId, note),
  );
}

/** Dấu "Bị quản trị viên gỡ" của nội dung giáo viên đang xem; không thử lại khi lỗi. */
export function useTakedownStatus(targetType: RepublishTarget, targetId: string | undefined) {
  return useQuery({
    queryKey: reportKeys.takedown(targetType, targetId ?? ""),
    queryFn: () => reportApi.takedownStatus(targetType, targetId ?? ""),
    enabled: Boolean(targetId),
    retry: false,
  });
}

/** Bài học hoặc bộ thẻ có đang mang dấu "Bị quản trị viên gỡ" không; dùng chung truy vấn với khung TakedownNotice. */
export function useIsTakenDown(targetType: RepublishTarget, targetId: string | undefined): boolean {
  return useTakedownStatus(targetType, targetId).data?.takenDown ?? false;
}

/** Có yêu cầu xuất bản lại đang chờ duyệt không; xóa nội dung sẽ hủy yêu cầu này (BR-XL-13). */
export function useHasPendingRepublish(targetType: RepublishTarget, targetId: string | undefined): boolean {
  return useTakedownStatus(targetType, targetId).data?.pending ?? false;
}

/** Số báo cáo Phản cảm đang mở của nội dung, cho hộp gỡ tay của quản trị viên; không có id thì không gọi. */
export function useOpenOffensiveCount(targetType: RepublishTarget, targetId: string | undefined): number {
  return (
    useQuery({
      queryKey: reportKeys.offensiveCount(targetType, targetId ?? ""),
      queryFn: () => reportApi.offensiveCount(targetType, targetId ?? ""),
      enabled: Boolean(targetId),
      retry: false,
    }).data ?? 0
  );
}

export function useRequestRepublish() {
  return useReportMutation(
    ({ targetType, targetId, note }: { targetType: RepublishTarget; targetId: string; note: string | null }) =>
      reportApi.requestRepublish(targetType, targetId, note),
  );
}

export function useRepublishList(page: number) {
  return useQuery({
    queryKey: reportKeys.republishList(page),
    queryFn: () => reportApi.republishList(page),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useRepublishDetail(requestId: string | undefined) {
  return useQuery({
    queryKey: reportKeys.republishDetail(requestId ?? ""),
    queryFn: () => reportApi.republishDetail(requestId ?? ""),
    enabled: Boolean(requestId),
    retry: false,
  });
}

export function useApproveRepublish() {
  return useReportMutation((requestId: string) => reportApi.approveRepublish(requestId));
}

export function useRejectRepublish() {
  return useReportMutation(({ requestId, note }: { requestId: string; note: string }) =>
    reportApi.rejectRepublish(requestId, note),
  );
}
