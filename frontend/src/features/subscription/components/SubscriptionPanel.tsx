import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { toApiError, NETWORK_ERROR } from "@/features/auth/errors";
import { useCreditBalance } from "../hooks/useCredit";
import { useMyPlan } from "../hooks/useMyPlan";
import OrderHistory from "./OrderHistory";
import PlanPicker from "./PlanPicker";
import { formatDay } from "./format";

const BENEFITS = ["proLessons", "proDecks", "mouthVideos", "credits", "personalLessons"] as const;

/**
 * Xem gói hiện tại (UC-PR-01): gói, thời hạn, credit, so sánh quyền lợi và lịch sử giao dịch. Tham số `?choose` mở phần
 * chọn gói; loại đơn (nâng cấp hay gia hạn) theo gói hiện tại do server tính, không theo tham số (BR-PR-01).
 */
export default function SubscriptionPanel() {
  const { t, i18n } = useTranslation("subscription");
  const [params, setParams] = useSearchParams();
  const plan = useMyPlan();
  const credit = useCreditBalance();
  const lang = i18n.language;

  if (plan.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (plan.isError || !plan.data) {
    const network = toApiError(plan.error).code === NETWORK_ERROR;
    return <ErrorState kind={network ? "network" : "server"} onRetry={() => void plan.refetch()} retrying={plan.isFetching} />;
  }

  const isPro = plan.data.plan === "pro";
  const choosing = params.has("choose");
  const setChoosing = (open: boolean) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (open) next.set("choose", "1");
        else next.delete("choose");
        return next;
      },
      { replace: true },
    );

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="current-plan-title"
        className="flex flex-wrap items-start justify-between gap-5 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
      >
        <div className="flex flex-col gap-2">
          <span id="current-plan-title" className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            {t("current.label")}
          </span>
          <div className="flex items-center gap-3">
            {isPro ? (
              <Badge variant="pro">
                <Icon name="crown" />
                PRO
              </Badge>
            ) : (
              <Badge>Free</Badge>
            )}
            {isPro && <span className="text-sm font-medium text-success">{t("current.active")}</span>}
          </div>
          {isPro && plan.data.startsAt && plan.data.endsAt && (
            <p className="text-sm text-text-muted">
              {t("current.since", { date: formatDay(plan.data.startsAt, lang) })} ·{" "}
              <b className="text-text">{t("current.until", { date: formatDay(plan.data.endsAt, lang) })}</b>
            </p>
          )}
        </div>

        {credit.data && credit.data.kind !== "staff" && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">
              {t(credit.data.kind === "pro" ? "current.monthlyCredits" : "current.trialCredits")}
            </span>
            <span className="flex items-center gap-1.5 font-display text-3xl font-bold tabular-nums">
              <Icon name="zap" className="text-warning" />
              {credit.data.balance}
            </span>
            {credit.data.kind === "pro" && credit.data.resetsAt ? (
              <span className="text-xs text-text-muted">{t("current.renewsOn", { date: formatDay(credit.data.resetsAt, lang) })}</span>
            ) : (
              <span className="max-w-[260px] text-xs text-text-muted">{t("current.trialHint")}</span>
            )}
          </div>
        )}

        {!choosing && (
          <Button
            type="button"
            variant={isPro ? "secondary" : "primary"}
            leftIcon={<Icon name={isPro ? "calendar" : "crown"} />}
            onClick={() => setChoosing(true)}
          >
            {t(isPro ? "current.renew" : "current.upgrade")}
          </Button>
        )}
      </section>

      {choosing && (
        <PlanPicker kind={isPro ? "renew" : "upgrade"} currentEnd={plan.data.endsAt} onClose={() => setChoosing(false)} />
      )}

      <section aria-labelledby="benefits-title" className="flex flex-col gap-3">
        <h2 id="benefits-title" className="font-display text-xl font-bold">
          {t("benefits.title")}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-semibold">{t("benefits.feature")}</th>
                <th className="px-4 py-3 text-center font-semibold">{t("benefits.free")}</th>
                <th className="px-4 py-3 text-center font-semibold text-warning">{t("benefits.pro")}</th>
              </tr>
            </thead>
            <tbody>
              {BENEFITS.map((id) => (
                <tr key={id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{t(`benefits.items.${id}`)}</td>
                  <td className="px-4 py-3 text-center text-text-muted">
                    {id === "credits" ? t("benefits.freeCredits") : <Icon name="minus" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {id === "credits" ? t("benefits.proCredits") : <Icon name="check" className="text-success" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <OrderHistory />
    </div>
  );
}
