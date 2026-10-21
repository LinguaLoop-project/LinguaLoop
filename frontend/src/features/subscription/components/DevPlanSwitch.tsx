import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { useMyPlan, PLAN_QUERY_KEY } from "../hooks/useMyPlan";
import { USAGE_QUERY_KEY } from "../hooks/useUsage";
import { subscriptionService } from "../services/subscriptionService";
import type { PlanCode } from "../types";

const BTN =
  "inline-flex h-7 cursor-pointer items-center rounded-full px-2.5 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60";

/** Nút thử Free/Pro và đặt lại lượt hôm nay. Chỉ hiện khi DEV_TOOLS_ENABLED; bỏ khi làm đăng ký Pro thật. */
export default function DevPlanSwitch() {
  const { t } = useTranslation("layout");
  const queryClient = useQueryClient();
  const { data } = useMyPlan();
  const plan: PlanCode = data?.plan ?? "free";

  const setPlan = useMutation({
    mutationFn: (next: PlanCode) => subscriptionService.devSetPlan(next),
    // Giới hạn đổi theo gói nên đọc lại cả hạn mức
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: PLAN_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: USAGE_QUERY_KEY }),
      ]),
  });

  const reset = useMutation({
    mutationFn: () => subscriptionService.devResetUsage(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USAGE_QUERY_KEY }),
  });

  return (
    <div
      className="hidden items-center gap-1 rounded-full border border-dashed border-warning px-1 py-0.5 md:inline-flex"
      title={t("dev.title")}
    >
      <Icon name="wrench" className="ml-1 text-warning" />
      {(["free", "pro"] as const).map((p) => (
        <button
          key={p}
          type="button"
          disabled={setPlan.isPending || plan === p}
          aria-pressed={plan === p}
          onClick={() => setPlan.mutate(p)}
          className={`${BTN} ${plan === p ? "bg-warning text-on-fn" : "text-text-muted hover:text-text"}`}
        >
          {p === "pro" ? "PRO" : "Free"}
        </button>
      ))}
      <button
        type="button"
        disabled={reset.isPending}
        onClick={() => reset.mutate()}
        className={`${BTN} text-text-muted hover:text-text`}
        title={t("dev.resetUsage")}
        aria-label={t("dev.resetUsage")}
      >
        <Icon name="rotate-cw" />
      </button>
    </div>
  );
}
