import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AccountSection from "../components/AccountSection";
import DisplaySection from "../components/DisplaySection";
import LearningProfileForm from "../components/LearningProfileForm";
import PracticeSection from "../components/PracticeSection";
import SecuritySection from "../components/SecuritySection";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { useAuth } from "@/features/auth";
import SubscriptionPanel from "@/features/subscription/components/SubscriptionPanel";
import { useMyPlan } from "@/features/subscription/hooks/useMyPlan";

const ALL_TABS = [
  { id: "account", icon: "circle-user", studentOnly: false },
  { id: "learning", icon: "target", studentOnly: true },
  { id: "practice", icon: "headphones", studentOnly: true },
  { id: "display", icon: "palette", studentOnly: false },
  { id: "security", icon: "shield-check", studentOnly: false },
  { id: "plan", icon: "crown", studentOnly: true },
] as const;

type TabId = (typeof ALL_TABS)[number]["id"];

/** Trang Cài đặt: hiển thị đủ 6 tab cho học viên, và các tab tài khoản/giao diện/bảo mật cho giáo viên & quản trị viên. */
export default function Settings() {
  const { t } = useTranslation("auth");
  const { user, handleLogout } = useAuth();
  const isStudent = !user || user.role === "student";
  const tabs = isStudent ? ALL_TABS : ALL_TABS.filter((entry) => !entry.studentOnly);

  const plan = useMyPlan(isStudent);
  const isPro = plan.data?.plan === "pro";
  const emailUnverified = user ? !user.emailVerified : false;

  // Tab nằm trên địa chỉ (`?tab=`) để liên kết từ menu tài khoản và giữa các tab chuyển tab ngay trong trang
  const [params, setParams] = useSearchParams();
  // `?tab=profile` là địa chỉ cũ của tab Tài khoản; vẫn nhận để liên kết đã lưu dùng được
  const requested = params.get("tab") === "profile" ? "account" : params.get("tab");
  const tab: TabId = tabs.find((entry) => entry.id === requested)?.id ?? "account";
  const setTab = (next: TabId) => setParams({ tab: next });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-text">
            <Icon name="settings" className="size-3.5" />
            {t("settings.overline")}
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold leading-[1.15] tracking-[-0.02em] sm:text-4xl">
          {t("settings.title")}
        </h1>
        <p className="mt-1 text-text-muted">{t("settings.subtitle")}</p>
      </div>

      <div className="grid items-start gap-6 min-[1024px]:grid-cols-[248px_minmax(0,1fr)]">
        <nav
          aria-label={t("settings.tabsLabel")}
          className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1.5 shadow-[var(--shadow-card)] [scrollbar-width:none] min-[1024px]:sticky min-[1024px]:top-24 min-[1024px]:flex-col min-[1024px]:gap-0.5 min-[1024px]:overflow-visible min-[1024px]:p-2"
        >
          {tabs.map(({ id, icon }) => {
            const active = id === tab;
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setTab(id)}
                className={`relative flex min-h-11 shrink-0 cursor-pointer items-center gap-3 whitespace-nowrap rounded-sm border-0 px-3 text-left text-sm transition-colors duration-150 ${
                  active
                    ? "bg-primary-soft font-semibold text-text"
                    : "bg-transparent font-medium text-text-muted hover:bg-surface-hover hover:text-text"
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="hidden h-5 w-[3px] rounded-full bg-primary min-[1024px]:absolute min-[1024px]:left-0 min-[1024px]:block"
                  />
                )}
                <Icon name={icon} className={`text-xl ${active ? "text-primary-text" : ""}`} />
                <span className="flex-1 truncate">{t(`settings.tabs.${id}`)}</span>
                {id === "account" && emailUnverified && (
                  <span
                    aria-label={t("profile.emailUnverified")}
                    title={t("profile.emailUnverified")}
                    className="size-2 shrink-0 rounded-full bg-warning"
                  />
                )}
                {id === "plan" && isPro && (
                  <Badge variant="pro" className="h-5 px-1.5 text-[10px]">
                    PRO
                  </Badge>
                )}
              </button>
            );
          })}

          <div className="mx-1 my-1.5 hidden h-px bg-border min-[1024px]:block" />
          <button
            type="button"
            onClick={handleLogout}
            className="hidden min-h-11 shrink-0 cursor-pointer items-center gap-3 whitespace-nowrap rounded-sm border-0 bg-transparent px-3 text-left text-sm font-medium text-danger transition-colors duration-150 hover:bg-danger/10 min-[1024px]:flex"
          >
            <Icon name="log-out" className="text-xl" />
            {t("settings.logout")}
          </button>
        </nav>

        <div
          key={tab}
          className={`min-w-0 animate-[settings-fade_180ms_var(--ease-out)] ${tab === "plan" ? "" : "max-w-3xl"}`}
        >
          {tab === "account" ? (
            <AccountSection />
          ) : tab === "display" ? (
            <DisplaySection />
          ) : tab === "security" ? (
            <SecuritySection />
          ) : tab === "practice" ? (
            <PracticeSection />
          ) : tab === "learning" ? (
            <LearningProfileForm mode="settings" />
          ) : (
            <SubscriptionPanel />
          )}

          {/* Trên màn hình nhỏ, tách nút Đăng xuất xuống cuối trang để tránh bấm nhầm khi cuộn thanh tab */}
          <div className="mt-6 flex justify-end border-t border-border pt-4 min-[1024px]:hidden">
            <Button
              type="button"
              variant="ghost"
              className="text-danger hover:bg-danger/10"
              leftIcon={<Icon name="log-out" />}
              onClick={handleLogout}
            >
              {t("settings.logout")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
