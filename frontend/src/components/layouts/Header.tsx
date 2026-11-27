import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import { buttonClasses } from "@/components/common/buttonStyles";
import Icon from "@/components/common/Icon";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import Logo from "@/components/common/Logo";
import { homePathFor, useAuth } from "@/features/auth";
import { useTheme } from "@/hooks/useTheme";

interface NavEntry {
  to: string;
  icon: string;
  /** Khoá trong `header.nav`. */
  labelKey: string;
  /** Màu chức năng của icon (DESIGN.v2 §3.2). */
  iconClass: string;
}

interface AnchorEntry {
  href: string;
  labelKey: string;
}

interface MoreEntry {
  to: string;
  icon: string;
  /** Khoá trong `header.more`. */
  key: "lessons" | "weakness";
  iconClass: string;
}

const LANDING_ANCHORS: AnchorEntry[] = [
  { href: "#loop", labelKey: "loop" },
  { href: "#features", labelKey: "features" },
  { href: "#pricing", labelKey: "pricing" },
  { href: "#faq", labelKey: "faq" },
];

const NAV: NavEntry[] = [
  { to: "/student/dictation", icon: "headphones", labelKey: "listening", iconClass: "text-fn-dictation" },
  { to: "/student/shadowing", icon: "mic", labelKey: "pronunciation", iconClass: "text-fn-shadowing" },
  { to: "/student/vocab", icon: "layers", labelKey: "vocabulary", iconClass: "text-fn-vocab" },
];

const MORE: MoreEntry[] = [
  { to: "/student/lessons", icon: "library", key: "lessons", iconClass: "bg-primary-soft text-primary-text" },
  { to: "/student/weakness", icon: "target", key: "weakness", iconClass: "bg-fn-weakness-soft text-fn-weakness" },
];

const LINK =
  "flex h-10 items-center gap-2 whitespace-nowrap rounded-md px-3 lg:px-2 xl:px-3text-[15px] font-medium transition-colors duration-150 [&>svg]:h-5 [&>svg]:w-5";
const LINK_IDLE = "text-text-muted hover:bg-surface-hover hover:text-text";
const LINK_ON = "bg-primary-soft text-text";
// Cụm tiện ích dạng viên thuốc giống TopBar của trang học (ngôn ngữ gọn VI/EN · đổi sáng/tối)
const GROUP_BUTTON =
  "grid h-8 w-8 cursor-pointer place-items-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text [&>svg]:h-[18px] [&>svg]:w-[18px]";
const DIVIDER = "mx-0.5 h-4 w-px shrink-0 bg-border";

/** Thanh trên của các trang công khai (trang chủ, bảng giá): cao 64, nền bg-base 82% + mờ như `.topbar` của mockup v2. */
export default function Header() {
  const { t } = useTranslation("layout");
  const { isAuthenticated, user, handleLogout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  const [activeAnchor, setActiveAnchor] = useState<string>("");
  const moreRef = useRef<HTMLDivElement>(null);
  const isGuestLanding = !isAuthenticated && pathname === "/";
  // Khách: nút chính mời đăng ký (khớp các nút "Bắt đầu miễn phí" trên trang chủ), nút phụ để người đã có tài khoản đăng nhập
  const primaryTo = isAuthenticated && user ? homePathFor(user) : "/auth/register";
  const primaryLabel = isAuthenticated ? t("header.learnNow") : t("header.start");

  // Đổi trang thì đóng menu (điều chỉnh state ngay khi render, không cần effect).
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setMoreOpen(false);
    setMobileOpen(false);
    setActiveAnchor("");
  }

  // Đánh dấu mục đang xem trên trang chủ. Trang chủ tải lười nên tìm các mục lúc cuộn, không tìm một lần khi gắn header.
  useEffect(() => {
    if (!isGuestLanding) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current = "";
      for (const anchor of LANDING_ANCHORS) {
        const el = document.getElementById(anchor.href.slice(1));
        if (el && el.getBoundingClientRect().top <= line) current = anchor.href;
      }
      setActiveAnchor(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isGuestLanding]);

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
    <Button
      variant="ghost"
      onClick={() => void handleLogout()}
      leftIcon={<Icon name="log-out" />}
      aria-label={t("header.logout")}
      title={t("header.logout")}
    >
      {/* Màn lg chưa đủ rộng cho cả menu học tập lẫn chữ "Đăng xuất" nên chỉ hiện icon */}
      <span className="lg:hidden xl:inline">{t("header.logout")}</span>
    </Button>
  ) : (
    <Link to="/auth/login" className={buttonClasses({ variant: "ghost" })}>
      {t("header.login")}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-[color-mix(in_srgb,var(--bg-base)_82%,transparent)] backdrop-blur-[12px]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="mr-2 flex shrink-0 items-center xl:mr-6" aria-label={t("header.homeLabel")}>
          <Logo size={34} showText />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label={t("header.mainMenu")}>
          {isGuestLanding ? (
            LANDING_ANCHORS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setActiveAnchor(item.href)}
                aria-current={activeAnchor === item.href ? "location" : undefined}
                className={`${LINK} ${activeAnchor === item.href ? LINK_ON : LINK_IDLE} no-underline`}
              >
                {t(`header.nav.${item.labelKey}`)}
              </a>
            ))
          ) : (
            <>
              {NAV.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `${LINK} ${isActive ? LINK_ON : LINK_IDLE}`}>
                  {/* Màn lg chật: bỏ icon để menu không tràn sang cụm nút bên phải */}
                  <Icon name={item.icon} className={`${item.iconClass} hidden xl:block`} />
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
            </>
          )}
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
          <div className="flex h-10 items-center gap-0.5 rounded-full border border-border bg-surface p-1 shadow-xs">
            <LanguageSwitcher variant="compact" />
            <span aria-hidden="true" className={DIVIDER} />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={t("theme.toggle")}
              title={isDark ? t("theme.toLight") : t("theme.toDark")}
              className={GROUP_BUTTON}
            >
              <Icon name={isDark ? "sun" : "moon"} />
            </button>
          </div>
          {authButton}
          <Link to={primaryTo} className={`${buttonClasses({})} whitespace-nowrap`}>
            <Icon name="sparkles" />
            {primaryLabel}
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
            {isGuestLanding ? (
              LANDING_ANCHORS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setActiveAnchor(item.href);
                    setMobileOpen(false);
                  }}
                  aria-current={activeAnchor === item.href ? "location" : undefined}
                  className={`${LINK} min-h-11 ${activeAnchor === item.href ? LINK_ON : LINK_IDLE} no-underline`}
                >
                  {t(`header.nav.${item.labelKey}`)}
                </a>
              ))
            ) : (
              <>
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
              </>
            )}
          </nav>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <LanguageSwitcher heightClass="h-11" />
            <div className="grid grid-cols-2 gap-2">
              {authButton}
              <Link to={primaryTo} className={buttonClasses({})}>
                <Icon name="sparkles" />
                {primaryLabel}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
