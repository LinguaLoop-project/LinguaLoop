/**
 * StudentTopBar — thanh top cố định của Student Layout.
 * Dựa trên TOPBAR trong mockups-student/shell.js và class .top từ student.css.
 *
 * Chứa: logo mobile, search (cosmetic), streak pill, theme toggle, avatar menu.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/common/Logo";
import { useAuth } from "@/features/auth";
import { useQuota } from "@/hooks/useQuota";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export default function StudentTopBar() {
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();
  const { isPro, actionsToday, maxActions } = useQuota();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const [dark, setDark] = useState(() => {
    try {
      const t = JSON.parse(localStorage.getItem("ll3-theme") ?? "null");
      return t
        ? t === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("ll3-theme", JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setDark(!dark);
  }

  const displayName =
    user?.username || user?.email?.split("@")[0] || "Minh Anh";
  const displayEmail = user?.email || "minhanh.nguyen@gmail.com";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 py-2.5 md:py-4 bg-[color-mix(in_srgb,var(--bg-base)_72%,transparent)] backdrop-blur-md border-b border-border">
      {/* Logo chỉ hiện ở mobile */}
      <button
        type="button"
        className="flex md:hidden items-center justify-center p-0 bg-transparent border-0 cursor-pointer"
        onClick={() => navigate("/student")}
        aria-label="LinguaLoop, về trang Hôm nay"
      >
        <Logo size={32} showText={false} />
      </button>

      {/* Command palette placeholder */}
      <button
        type="button"
        className="w-11 md:w-auto md:max-w-[480px] md:flex-1 h-11 flex items-center justify-center md:justify-start gap-2.5 px-3 rounded-md border border-border bg-surface-glass text-text-muted text-sm transition-colors duration-150 hover:border-border-strong hover:bg-surface-hover cursor-pointer"
        aria-label="Mở tìm kiếm nhanh"
        disabled
      >
        <i className="ph ph-magnifying-glass text-xl" aria-hidden="true" />
        <span className="hidden md:inline">Tra từ, mở bài, chuyển màn…</span>
        <kbd className="hidden md:inline ml-auto px-1.5 py-0.5 rounded text-[11px] font-semibold bg-surface-hover border border-border text-text-muted">
          Ctrl K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Streak pill */}
        <span
          className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full border border-border-strong bg-surface-glass font-semibold text-sm select-none"
          title="Chuỗi ngày học"
        >
          <i
            className="ph-fill ph-fire text-warning text-lg"
            aria-hidden="true"
          />
          <span id="streakNum">5</span>
        </span>

        {/* Quota pill */}
        {!isPro && (
          <span
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full border border-border-strong bg-surface-glass font-semibold text-sm select-none"
            title="Lượt hành động trong ngày"
          >
            <i
              className="ph-fill ph-lightning text-purple-500 text-lg"
              aria-hidden="true"
            />
            <span>{maxActions - actionsToday}/{maxActions}</span>
          </span>
        )}

        {/* Plan pill */}
        <span
          className={`hidden md:inline-flex items-center justify-center h-10 px-3.5 rounded-full border border-border-strong font-semibold text-sm cursor-pointer hover:bg-surface-hover transition-colors ${
            isPro ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-surface-glass text-text"
          }`}
          id="planPill"
        >
          {isPro ? "Pro" : "Free"}
        </span>

        {/* Theme toggle */}
        <button
          type="button"
          className="w-10 h-10 shrink-0 rounded-md border border-border grid place-items-center text-xl text-text-muted bg-transparent hover:bg-surface-hover hover:border-border-strong hover:text-text transition-colors cursor-pointer"
          onClick={toggleTheme}
          aria-label="Đổi giao diện sáng/tối"
        >
          {dark ? (
            <i className="ph ph-moon text-accent" aria-hidden="true" />
          ) : (
            <i className="ph ph-sun text-warning" aria-hidden="true" />
          )}
        </button>

        {/* Account menu */}
        <div ref={accountMenuRef} className="relative">
          <button
            type="button"
            className="w-10 h-10 rounded-full grid place-items-center font-semibold text-sm bg-primary-soft text-text border border-border-strong hover:bg-surface-hover transition-colors cursor-pointer select-none"
            id="acctBtn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="acctMenu"
            aria-label={`Tài khoản ${displayName}`}
          >
            {initials(displayName)}
          </button>

          {menuOpen && (
            <div
              className="absolute top-[calc(100%+8px)] right-0 z-50 min-w-[260px] rounded-lg p-2 flex flex-col gap-0.5 bg-surface-glass backdrop-blur-xl border border-border-strong shadow-[var(--shadow-card)] animate-in fade-in duration-150"
              id="acctMenu"
              role="menu"
              aria-label="Tài khoản"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-2 pb-3">
                <span
                  className="w-12 h-12 shrink-0 rounded-full grid place-items-center font-semibold text-base bg-primary-soft text-text border border-border-strong"
                  aria-hidden="true"
                >
                  {initials(displayName)}
                </span>
                <div className="flex-1 min-w-0">
                  <b className="block font-bold text-sm text-text truncate">
                    {displayName}
                  </b>
                  <div className="text-xs text-text-muted truncate">
                    {displayEmail}
                  </div>
                </div>
              </div>

              {/* Plan */}
              <button
                type="button"
                role="menuitem"
                className="flex items-center gap-2.5 w-full p-2.5 rounded-md bg-surface-hover hover:bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] text-text font-medium text-sm border border-border cursor-pointer transition-colors"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/student/settings?tab=plan");
                }}
              >
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-surface-hover border border-border-strong text-text-muted">
                  Free
                </span>
                <span className="text-xs text-accent font-semibold">
                  Nâng cấp Pro
                </span>
                <i
                  className="ph ph-arrow-right ml-auto text-sm text-text-subtle"
                  aria-hidden="true"
                />
              </button>

              <hr className="border-0 border-t border-border -mx-2 my-1.5" />

              {[
                ["profile", "ph-user-circle", "Hồ sơ"],
                ["learning", "ph-target", "Cài đặt học tập"],
                ["security", "ph-shield-check", "Bảo mật & đăng nhập"],
                ["privacy", "ph-lock-key", "Quyền riêng tư & dữ liệu"],
              ].map(([tab, icon, label]) => (
                <button
                  key={tab}
                  type="button"
                  role="menuitem"
                  className="flex items-center gap-2.5 w-full min-h-[40px] px-2.5 rounded-md text-text-muted hover:text-text hover:bg-surface-hover font-medium text-sm text-left border-0 bg-transparent cursor-pointer transition-colors duration-150"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/student/settings?tab=${tab}`);
                  }}
                >
                  <i className={`ph ${icon} text-lg`} aria-hidden="true" />
                  {label}
                </button>
              ))}

              <button
                type="button"
                role="menuitem"
                className="flex items-center gap-2.5 w-full min-h-[40px] px-2.5 rounded-md text-text-muted hover:text-text hover:bg-surface-hover font-medium text-sm text-left border-0 bg-transparent cursor-pointer transition-colors duration-150"
                onClick={() => {
                  setMenuOpen(false);
                  toggleTheme();
                }}
              >
                <i className="ph ph-circle-half text-lg" aria-hidden="true" />
                Đổi giao diện sáng/tối
              </button>

              <hr className="border-0 border-t border-border -mx-2 my-1.5" />

              <button
                type="button"
                role="menuitem"
                className="flex items-center gap-2.5 w-full min-h-[40px] px-2.5 rounded-md text-danger hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] font-medium text-sm text-left border-0 bg-transparent cursor-pointer transition-colors duration-150"
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
              >
                <i className="ph ph-sign-out text-lg" aria-hidden="true" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
