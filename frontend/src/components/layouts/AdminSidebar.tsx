/**
 * AdminSidebar — thanh điều hướng dọc bên trái của Admin Layout.
 * Dựa trên RAIL trong mockups-admin/shell.js và mockups-admin/admin.css.
 * Sử dụng tông màu tím Cosmic Violet chuẩn theo mockup.
 * Hoàn toàn dùng TailwindCSS v4.
 */

import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogoMark } from "@/components/common/Logo";

type AdminNavItem = {
  id: string;
  icon: string;
  /** Khoá trong layout:admin.sidebar.items */
  labelKey: string;
  to: string;
  badge?: string;
  badgeType?: "warn" | "bad";
};

type AdminNavGroup = {
  /** Khoá trong layout:admin.sidebar.groups */
  groupKey?: string;
  items: AdminNavItem[];
};

const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    items: [
      { id: "dashboard", icon: "squares-four", labelKey: "dashboard", to: "/admin" },
    ],
  },
  {
    groupKey: "system",
    items: [
      { id: "users", icon: "users", labelKey: "users", to: "/admin/users" },
    ],
  },
  {
    groupKey: "moderation",
    items: [
      { id: "reports", icon: "flag", labelKey: "reports", to: "/admin/reports", badge: "5", badgeType: "bad" },
      { id: "decks", icon: "stack", labelKey: "decks", to: "/admin/decks", badge: "8", badgeType: "warn" },
      { id: "audit", icon: "clock-counter-clockwise", labelKey: "audit", to: "/admin/audit" },
    ],
  },
  {
    groupKey: "config",
    items: [
      { id: "limits", icon: "sliders-horizontal", labelKey: "limits", to: "/admin/limits" },
      { id: "subs", icon: "credit-card", labelKey: "subs", to: "/admin/subs" },
      { id: "errors", icon: "warning-circle", labelKey: "errors", to: "/admin/errors" },
    ],
  },
];

export default function AdminSidebar() {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();

  return (
    <aside
      className="sticky top-0 h-screen overflow-y-auto hidden md:flex flex-col gap-1 p-5 px-4 bg-bg-elevated border-r border-border [scrollbar-width:thin] scrollbar-color-[var(--border)_transparent]"
      aria-label={t("admin.sidebar.aria")}
    >
      {/* Brand / Logo */}
      <button
        type="button"
        className="flex items-center gap-2.5 px-1 pt-1 pb-6 text-left border-0 bg-transparent cursor-pointer group select-none"
        onClick={() => navigate("/admin")}
        aria-label={t("admin.sidebar.homeLabel")}
      >
        <div className="shrink-0 transition-transform duration-300 group-hover:scale-105">
          <LogoMark size={44} />
        </div>
        <span className="font-display font-extrabold text-[22px] tracking-tight text-text leading-none">
          Lingua<b className="text-accent font-extrabold">Loop</b>
        </span>
      </button>

      {/* Navigation Groups */}
      {ADMIN_NAV_GROUPS.map((group, gIdx) => (
        <div key={gIdx} className="flex flex-col gap-0.5">
          {group.groupKey && (
            <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-text-subtle px-3 pt-5 pb-1.5 font-body">
              {t(`admin.sidebar.groups.${group.groupKey}`)}
            </div>
          )}

          {group.items.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                `relative flex items-center gap-3 w-full min-h-[44px] px-3 py-2.5 rounded-md font-medium text-[15px] transition-colors duration-150 select-none ${
                  isActive
                    ? "bg-primary-soft text-text before:content-[''] before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-0.5 before:rounded-sm before:bg-primary before:shadow-[var(--glow-primary)]"
                    : "text-text-muted hover:bg-surface-hover hover:text-text [&:hover_i]:translate-x-0.5"
                }`
              }
              aria-label={t(`admin.sidebar.items.${item.labelKey}`)}
            >
              {({ isActive }) => (
                <>
                  <i
                    className={`text-2xl shrink-0 transition-transform duration-200 ${
                      isActive ? "text-accent ph-fill" : "ph"
                    } ph-${item.icon}`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{t(`admin.sidebar.items.${item.labelKey}`)}</span>

                  {item.badge && (
                    <span
                      className={`ml-auto min-w-[22px] h-[22px] px-1.5 rounded-full grid place-items-center text-xs font-semibold ${
                        item.badgeType === "warn"
                          ? "bg-[color-mix(in_srgb,var(--warning)_18%,transparent)] text-warning"
                          : "bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] text-danger"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}
