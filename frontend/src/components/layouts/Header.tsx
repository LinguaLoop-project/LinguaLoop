import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import { buttonClasses } from "@/components/common/buttonStyles";
import Icon from "@/components/common/Icon";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import Logo from "@/components/common/Logo";
import { useAuth } from "@/features/auth";
import { useTheme } from "@/hooks/useTheme";

interface NavEntry {
  to: string;
  icon: string;
  /** Khoá trong `header.nav`. */
  labelKey: string;
  /** Màu chức năng của icon (DESIGN.v2 §3.2). */
  iconClass: string;
}

interface MoreEntry {
  to: string;
  icon: string;
  /** Khoá trong `header.more`. */
  key: "lessons" | "weakness" | "test";
  iconClass: string;
}

const NAV: NavEntry[] = [
  { to: "/student/dictation", icon: "headphones", labelKey: "listening", iconClass: "text-fn-dictation" },
  { to: "/student/shadowing", icon: "mic", labelKey: "pronunciation", iconClass: "text-fn-shadowing" },
  { to: "/student/vocab", icon: "layers", labelKey: "vocabulary", iconClass: "text-fn-vocab" },
];

const MORE: MoreEntry[] = [
  { to: "/student/lessons", icon: "library", key: "lessons", iconClass: "bg-primary-soft text-primary-text" },
  { to: "/student/weakness", icon: "target", key: "weakness", iconClass: "bg-fn-assessment-soft text-fn-assessment" },
  { to: "/student/test", icon: "file-check", key: "test", iconClass: "bg-fn-assessment-soft text-fn-assessment" },
];

const LINK =
  "flex h-10 items-center gap-2 rounded-md px-3 text-[15px] font-medium transition-colors duration-150 [&>svg]:h-5 [&>svg]:w-5";
const LINK_IDLE = "text-text-muted hover:bg-surface-hover hover:text-text";
const LINK_ON = "bg-primary-soft text-text";

/** Thanh trên của các trang công khai (trang chủ, bảng giá): cao 64, nền bg-base 82% + mờ như `.topbar` của mockup v2. */
export default function Header() {
  const { t } = useTranslation("layout");
  const { isAuthenticated, handleLogout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  const moreRef = useRef<HTMLDivElement>(null);

  // Đổi trang thì đóng menu (điều chỉnh state ngay khi render, không cần effect).
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setMoreOpen(false);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  const themeButton = (
    <Button variant="ghost" iconOnly onClick={toggleTheme} aria-label={t("theme.toggle")} title={isDark ? t("theme.toLight") : t("theme.toDark")}>
      <Icon name={isDark ? "sun" : "moon"} />
    </Button>
  );

  const authButton = isAuthenticated ? (
    <Button variant="ghost" onClick={() => void handleLogout()} leftIcon={<Icon name="log-out" />}>
      {t("header.logout")}
    </Button>
  ) : (
    <Link to="/auth/login" className={buttonClasses({ variant: "ghost" })}>
      {t("header.login")}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-[color-mix(in_srgb,var(--bg-base)_82%,transparent)] backdrop-blur-[12px]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="mr-2 flex shrink-0 items-center lg:mr-6" aria-label={t("header.homeLabel")}>
          <Logo size={34} showText />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label={t("header.mainMenu")}>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `${LINK} ${isActive ? LINK_ON : LINK_IDLE}`}>
              <Icon name={item.icon} className={item.iconClass} />
              {t(`header.nav.${item.labelKey}`)}
            </NavLink>
          ))}

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              className={`${LINK} cursor-pointer border-0 bg-transparent ${moreOpen ? LINK_ON : LINK_IDLE}`}
            >
              {t("header.nav.more")}
              <Icon name="chevron-down" className={`transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <div role="menu" className="absolute left-0 top-full z-50 mt-2 w-72 animate-[menu-in_0.15s_ease-out] rounded-lg border border-border-strong bg-surface p-2 shadow-[var(--shadow-card)]">
                {MORE.map((m) => (
                  <Link key={m.to} to={m.to} role="menuitem" className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-surface-hover">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-sm ${m.iconClass}`}>
                      <Icon name={m.icon} className="text-xl" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium text-text">{t(`header.more.${m.key}.title`)}</span>
                      <span className="block text-[13px] leading-normal text-text-subtle">{t(`header.more.${m.key}.desc`)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {themeButton}
          <LanguageSwitcher heightClass="h-10" />
          {authButton}
          <Link to="/student/lessons" className={buttonClasses({})}>
            <Icon name="sparkles" />
            {t("header.start")}
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          {themeButton}
          <Button
            variant="ghost"
            iconOnly
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t("header.toggleMenu")}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
          >
            <Icon name={mobileOpen ? "x" : "menu"} />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div id="public-mobile-menu" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-bg-elevated px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label={t("header.mainMenu")}>
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `${LINK} min-h-11 ${isActive ? LINK_ON : LINK_IDLE}`}>
                <Icon name={item.icon} className={item.iconClass} />
                {t(`header.nav.${item.labelKey}`)}
              </NavLink>
            ))}
            <div className="my-2 h-px bg-border" />
            {MORE.map((m) => (
              <NavLink key={m.to} to={m.to} className={({ isActive }) => `${LINK} min-h-11 ${isActive ? LINK_ON : LINK_IDLE}`}>
                <Icon name={m.icon} />
                {t(`header.more.${m.key}.title`)}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <LanguageSwitcher heightClass="h-11" />
            <div className="grid grid-cols-2 gap-2">
              {authButton}
              <Link to="/student/lessons" className={buttonClasses({})}>
                <Icon name="sparkles" />
                {t("header.learnNow")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
