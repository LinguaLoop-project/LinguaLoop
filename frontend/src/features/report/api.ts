import { isAxiosError } from "axios";
import { axiosClient } from "@/api/axiosClient";
import { listParams } from "./reportForm";
import type {
  ApiResponse,
  Page,
  ReportApiError,
  ReportDetail,
  ReportFieldError,
  ReportFilter,
  ReportItem,
  ReportOwner,
  RepublishDetail,
  RepublishItem,
  RepublishTarget,
  ReviewRole,
  SubmitReportInput,
  TakedownStatus,
} from "./types";

const REQUEST_TIMEOUT_MS = 15_000;

/** Đổi lỗi axios thành `ReportApiError`; không có phản hồi (mất mạng, hết thời gian) là "network". */
export function toReportApiError(error: unknown): ReportApiError {
  if (!isAxiosError(error)) {
    return { kind: "unknown", status: null, code: null, fieldErrors: [], details: {} };
  }
  const status = error.response?.status ?? null;
  const body = error.response?.data as
    | { code?: string; errors?: ReportFieldError[]; details?: Record<string, unknown> }
    | undefined;
  const base = {
    status,
    code: body?.code ?? null,
    fieldErrors: (body?.errors ?? []).map(({ field, code }) => ({ field, code })),
    details: body?.details ?? {},
  };
  if (status === null) return { kind: "network", ...base };
  if (base.code === "REPORT_NOT_FIXED" || base.code === "REPUBLISH_NOT_FIXED") return { kind: "notFixed", ...base };
  if (status === 401) return { kind: "unauthorized", ...base };
  if (status === 403) return { kind: "forbidden", ...base };
  if (status === 404) return { kind: "notFound", ...base };
  if (status === 409) return { kind: "conflict", ...base };
  if (status === 400) return { kind: "validation", ...base };
  if (status >= 500) return { kind: "server", ...base };
  return { kind: "unknown", ...base };
}

async function wrap<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toReportApiError(error);
  }
}

const base = (role: ReviewRole) => (role === "teacher" ? "/teacher/reports" : "/admin/reports");

export const reportApi = {
  /** Học viên gửi báo cáo (UC-BC-01). */
  submit: (input: SubmitReportInput) =>
    wrap(async () => {
      await axiosClient.post("/reports", input, { timeout: REQUEST_TIMEOUT_MS });
    }),

  list: (role: ReviewRole, filter: ReportFilter, page: number) =>
    wrap(async () => {
      const res = await axiosClient.get<ApiResponse<Page<ReportItem>>>(base(role), {
        params: listParams(filter, page, role),
        timeout: REQUEST_TIMEOUT_MS,
      });
      return res.data.data;
    }),

  detail: (role: ReviewRole, reportId: string) =>
    wrap(async () => {
      const res = await axiosClient.get<ApiResponse<ReportDetail>>(`${base(role)}/${reportId}`, {
        timeout: REQUEST_TIMEOUT_MS,
      });
      return res.data.data;
    }),

  /** Giáo viên đánh dấu cả dòng Đã xử lý (UC-XL-02). */
  resolve: (reportId: string, note: string) =>
    wrap(async () => {
      await axiosClient.post(`/teacher/reports/${reportId}/resolve`, { note }, { timeout: REQUEST_TIMEOUT_MS });
    }),

  /** Giáo viên ghi bản sửa đề xuất của một báo cáo trong dòng vào nội dung (UC-XL-02 nhánh 2a, BR-XL-10). */
  applyFix: (reportId: string, entryId: string) =>
    wrap(async () => {
      await axiosClient.post(`/teacher/reports/${reportId}/apply-fix`, { entryId }, { timeout: REQUEST_TIMEOUT_MS });
    }),

  /** Từ chối cả dòng (UC-XL-03). */
  reject: (role: ReviewRole, reportId: string, note: string) =>
    wrap(async () => {
      await axiosClient.post(`${base(role)}/${reportId}/reject`, { note }, { timeout: REQUEST_TIMEOUT_MS });
    }),

  /** Quản trị viên gỡ bài học hoặc bộ thẻ và đóng báo cáo (UC-XL-04). */
  takedown: (reportId: string, note: string) =>
    wrap(async () => {
      await axiosClient.post(`/admin/reports/${reportId}/takedown`, { note }, { timeout: REQUEST_TIMEOUT_MS });
    }),

  /** Dấu "Bị quản trị viên gỡ" của bài học hoặc bộ thẻ của giáo viên. */
  takedownStatus: (targetType: RepublishTarget, targetId: string) =>
    wrap(async () => {
      const res = await axiosClient.get<ApiResponse<TakedownStatus>>("/teacher/republish-requests/status", {
        params: { targetType, targetId },
        timeout: REQUEST_TIMEOUT_MS,
      });
      return res.data.data;
    }),

  /** Giáo viên gửi yêu cầu xuất bản lại kèm ghi chú (UC-BT-05, UC-BH-06 nhánh 2b, BR-XL-13). */
  requestRepublish: (targetType: RepublishTarget, targetId: string, note: string | null = null) =>
    wrap(async () => {
      await axiosClient.post(
        "/teacher/republish-requests",
        { targetType, targetId, note },
        { timeout: REQUEST_TIMEOUT_MS },
      );
    }),

  /** Số báo cáo Phản cảm đang mở sẽ được đóng cùng khi quản trị viên gỡ tay (UC-BH-07, UC-BT-06 Bước 2). */
  offensiveCount: (targetType: RepublishTarget, targetId: string) =>
    wrap(async () => {
      const res = await axiosClient.get<ApiResponse<{ count: number }>>("/admin/reports/offensive-count", {
        params: { targetType, targetId },
        timeout: REQUEST_TIMEOUT_MS,
      });
      return res.data.data.count;
    }),

  /** Giáo viên chủ có nội dung bị báo, cho bộ lọc của quản trị viên (AC-XL-09). */
  owners: () =>
    wrap(async () => {
      const res = await axiosClient.get<ApiResponse<ReportOwner[]>>("/admin/reports/owners", {
        timeout: REQUEST_TIMEOUT_MS,
      });
      return res.data.data;
    }),

  republishList: (page: number) =>
    wrap(async () => {
      const res = await axiosClient.get<ApiResponse<Page<RepublishItem>>>("/admin/republish-requests", {
        params: { page },
        timeout: REQUEST_TIMEOUT_MS,
      });
      return res.data.data;
    }),

  republishDetail: (requestId: string) =>
    wrap(async () => {
      const res = await axiosClient.get<ApiResponse<RepublishDetail>>(`/admin/republish-requests/${requestId}`, {
        timeout: REQUEST_TIMEOUT_MS,
      });
      return res.data.data;
    }),

  approveRepublish: (requestId: string) =>
    wrap(async () => {
      await axiosClient.post(`/admin/republish-requests/${requestId}/approve`, {}, { timeout: REQUEST_TIMEOUT_MS });
    }),

  rejectRepublish: (requestId: string, note: string) =>
    wrap(async () => {
      await axiosClient.post(`/admin/republish-requests/${requestId}/reject`, { note }, { timeout: REQUEST_TIMEOUT_MS });
    }),

  /** Quản trị viên từ chối mọi báo cáo đang mở của một học viên (UC-XL-03 nhánh 2a). */
  rejectAllByReporter: (studentId: string, note: string) =>
    wrap(async () => {
      const res = await axiosClient.post<ApiResponse<{ rejected: number }>>(
        `/admin/reports/reporters/${studentId}/reject`,
        { note },
        { timeout: REQUEST_TIMEOUT_MS },
      );
      return res.data.data.rejected;
    }),
};
