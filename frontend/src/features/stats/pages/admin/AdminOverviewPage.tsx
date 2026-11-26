import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buttonClasses } from "@/components/common/buttonStyles";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { formatDateTime, type AdminApiError } from "@/features/user";
import LineChart from "../../components/LineChart";
import { Delta, Panel, StatsHeader, StatTile } from "../../components/StatsBits";
import { useOverviewStats } from "../../hooks";
import { DEFAULT_STATS_PERIOD, formatInt, formatPct, formatVnd, isEmptySeries } from "../../statsFormat";
import type { StatsPeriod } from "../../types";

const REPORTS_PATH = "/admin/reports";

/**
 * Tổng quan hệ thống (UC-NK-02): số tài khoản tại thời điểm tính, các chỉ số theo khoảng (mặc định 30 ngày), biểu đồ
 * người dùng hoạt động và tài khoản mới theo ngày, các báo cáo chờ quản trị viên lâu nhất.
 */
export default function AdminOverviewPage() {
  const { t, i18n } = useTranslation("statsAdmin");
  const language = i18n.language;
  const [period, setPeriod] = useState<StatsPeriod>(DEFAULT_STATS_PERIOD);
  const query = useOverviewStats(period);
  const data = query.data;
  const int = (value: number) => formatInt(value, language);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
      <StatsHeader title={t("overview.title")} computedAt={data?.computedAt} period={period} onPeriod={setPeriod} />

      {query.isLoading && <Skeleton className="h-96 w-full" />}
      {query.isError && !data && (
        <ErrorState
          title={t("loadError")}
          kind={(query.error as unknown as AdminApiError | null)?.kind === "network" ? "network" : "server"}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      )}

      {data && (
        <div className={`flex flex-col gap-5 transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label={t("overview.accounts")}
              value={int(data.accounts.total)}
              sub={
                <span className="text-xs text-text-muted">
                  {t("overview.accountsSplit", {
                    students: int(data.accounts.students),
                    teachers: int(data.accounts.teachers),
                    admins: int(data.accounts.admins),
                  })}
                </span>
              }
            />
            <StatTile
              label={t("overview.verified")}
              value={int(data.accounts.emailVerified)}
              sub={
                data.accounts.total > 0 && (
                  <span className="text-xs text-text-muted">
                    {t("overview.verifiedSub", {
                      pct: formatPct((data.accounts.emailVerified * 100) / data.accounts.total, language),
                    })}
                  </span>
                )
              }
            />
            <StatTile
              label={t("overview.newAccounts")}
              value={int(data.newAccounts.current ?? 0)}
              sub={<Delta metric={data.newAccounts} />}
            />
            <StatTile
              label={t("overview.activePro")}
              value={int(data.accounts.activePro)}
              sub={
                <span className="text-xs text-text-muted">
                  {t("overview.proRatio", { pct: formatPct(data.accounts.proRatioPct, language) })}
                </span>
              }
            />
            <StatTile
              label={t("overview.revenue")}
              value={formatVnd(data.recognizedRevenueVnd, language)}
              sub={<span className="text-xs text-text-muted">{t("overview.revenueSub")}</span>}
            />
            <StatTile
              label={t("overview.published")}
              value={t("overview.publishedValue", { lessons: int(data.publishedLessons), decks: int(data.publishedDecks) })}
            />
            <StatTile
              label={t("overview.pendingReports")}
              value={int(data.pendingAdminReports)}
              sub={
                data.pendingAdminReports > 0 && (
                  <Link to={REPORTS_PATH} className="text-xs font-semibold text-primary-text hover:underline">
                    {t("overview.handleNow")}
                  </Link>
                )
              }
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title={t("overview.activeUsersChart")}>
              <p className="-mt-2 text-xs text-text-muted">{t("overview.activeUsersHint")}</p>
              <LineChart
                days={data.daily.days}
                series={[
                  { key: "activeUsers", label: t("overview.activeUsers"), values: data.daily.series.activeUsers ?? [], color: "--chart-1" },
                ]}
                format={int}
                ariaLabel={t("overview.activeUsersChart")}
                emptyText={isEmptySeries(data.daily, ["activeUsers"]) ? t("empty") : undefined}
              />
            </Panel>
            <Panel title={t("overview.newAccountsChart")}>
              <LineChart
                days={data.daily.days}
                series={[
                  { key: "newAccounts", label: t("overview.newAccountsSeries"), values: data.daily.series.newAccounts ?? [], color: "--chart-1" },
                ]}
                format={int}
                ariaLabel={t("overview.newAccountsChart")}
                emptyText={isEmptySeries(data.daily, ["newAccounts"]) ? t("empty") : undefined}
              />
            </Panel>
          </div>

          <Panel
            title={t("overview.oldestReports")}
            action={
              data.pendingAdminReports > 0 && (
                <Link to={REPORTS_PATH} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                  <Icon name="flag" />
                  {t("overview.handleNow")}
                </Link>
              )
            }
          >
            {data.oldestPendingReports.length === 0 ? (
              <p className="py-4 text-center text-sm text-text-muted">{t("overview.noPendingReports")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {data.oldestPendingReports.map((report) => (
                  <li key={report.reportId}>
                    <Link
                      to={`${REPORTS_PATH}/${report.reportId}`}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:bg-surface-hover"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-text">{report.content ?? "—"}</span>
                        <span className="text-xs text-text-muted">
                          {t(`report:reasons.${report.reason}`, { defaultValue: report.reason })} ·{" "}
                          {report.reporterName
                            ? t("overview.reportedBy", { name: report.reporterName })
                            : t("overview.unknownReporter")}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-text-subtle">{formatDateTime(report.createdAt, language)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </main>
  );
}
