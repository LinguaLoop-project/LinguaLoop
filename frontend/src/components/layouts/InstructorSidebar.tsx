/**
 * InstructorSidebar — thanh điều hướng dọc bên trái của Instructor Layout.
 * Dựa trên RAIL trong mockups-instructor/shell.js và mockups-instructor/instructor.css.
 * Hoàn toàn dùng TailwindCSS v4.
 */

import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogoMark } from "@/components/common/Logo";

type InstructorNavItem = {
  id: string;
  icon: string;
  /** Khoá trong layout:instructor.sidebar.items */
  labelKey: string;
  to: string;
  badge?: string;
  badgeType?: "warn" | "bad";
};

type InstructorNavGroup = {
  /** Khoá trong layout:instructor.sidebar.groups */
  groupKey?: string;
  items: InstructorNavItem[];
};

const INSTRUCTOR_NAV_GROUPS: InstructorNavGroup[] = [
  {
    items: [
      { id: "dashboard", icon: "squares-four", labelKey: "dashboard", to: "/instructor" },
    ],
  },
  {
    groupKey: "content",
    items: [
      { id: "topics", icon: "folders", labelKey: "topics", to: "/instructor/topics" },
      { id: "lessons", icon: "film-strip", labelKey: "lessons", to: "/instructor/lessons" },
      { id: "decks", icon: "stack", labelKey: "decks", to: "/instructor/decks" },
    ],
  },
  {
    groupKey: "language",
    items: [
      { id: "cefr", icon: "robot", labelKey: "cefr", to: "/instructor/cefr", badge: "12", badgeType: "warn" },
      { id: "dict", icon: "book-open-text", labelKey: "dict", to: "/instructor/dict" },
      { id: "phoneme", icon: "waveform", labelKey: "phoneme", to: "/instructor/phoneme" },
      { id: "qbank", icon: "exam", labelKey: "qbank", to: "/instructor/qbank" },
    ],
  },
  {
    groupKey: "tracking",
    items: [
      { id: "reports", icon: "flag", labelKey: "reports", to: "/instructor/reports", badge: "3", badgeType: "bad" },
      { id: "audit", icon: "clock-counter-clockwise", labelKey: "audit", to: "/instructor/audit" },
    ],
  },
];

export default function InstructorSidebar() {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();

  return (
    <aside
      className="sticky top-0 h-screen overflow-y-auto hidden md:flex flex-col gap-1 p-5 px-4 bg-bg-elevated border-r border-border [scrollbar-width:thin] scrollbar-color-[var(--border)_transparent]"
      aria-label={t("instructor.sidebar.aria")}
    >
      {/* Brand / Logo */}
      <button
        type="button"
        className="flex items-center gap-2.5 px-1 pt-1 pb-6 text-left border-0 bg-transparent cursor-pointer group select-none"
        onClick={() => navigate("/instructor")}
        aria-label={t("instructor.sidebar.homeLabel")}
      >
        <div className="shrink-0 transition-transform duration-300 group-hover:scale-105">
          <LogoMark size={44} />
        </div>
        <span className="font-display font-extrabold text-[22px] tracking-tight text-text leading-none">
          Lingua<b className="text-accent font-extrabold">Loop</b>
        </span>
      </button>

      {/* Switch role button — "Xem như học viên" */}
      <button
        type="button"
        onClick={() => navigate("/student")}
        className="flex items-center gap-2.5 w-full min-h-[44px] px-3.5 py-2.5 mb-2 rounded-xl border border-border-strong bg-primary-soft text-accent text-[14px] font-semibold transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--primary)_22%,transparent)] cursor-pointer select-none"
      >
        <i className="ph ph-student text-xl shrink-0" aria-hidden="true" />
        <span>{t("instructor.sidebar.viewAsStudent")}</span>
      </button>

      {/* Navigation Groups */}
      {INSTRUCTOR_NAV_GROUPS.map((group, gIdx) => (
        <div key={gIdx} className="flex flex-col gap-0.5">
          {group.groupKey && (
            <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-text-subtle px-3 pt-5 pb-1.5 font-body">
              {t(`instructor.sidebar.groups.${group.groupKey}`)}
            </div>
          )}

          {group.items.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.to === "/instructor"}
              className={({ isActive }) =>
                `relative flex items-center gap-3 w-full min-h-[44px] px-3 py-2.5 rounded-md font-medium text-[15px] transition-colors duration-150 select-none ${
                  isActive
                    ? "bg-primary-soft text-text before:content-[''] before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-0.5 before:rounded-sm before:bg-primary before:shadow-[var(--glow-primary)]"
                    : "text-text-muted hover:bg-surface-hover hover:text-text [&:hover_i]:translate-x-0.5"
                }`
              }
              aria-label={t(`instructor.sidebar.items.${item.labelKey}`)}
            >
              {({ isActive }) => (
                <>
                  <i
                    className={`text-2xl shrink-0 transition-transform duration-200 ${
                      isActive ? "text-accent ph-fill" : "ph"
                    } ph-${item.icon}`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{t(`instructor.sidebar.items.${item.labelKey}`)}</span>

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
