import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LearningProfileForm from "../components/LearningProfileForm";
import ProfileSection from "../components/ProfileSection";
import SecuritySection from "../components/SecuritySection";
import Icon from "@/components/common/Icon";
import { useAuth } from "@/features/auth";
import SubscriptionPanel from "@/features/subscription/components/SubscriptionPanel";

const TABS = [
  { id: "profile", icon: "circle-user" },
  { id: "learning", icon: "target" },
  { id: "display", icon: "palette" },
  { id: "security", icon: "shield-check" },
  { id: "plan", icon: "crown" },
  { id: "privacy", icon: "lock-keyhole" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Khung trang Cài đặt theo mockup; hiện có tab "Học tập" và "Bảo mật & đăng nhập", các tab khác để dành. */
export default function Settings() {
  const { t } = useTranslation("auth");
  // Tab nằm trên địa chỉ (`?tab=`) để liên kết từ menu tài khoản và giữa các tab chuyển tab ngay trong trang
  const [params, setParams] = useSearchParams();
  const tab: TabId = TABS.find((entry) => entry.id === params.get("tab"))?.id ?? "security";
  const setTab = (next: TabId) => setParams({ tab: next });

  const { handleLogout } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-text">
            <Icon name="settings" className="size-3.5" />
            {t("settings.overline")}
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{t("settings.title")}</h1>
        <p className="text-text-muted">{t("settings.subtitle")}</p>
      </div>

      <div className="grid items-start gap-6 min-[1024px]:grid-cols-[248px_minmax(0,1fr)]">
        <nav
          aria-label={t("settings.tabsLabel")}
          className="flex gap-0.5 overflow-x-auto rounded-lg border border-border bg-surface p-2 [scrollbar-width:none] min-[1024px]:sticky min-[1024px]:top-24 min-[1024px]:flex-col min-[1024px]:overflow-visible"
        >
          {TABS.map(({ id, icon }) => {
            const active = id === tab;
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setTab(id)}
                className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-3 whitespace-nowrap rounded-sm border-0 px-3 text-left text-sm font-medium transition-colors duration-150 ${
                  active ? "bg-primary-soft text-text" : "bg-transparent text-text-muted hover:bg-surface-hover hover:text-text"
                }`}
              >
                <Icon name={icon} className={`text-xl ${active ? "text-accent" : ""}`} />
                {t(`settings.tabs.${id}`)}
              </button>
            );
          })}
          <div className="mx-1 my-1.5 hidden h-px bg-border min-[1024px]:block" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 shrink-0 cursor-pointer items-center gap-3 whitespace-nowrap rounded-sm border-0 bg-transparent px-3 text-left text-sm font-medium text-danger transition-colors duration-150 hover:bg-surface-hover"
          >
            <Icon name="log-out" className="text-xl" />
            {t("settings.logout")}
          </button>
        </nav>

        <div className="min-w-0">
          {tab === "profile" ? (
            <ProfileSection onSelectTab={setTab} />
          ) : tab === "security" ? (
            <SecuritySection />
          ) : tab === "learning" ? (
            <LearningProfileForm mode="settings" />
          ) : tab === "plan" ? (
            <SubscriptionPanel />
          ) : (
            <div className="rounded-lg border border-border bg-surface p-5 text-sm text-text-muted shadow-[var(--shadow-card)]">{t("settings.comingSoon")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
