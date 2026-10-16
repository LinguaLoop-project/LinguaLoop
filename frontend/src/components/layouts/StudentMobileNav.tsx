import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";

export default function StudentMobileNav() {
  const { t } = useTranslation("layout");

  const navItems = [
    {
      to: "/student",
      end: true,
      icon: "sun",
      label: t("student.sidebar.items.today", "Hôm nay"),
    },
    {
      to: "/student/lessons",
      end: false,
      icon: "library",
      label: t("student.sidebar.items.lessons", "Bài học"),
    },
    {
      to: "/student/dictation",
      end: false,
      icon: "headphones",
      label: t("student.sidebar.items.dictation", "Nghe chép"),
    },
    {
      to: "/student/shadowing",
      end: false,
      icon: "mic",
      label: t("student.sidebar.items.shadowing", "Shadowing"),
    },
    {
      to: "/student/mywords",
      end: false,
      icon: "bookmark",
      label: t("student.sidebar.items.mywords", "Từ của tôi"),
    },
  ];

  return (
    <nav
      className="md:hidden fixed left-3 right-3 bottom-3 z-40 h-[68px] px-1.5 rounded-[28px] bg-surface-glass backdrop-blur-2xl border border-border-strong shadow-[var(--shadow-card)] flex items-center justify-around"
      aria-label="Điều hướng di động"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex-1 min-w-[48px] h-full flex flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition-colors duration-150 ${
              isActive
                ? "text-text font-semibold [&>svg]:text-accent"
                : "text-text-muted hover:text-text"
            }`
          }
        >
          <Icon name={item.icon} className="text-[22px]" />
          <span className="truncate max-w-[56px] text-center">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
