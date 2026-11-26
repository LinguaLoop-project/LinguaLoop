import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buttonClasses } from "@/components/common/buttonStyles";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import type { AdminApiError } from "@/features/user";
import LineChart from "../../components/LineChart";
import { FeatureProfitTable, ProfitSummary } from "../../components/AiStatsBits";
import { Panel, StatsHeader } from "../../components/StatsBits";
import { useAiUsageStats } from "../../hooks";
import { AI_FEATURE_ORDER, DEFAULT_STATS_PERIOD, featureColor, formatInt, formatVnd, isEmptySeries } from "../../statsFormat";
import type { FeatureUsage, StatsPeriod } from "../../types";

const CREDIT_CONFIG_PATH = "/admin/credit";
/** Tính năng theo thứ tự cố định của biểu đồ để màu đi theo tính năng. */
function byFixedOrder(a: FeatureUsage, b: FeatureUsage): number {
  const rank = (f: string) => (AI_FEATURE_ORDER.includes(f) ? AI_FEATURE_ORDER.indexOf(f) : AI_FEATURE_ORDER.length);
  return rank(a.feature) - rank(b.feature) || a.feature.localeCompare(b.feature);
}

/**
 * Thống kê AI và chi phí (UC-NK-04): đang lãi hay lỗ (doanh thu thuần, chi phí AI, lãi gộp), tính năng nào lỗ (giá bán
 * so với chi phí mỗi đơn vị), credit theo ngày và 10 tài khoản tiêu nhiều credit nhất.
 */
export default function AdminAiStatsPage() {
  const { t, i18n } = useTranslation("statsAdmin");
  const language = i18n.language;
  const [period, setPeriod] = useState<StatsPeriod>(DEFAULT_STATS_PERIOD);
  const query = useAiUsageStats(period);
  const data = query.data;
  const int = (value: number) => formatInt(value, language);
  const vnd = (value: number | null) => formatVnd(value, language);
  const featureName = (feature: string) => t(`ai.features.${feature}`, { defaultValue: feature });
  const features = data ? [...data.features].sort(byFixedOrder) : [];
  const noUsage = data ? isEmptySeries(data.creditsByFeature) && data.topAccounts.length === 0 : false;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
      <StatsHeader title={t("ai.title")} computedAt={data?.computedAt} period={period} onPeriod={setPeriod}>
        <Link to={CREDIT_CONFIG_PATH} className={`${buttonClasses({ variant: "ghost", size: "sm" })} ml-auto`}>
          <Icon name="sliders-horizontal" />
          {t("ai.adjustCredit")}
        </Link>
      </StatsHeader>

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
          <ProfitSummary totals={data.totals} />

          <Panel
            title={t("ai.featureTable")}
            action={<span className="text-xs text-text-muted">{t("ai.creditValue", { value: vnd(data.creditValueVnd) })}</span>}
          >
            <FeatureProfitTable features={data.features} featureName={featureName} />
          </Panel>

          <Panel title={t("ai.creditsChart")}>
            <LineChart
              days={data.creditsByFeature.days}
              series={features.map((f) => ({
                key: f.feature,
                label: featureName(f.feature),
                values: data.creditsByFeature.series[f.feature] ?? data.creditsByFeature.days.map(() => 0),
                color: featureColor(f.feature),
              }))}
              format={int}
              ariaLabel={t("ai.creditsChart")}
              emptyText={noUsage ? t("empty") : undefined}
            />
          </Panel>

          <Panel title={t("ai.topAccounts")}>
            {data.topAccounts.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">{t("empty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border text-xs text-text-subtle">
                    <tr>
                      <th className="py-2 pr-3 font-semibold">{t("ai.colName")}</th>
                      <th className="px-3 py-2 font-semibold">{t("ai.colPlan")}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t("ai.colCredits")}</th>
                      <th className="py-2 pl-3 text-right font-semibold">{t("ai.colCost")}</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {data.topAccounts.map((account) => (
                      <tr key={account.userId} className="border-b border-border last:border-0">
                        <td className="py-2.5 pr-3">
                          <Link to={`/admin/users/${account.userId}`} className="flex min-w-0 flex-col hover:underline">
                            <span className="truncate font-medium text-text">{account.name}</span>
                            <span className="truncate text-xs text-text-muted">{account.email}</span>
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-text">
                          {account.plan ? t(`accountPlans.${account.plan}`, { defaultValue: account.plan }) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-text">
                          {t("ai.credits", { count: account.credits, value: int(account.credits) })}
                        </td>
                        <td className="py-2.5 pl-3 text-right text-text">{vnd(account.costVnd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}
    </main>
  );
}
