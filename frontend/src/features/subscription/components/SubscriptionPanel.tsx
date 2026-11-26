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

const BENEFITS = [
  { id: "proLessons", icon: "book-open-text" },
  { id: "proDecks", icon: "layers" },
  { id: "mouthVideos", icon: "video" },
  { id: "credits", icon: "zap" },
  { id: "personalLessons", icon: "youtube" },
] as const;

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
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
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
    <div className="flex flex-col gap-8">
      {/* Thẻ tóm tắt gói hiện tại & ví credit */}
      <section
        aria-labelledby="current-plan-title"
        className={`relative overflow-hidden rounded-2xl border p-6 shadow-[var(--shadow-card)] ${
          isPro
            ? "border-warning/35 bg-[linear-gradient(135deg,var(--surface),color-mix(in_srgb,var(--warning)_8%,var(--surface)))]"
            : "border-border bg-[linear-gradient(135deg,var(--surface),color-mix(in_srgb,var(--primary)_7%,var(--surface)))]"
        }`}
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <span id="current-plan-title" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {t("current.label")}
            </span>

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-text">
                {t(isPro ? "current.proName" : "current.freeName")}
              </h2>
              {isPro ? (
                <Badge variant="pro">
                  <Icon name="crown" />
                  PRO
                </Badge>
              ) : (
                <Badge>Free</Badge>
              )}
              {isPro && (
                <Badge variant="success">
                  <Icon name="circle-check" />
                  {t("current.active")}
                </Badge>
              )}
            </div>

            {isPro && plan.data.startsAt && plan.data.endsAt ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="calendar" className="text-primary-text" />
                  {t("current.since", { date: formatDay(plan.data.startsAt, lang) })}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-text">
                  <Icon name="clock" className="text-warning" />
                  {t("current.until", { date: formatDay(plan.data.endsAt, lang) })}
                </span>
              </div>
            ) : (
              <p className="max-w-lg text-sm leading-relaxed text-text-muted">{t("current.freeDesc")}</p>
            )}

            {!choosing && (
              <div className="pt-1.5">
                <Button
                  type="button"
                  variant={isPro ? "secondary" : "primary"}
                  leftIcon={<Icon name={isPro ? "calendar" : "crown"} />}
                  onClick={() => setChoosing(true)}
                >
                  {t(isPro ? "current.renew" : "current.upgrade")}
                </Button>
              </div>
            )}
          </div>

          {credit.data && credit.data.kind !== "staff" && (
            <div className="flex shrink-0 flex-col gap-1.5 rounded-xl border border-border bg-bg-elevated/80 px-5 py-4 lg:min-w-[270px] lg:max-w-[300px]">
              <span className="text-xs font-medium text-text-muted">
                {t(credit.data.kind === "pro" ? "current.monthlyCredits" : "current.trialCredits")}
              </span>
              <span className="flex items-center gap-2 font-display text-3xl font-bold tabular-nums text-text">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
                  <Icon name="zap" fill className="text-lg" />
                </span>
                {credit.data.balance}
              </span>
              {credit.data.kind === "pro" && credit.data.resetsAt ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                  <Icon name="rotate-cw" className="text-[13px]" />
                  {t("current.renewsOn", { date: formatDay(credit.data.resetsAt, lang) })}
                </span>
              ) : (
                <span className="text-xs leading-relaxed text-text-muted">{t("current.trialHint")}</span>
              )}
            </div>
          )}
        </div>
      </section>

      {choosing && (
        <PlanPicker kind={isPro ? "renew" : "upgrade"} currentEnd={plan.data.endsAt} onClose={() => setChoosing(false)} />
      )}

      {/* Bảng so sánh quyền lợi */}
      <section aria-labelledby="benefits-title" className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Icon name="sparkles" className="text-lg text-primary-text" />
          <h2 id="benefits-title" className="font-display text-xl font-bold">
            {t("benefits.title")}
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-elevated/60 text-left text-text-muted">
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">{t("benefits.feature")}</th>
                <th className="w-40 px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider">{t("benefits.free")}</th>
                <th className="w-48 bg-primary-soft/35 px-5 py-3.5 text-center">
                  <Badge variant="pro">
                    <Icon name="crown" />
                    {t("benefits.pro")}
                  </Badge>
                </th>
              </tr>
            </thead>
            <tbody>
              {BENEFITS.map(({ id, icon }) => (
                <tr key={id} className="border-b border-border/80 transition-colors last:border-0 hover:bg-surface-hover/40">
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-3 font-medium text-text">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-elevated text-primary-text">
                        <Icon name={icon} className="text-base" />
                      </span>
                      {t(`benefits.items.${id}`)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center text-text-muted">
                    {id === "credits" ? (
                      <Badge>{t("benefits.freeCredits")}</Badge>
                    ) : (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-bg-elevated text-text-muted/60">
                        <Icon name="minus" className="text-xs" />
                      </span>
                    )}
                  </td>
                  <td className="bg-primary-soft/20 px-5 py-3.5 text-center">
                    {id === "credits" ? (
                      <Badge variant="success">{t("benefits.proCredits")}</Badge>
                    ) : (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
                        <Icon name="check" className="text-sm" strokeWidth={2.5} />
                      </span>
                    )}
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
