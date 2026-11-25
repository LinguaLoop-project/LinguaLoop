import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import { formatInt, formatPct, formatVnd, sortFeaturesForTable } from "../statsFormat";
import type { AiTotals, FeatureUsage } from "../types";
import { StatTile } from "./StatsBits";

/** Thành phần của trang Thống kê AI và chi phí (UC-NK-04). */

/** 3 ô lãi lỗ (BR-NK-09): doanh thu thuần, chi phí AI kèm phần dùng thử của học viên Free, lãi gộp. */
export function ProfitSummary({ totals }: Readonly<{ totals: AiTotals }>) {
  const { t, i18n } = useTranslation("statsAdmin");
  const language = i18n.language;
  const vnd = (value: number | null) => formatVnd(value, language);
  const muted = (text: string) => <span className="text-xs text-text-muted">{text}</span>;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatTile label={t("ai.netRevenue")} value={vnd(totals.netRevenueVnd)} sub={muted(t("ai.netRevenueHint"))} />
      <StatTile
        label={t("ai.cost")}
        value={vnd(totals.costVnd)}
        sub={totals.trialCostPct === null ? undefined : muted(t("ai.trialShare", { pct: formatPct(totals.trialCostPct, language) }))}
      />
      <StatTile
        label={t("ai.grossProfit")}
        value={vnd(totals.grossProfitVnd)}
        sub={muted(t("ai.grossMargin", { pct: formatPct(totals.grossMarginPct, language) }))}
      />
    </div>
  );
}

/**
 * Bảng lãi lỗ từng tính năng (BR-NK-09): số đơn vị đã dùng, giá bán và chi phí bình quân mỗi đơn vị (cùng đơn vị với
 * bảng dịch vụ tính credit) kèm dấu "Lỗ", chi phí thực tế. Tính năng chưa có lần dùng gom thành một dòng dưới bảng.
 */
export function FeatureProfitTable({ features, featureName }: Readonly<{ features: FeatureUsage[]; featureName: (feature: string) => string }>) {
  const { t, i18n } = useTranslation("statsAdmin");
  const language = i18n.language;
  const int = (value: number) => formatInt(value, language);
  const vnd = (value: number | null) => formatVnd(value, language);
  const sorted = sortFeaturesForTable(features);
  const used = sorted.filter((f) => f.uses > 0);
  const unused = sorted.filter((f) => f.uses === 0);

  return (
    <div className="flex flex-col gap-3">
      {used.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs text-text-subtle">
              <tr>
                <th className="py-2 pr-3 font-semibold">{t("ai.colFeature")}</th>
                <th className="px-3 py-2 text-right font-semibold">{t("ai.colUsed")}</th>
                <th className="px-3 py-2 text-right font-semibold">{t("ai.colPrice")}</th>
                <th className="px-3 py-2 text-right font-semibold">{t("ai.colCostPerUnit")}</th>
                <th className="py-2 pl-3 text-right font-semibold">{t("ai.colCost")}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {used.map((f) => {
                const unit = t(`ai.units.${f.feature}`, { defaultValue: "" });
                const perUnit = (value: number | null) => (unit ? t("ai.perUnit", { value: vnd(value), unit }) : vnd(value));
                return (
                  <tr key={f.feature} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 font-medium text-text">{featureName(f.feature)}</td>
                    <td className="px-3 py-3 text-right text-text">
                      {t(`ai.unitCount.${f.feature}`, { count: f.units, value: int(f.units), defaultValue: int(f.units) })}
                    </td>
                    <td className="px-3 py-3 text-right text-text">{perUnit(f.pricePerUnitVnd)}</td>
                    <td className="px-3 py-3 text-right">
                      <span className="inline-flex items-center justify-end gap-2">
                        <span className={f.loss ? "font-semibold text-text" : "text-text"}>{perUnit(f.costPerUnitVnd)}</span>
                        {f.loss && (
                          <Badge variant="warning">
                            <Icon name="trending-down" className="size-3" />
                            {t("ai.loss")}
                          </Badge>
                        )}
                      </span>
                    </td>
                    <td className="py-3 pl-3 text-right text-text">{vnd(f.costVnd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {unused.length > 0 && (
        <p className="text-xs text-text-muted">
          {t("ai.unusedList", { names: unused.map((f) => featureName(f.feature)).join(", ") })}
        </p>
      )}
    </div>
  );
}
