import { useState } from "react";
import { useTranslation } from "react-i18next";
import SecuritySection from "../components/SecuritySection";

const TABS = [
  { id: "profile", icon: "user-circle" },
  { id: "learning", icon: "target" },
  { id: "display", icon: "palette" },
  { id: "security", icon: "shield-check" },
  { id: "plan", icon: "crown-simple" },
  { id: "privacy", icon: "lock-key" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Khung trang Cài đặt theo mockup; hiện chỉ tab "Bảo mật & đăng nhập" có nội dung, các tab khác để dành. */
export default function Settings() {
  const { t } = useTranslation("auth");
  const [tab, setTab] = useState<TabId>("security");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-accent mb-1 block">
          {t("settings.overline")}
        </span>
        <h1 className="mb-1 text-[28px] font-bold leading-tight font-display text-text">
          {t("settings.title")}
        </h1>
        <p className="text-[15px] text-text-muted">
          {t("settings.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label={t("settings.tabsLabel")} className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {TABS.map(({ id, icon }) => {
            const active = id === tab;
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setTab(id)}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-primary-soft text-text font-semibold"
                    : "bg-transparent text-text-muted hover:bg-surface-hover hover:text-text"
                }`}
              >
                <i className={`ph ph-${icon} text-lg ${active ? "text-accent" : ""}`} />
                {t(`settings.tabs.${id}`)}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 max-w-[640px]">
          {tab === "security" ? (
            <SecuritySection />
          ) : (
            <div className="p-6 rounded-2xl bg-surface border border-border shadow-[var(--shadow-card)] text-sm text-text-muted">
              {t("settings.comingSoon")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
