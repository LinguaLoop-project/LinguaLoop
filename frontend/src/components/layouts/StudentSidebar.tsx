/**
 * StudentSidebar — thanh điều hướng dọc bên trái của Student Layout.
 * Dựa trên RAIL trong mockups-student/shell.js và student.css.
 *
 * Cấu trúc CSS dùng class từ student.css:
 *   .rail   → container sticky chiều cao 100vh
 *   .brand  → logo + wordmark
 *   .nav    → nav item (highlight khi active qua class .on)
 *   .rail-sep → divider label
 *   .rail-foot → phần cuối sidebar (upsell card)
 */

import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogoMark } from "@/components/common/Logo";
import Icon from "@/components/common/Icon";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";

type NavItem = {
  id: string;
  icon: string;
  /** Khoá trong layout:student.sidebar.items */
  labelKey: string;
  to: string;
  badge?: number;
};

const STUDENT_NAV: NavItem[] = [
  { id: "today", icon: "sun", labelKey: "today", to: "/student" },
];

const LEARN_NAV: NavItem[] = [
  { id: "lessons", icon: "library", labelKey: "lessons", to: "/student/lessons" },
  {
    id: "dictation",
    icon: "headphones",
    labelKey: "dictation",
    to: "/student/dictation",
  },
  {
    id: "shadowing",
    icon: "mic",
    labelKey: "shadowing",
    to: "/student/shadowing",
  },
  { id: "vocab", icon: "layers", labelKey: "vocab", to: "/student/vocab" },
];

const PERSONAL_NAV: NavItem[] = [
  {
    id: "mywords",
    icon: "bookmark",
    labelKey: "mywords",
    to: "/student/mywords",
    badge: 8,
  },
  {
    id: "weakness",
    icon: "target",
    labelKey: "weakness",
    to: "/student/weakness",
  },
  { id: "test", icon: "file-check", labelKey: "test", to: "/student/test" },
];

function NavItem({ item }: { item: NavItem }) {
  const { t } = useTranslation("layout");
  const label = t(`student.sidebar.items.${item.labelKey}`);
    return (
    <NavLink
      to={item.to}
      end={item.id === "today"}
      className={({ isActive }) =>
        `relative flex items-center gap-3 w-full min-h-[44px] px-3 py-2.5 rounded-md font-medium text-base transition-colors duration-150 ${
          isActive
            ? "bg-primary-soft text-text before:content-[''] before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-0.5 before:rounded-sm before:bg-primary"
            : "text-text-muted hover:bg-surface-hover hover:text-text [&:hover_svg]:translate-x-0.5"
        }`
      }
      aria-label={label}
    >
      {({ isActive }) => (
        <>
          <Icon
 name={item.icon}
 className={`text-2xl shrink-0 transition-transform duration-200 ${isActive ? "text-accent" : ""}`}
 strokeWidth={isActive ? 2.5 : 2}
 />
          <span>{label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className="ml-auto min-w-[22px] h-[22px] px-1.5 rounded-full grid place-items-center text-xs font-semibold bg-danger/15 text-danger">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function StudentSidebar() {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();
  const isPro = false; // TODO: thêm field plan vào User type khi backend ready

  return (
    <aside
      className="sticky top-0 h-screen overflow-y-auto hidden md:flex flex-col gap-1 p-5 px-4 bg-bg-elevated border-r border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label={t("student.sidebar.aria")}
    >
      {/* Brand / Logo */}
      <button
        className="flex items-center gap-2.5 px-1 pt-1 pb-6 text-left border-0 bg-transparent cursor-pointer group select-none"
        onClick={() => navigate("/")}
        aria-label={t("student.sidebar.homeLabel")}
      >
        <div className="shrink-0 transition-transform duration-300 group-hover:scale-105">
          <LogoMark size={44} />
        </div>
        <span className="font-display font-extrabold text-[22px] tracking-tight text-text leading-none">
          Lingua<b className="text-accent font-extrabold">Loop</b>
        </span>
      </button>

      {/* Hôm nay */}
      {STUDENT_NAV.map((item) => (
        <NavItem key={item.id} item={item} />
      ))}

      {/* Nhóm: Học */}
      <div className="text-xs font-bold tracking-[0.12em] uppercase text-text-subtle px-3 pt-5 pb-1.5 font-body">
        {t("student.sidebar.groups.learn")}
      </div>
      {LEARN_NAV.map((item) => (
        <NavItem key={item.id} item={item} />
      ))}

      {/* Nhóm: Của tôi */}
      <div className="text-xs font-bold tracking-[0.12em] uppercase text-text-subtle px-3 pt-5 pb-1.5 font-body">
        {t("student.sidebar.groups.mine")}
      </div>
      {PERSONAL_NAV.map((item) => (
        <NavItem key={item.id} item={item} />
      ))}

      {/* Phần cuối: upsell nếu Free */}
      {!isPro && (
        <div className="mt-auto pt-4">
          <div className="rounded-lg border-2 border-primary bg-surface p-4 shadow-[var(--shadow-card)]">
            <Badge variant="pro">
              <Icon name="crown" fill className="text-[13px]" />
              PRO
            </Badge>
            <b className="block mt-2.5 text-lg font-bold leading-snug text-text">
              {t("student.sidebar.pro.price")}
            </b>
            <p className="text-sm leading-relaxed text-text-muted my-1 mb-3">
              {t("student.sidebar.pro.desc")}
            </p>
            <Button size="sm" fullWidth onClick={() => navigate("/pricing")}>
              {t("student.sidebar.pro.cta")}
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
