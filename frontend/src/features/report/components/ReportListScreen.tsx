import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useReportList, useReportOwners } from "../hooks";
import { reportDetailPath } from "../paths";
import { DEFAULT_REPORT_FILTER } from "../reportForm";
import type { ReportApiError, ReportFilter, ReviewRole } from "../types";
import ReportListView from "./ReportListView";

/**
 * Trang "Báo cáo của học viên" (UC-XL-01). Đổi bộ lọc thì quay về trang đầu. Quản trị viên mở từ chi tiết báo cáo với
 * `?reporterId=` để xem báo cáo của một học viên (BR-XL-14).
 */
export default function ReportListScreen({ role }: Readonly<{ role: ReviewRole }>) {
  const { t } = useTranslation("report");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reporterId = role === "admin" ? params.get("reporterId") : null;
  const reporterName = params.get("reporterName");
  const [filter, setFilter] = useState<ReportFilter>(() =>
    reporterId ? { ...DEFAULT_REPORT_FILTER, status: "all", reporterId } : DEFAULT_REPORT_FILTER,
  );
  const [page, setPage] = useState(0);
  const query = useReportList(role, filter, page);
  const owners = useReportOwners(role === "admin").data ?? [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <h1 className="text-2xl font-bold text-text">
        {role === "teacher" ? t("list.titleTeacher") : t("list.titleAdmin")}
      </h1>
      <ReportListView
        role={role}
        filter={filter}
        onFilterChange={(next) => {
          setFilter(next);
          setPage(0);
        }}
        page={page}
        onPageChange={setPage}
        data={query.data}
        isLoading={query.isLoading}
        error={query.isError ? (query.error as unknown as ReportApiError) : null}
        onRetry={() => void query.refetch()}
        onOpen={(item) => navigate(reportDetailPath(role, item.id))}
        reporterName={reporterName}
        owners={owners}
      />
    </main>
  );
}
