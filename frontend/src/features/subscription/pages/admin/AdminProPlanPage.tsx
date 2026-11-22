import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { formatNumber, formatVnd } from "@/features/user";
import PlanFormDialog from "../../components/admin/PlanFormDialog";
import PlanOnSaleDialog from "../../components/admin/PlanOnSaleDialog";
import { useAdminPlans } from "../../hooks/useAdminPlans";
import type { ProPlan } from "../../services/adminPlanService";

type DialogState = { kind: "form"; plan: ProPlan | null } | { kind: "onSale"; plan: ProPlan } | null;

/**
 * Danh sách gói Pro (UC-GA-03) theo thời hạn tăng dần, kèm Thêm gói (UC-GA-04), Sửa (UC-GA-05) và Bật bán hoặc Ngừng
 * bán (UC-GA-06).
 */
export default function AdminProPlanPage() {
  const { t, i18n } = useTranslation("creditAdmin");
  const query = useAdminPlans();
  const [dialog, setDialog] = useState<DialogState>(null);

  const reloadPlan = async (id: string) => (await query.refetch()).data?.find((p) => p.id === id);

  let body;
  if (query.isLoading) {
    body = <Skeleton className="h-64 w-full" />;
  } else if (query.isError || !query.data) {
    body = (
      <div className="flex flex-col items-start gap-3">
        <FormAlert variant="danger">{t("plans.loadFailed")}</FormAlert>
        <Button type="button" leftIcon={<Icon name="rotate-cw" />} onClick={() => void query.refetch()}>
          {t("reload")}
        </Button>
      </div>
    );
  } else if (query.data.length === 0) {
    body = (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-text-muted">{t("plans.empty")}</p>
        <Button type="button" leftIcon={<Icon name="plus" />} onClick={() => setDialog({ kind: "form", plan: null })}>
          {t("plans.add")}
        </Button>
      </div>
    );
  } else {
    const onSaleCount = query.data.filter((p) => p.onSale).length;
    body = (
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="px-4 py-3 font-semibold">{t("plans.columns.name")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("plans.columns.months")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("plans.columns.price")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("plans.columns.credits")}</th>
              <th className="px-4 py-3 font-semibold">{t("plans.columns.status")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("plans.columns.purchases")}</th>
              <th className="px-4 py-3" aria-label={t("plans.columns.actions")} />
            </tr>
          </thead>
          <tbody>
            {query.data.map((plan) => (
              <tr key={plan.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-semibold text-text">{plan.name}</td>
                <td className="px-4 py-3 text-right text-text">{t("plans.monthsValue", { count: plan.months })}</td>
                <td className="px-4 py-3 text-right text-text">{formatVnd(plan.priceVnd, i18n.language)}</td>
                <td className="px-4 py-3 text-right text-text">{formatNumber(plan.creditsPerMonth, i18n.language)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      plan.onSale ? "bg-success/15 text-success" : "bg-surface-hover text-text-muted"
                    }`}
                  >
                    {plan.onSale ? t("status.onSale") : t("status.offSale")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-text">{formatNumber(plan.purchases, i18n.language)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" variant="ghost" leftIcon={<Icon name="pencil" />}
                      onClick={() => setDialog({ kind: "form", plan })}>
                      {t("plans.edit")}
                    </Button>
                    <Button type="button" size="sm" variant={plan.onSale ? "secondary" : "primary"}
                      onClick={() => setDialog({ kind: "onSale", plan })}>
                      {plan.onSale ? t("plans.stop") : t("plans.start")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {onSaleCount === 0 && <p className="px-4 py-3 text-sm text-warning">{t("plans.noneOnSale")}</p>}
      </div>
    );
  }

  const lastOnSale = (query.data ?? []).filter((p) => p.onSale).length === 1;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">{t("plans.title")}</h1>
          <p className="mt-1 text-sm text-text-muted">{t("plans.subtitle")}</p>
        </div>
        {query.data && query.data.length > 0 && (
          <Button type="button" leftIcon={<Icon name="plus" />} onClick={() => setDialog({ kind: "form", plan: null })}>
            {t("plans.add")}
          </Button>
        )}
      </header>
      {body}
      {dialog?.kind === "form" && (
        <PlanFormDialog plan={dialog.plan} onClose={() => setDialog(null)} reloadPlan={reloadPlan} />
      )}
      {dialog?.kind === "onSale" && (
        <PlanOnSaleDialog plan={dialog.plan} lastOnSale={lastOnSale && dialog.plan.onSale} onClose={() => setDialog(null)} />
      )}
    </main>
  );
}
