import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import SubscriptionPanel from "../components/SubscriptionPanel";

/** Trang Gói đăng ký của học viên (UC-PR-01); `?choose` mở phần chọn gói (UC-PR-02, UC-PR-04). */
export default function SubscriptionPage() {
  const { t } = useTranslation("subscription");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-text">
            <Icon name="circle-user" className="size-3.5" />
            {t("page.overline")}
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{t("page.title")}</h1>
        <p className="mt-1 text-text-muted">{t("page.subtitle")}</p>
      </div>
      <SubscriptionPanel />
    </div>
  );
}
