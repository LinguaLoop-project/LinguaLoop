import { useTranslation } from "react-i18next";
import SubscriptionPanel from "../components/SubscriptionPanel";

/** Trang Gói đăng ký của học viên (UC-PR-01); `?choose` mở phần chọn gói (UC-PR-02, UC-PR-04). */
export default function SubscriptionPage() {
  const { t } = useTranslation("subscription");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="block text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text">
          {t("page.overline")}
        </span>
        <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{t("page.title")}</h1>
        <p className="text-text-muted">{t("page.subtitle")}</p>
      </div>
      <SubscriptionPanel />
    </div>
  );
}
