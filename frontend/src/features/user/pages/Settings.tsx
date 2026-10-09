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
        <span className="ll-overline">{t("settings.overline")}</span>
        <h1 className="mb-1 text-[28px] font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
          {t("settings.title")}
        </h1>
        <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>
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
                className="flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-[14px] font-medium transition-colors"
                style={{
                  background: active ? "var(--primary-soft)" : "transparent",
                  color: active ? "var(--text)" : "var(--text-muted)",
                }}
              >
                <i className={`ph ph-${icon} text-lg`} />
                {t(`settings.tabs.${id}`)}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 max-w-[640px]">
          {tab === "security" ? (
            <SecuritySection />
          ) : (
            <p className="ll-card text-[14px]" style={{ color: "var(--text-muted)" }}>
              {t("settings.comingSoon")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
