import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import { isRetryable, type AdminApiError } from "@/features/user";
import { toast } from "@/stores/toastStore";
import { useSetPlanOnSale } from "../../hooks/useAdminPlans";
import type { ProPlan } from "../../services/adminPlanService";

const TITLE_ID = "plan-on-sale-title";

export interface PlanOnSaleDialogProps {
  plan: ProPlan;
  /** Gói đang bán cuối cùng: ngừng bán thì học viên không mua được gói nào (UC-GA-06 2a). */
  lastOnSale: boolean;
  onClose: () => void;
}

/** Xác nhận bật bán hoặc ngừng bán một gói Pro (UC-GA-06); các lượt đã mua không bị ảnh hưởng (BR-GA-08). */
export default function PlanOnSaleDialog({ plan, lastOnSale, onClose }: Readonly<PlanOnSaleDialogProps>) {
  const { t } = useTranslation("creditAdmin");
  const setOnSale = useSetPlanOnSale();
  const [failure, setFailure] = useState<string | null>(null);
  const target = !plan.onSale;
  const action = target ? "start" : "stop";

  const confirm = () => {
    setFailure(null);
    setOnSale.mutate(
      { id: plan.id, onSale: target },
      {
        onSuccess: () => {
          toast(t(`onSale.${action}Done`, { name: plan.name }), { icon: "circle-check" });
          onClose();
        },
        onError: (raw) => {
          const err = raw as unknown as AdminApiError;
          if (err.code === "PRO_PLAN_STATUS_UNCHANGED") {
            // Người khác vừa đổi (4a): báo trạng thái hiện tại, danh sách tự đọc lại
            const current = err.details.onSale === true ? t("status.onSale") : t("status.offSale");
            toast(t("errors.PRO_PLAN_STATUS_UNCHANGED", { status: current }), { icon: "circle-alert" });
            onClose();
            return;
          }
          setFailure(isRetryable(err) ? t("onSale.failed") : t(`errors.${err.code ?? "unknown"}`));
        },
      },
    );
  };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t(`onSale.${action}Title`, { name: plan.name })}
        </h2>
        {failure && <FormAlert variant="danger">{failure}</FormAlert>}
        <p className="text-sm text-text">{t(`onSale.${action}Body`)}</p>
        {!target && lastOnSale && <FormAlert variant="warning">{t("onSale.lastWarning")}</FormAlert>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={setOnSale.isPending}>
            {t("onSale.cancel")}
          </Button>
          <Button
            type="button"
            variant={target ? "primary" : "danger"}
            isLoading={setOnSale.isPending}
            onClick={confirm}
          >
            {t("onSale.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
