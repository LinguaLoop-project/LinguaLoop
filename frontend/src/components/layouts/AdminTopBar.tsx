/**
 * AdminTopBar — thanh top cố định của Admin Layout.
 * Dựa trên TOPBAR trong mockups-admin/shell.js và mockups-admin/admin.css.
 * Sử dụng tông màu tím Cosmic Violet chuẩn theo mockup.
 * Hoàn toàn dùng TailwindCSS v4.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogoMark } from "@/components/common/Logo";
import { useAuth } from "@/features/auth";

const ADMIN_PAGE_TITLES: Record<string, string> = {
  "/admin": "Tổng quan",
  "/admin/users": "Quản lý người dùng",
  "/admin/reports": "Hàng đợi báo lỗi",
  "/admin/decks": "Duyệt bộ từ",
  "/admin/audit": "Nhật ký nội dung",
  "/admin/limits": "Gói & Hạn mức",
  "/admin/subs": "Đăng ký Pro",
  "/admin/errors": "Danh mục lỗi",
  "/admin/teachers": "Giáo viên",
  "/admin/subscriptions": "Gói dịch vụ",
  "/admin/content": "Nội dung",
  "/admin/settings": "Cài đặt hệ thống",
  "/admin/logs": "Nhật ký hoạt động",
  "/admin/profile": "Hồ sơ quản trị viên",
  "/admin/analytics": "Phân tích & Thống kê",
};

export default function AdminTopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, handleLogout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.displayName ?? "Admin Tâm";
  const displayEmail = user?.email ?? "admin@lingualoop.app";

  const [dark, setDark] = useState(() => {
    try {
      const t = JSON.parse(localStorage.getItem("ll3-theme") ?? "null");
      return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
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
      if (e.key === "Escape") setMenuOpen(false);
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

  const pageTitle =
    ADMIN_PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith("/admin/users/")
      ? "Chi tiết người dùng"
      : location.pathname.startsWith("/admin/reports/")
      ? "Chi tiết báo cáo lỗi"
      : location.pathname.startsWith("/admin/decks/")
      ? "Chi tiết duyệt bộ từ"
      : "Tổng quan");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-7 py-3 md:py-3.5 bg-[color-mix(in_srgb,var(--bg-base)_72%,transparent)] backdrop-blur-md border-b border-border">
      {/* Left side: Breadcrumb & Mobile Logo */}
      <div className="flex items-center gap-3">
        {/* Mobile logo */}
        <button
          type="button"
          className="flex md:hidden items-center justify-center p-0 bg-transparent border-0 cursor-pointer"
          onClick={() => navigate("/admin")}
          aria-label="LinguaLoop Quản trị"
        >
          <LogoMark size={32} />
        </button>

        {/* Breadcrumb: Admin › [Page Title] */}
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Vị trí hiện tại">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="text-text-muted hover:text-primary transition-colors text-sm font-medium bg-transparent border-0 cursor-pointer p-0"
          >
            Admin
          </button>
          <span className="text-text-subtle text-xs" aria-hidden="true">&#8250;</span>
          <b className="text-text font-semibold">{pageTitle}</b>
        </nav>
      </div>

      {/* Right side: Theme toggle + Account menu */}
      <div className="flex items-center gap-2.5">
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

        {/* Account menu dropdown */}
        <div ref={accountMenuRef} className="relative">
          <button
            type="button"
            className="w-10 h-10 rounded-full grid place-items-center font-display font-bold text-base text-white shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer select-none border-0"
            style={{ background: "var(--gradient-primary)" }}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Tài khoản quản trị"
          >
            AD
          </button>

          {menuOpen && (
            <div
              className="absolute top-[calc(100%+8px)] right-0 z-50 w-[240px] rounded-[20px] bg-surface-glass backdrop-blur-xl border border-border-strong shadow-[var(--shadow-card)] overflow-hidden animate-in fade-in duration-150"
              role="menu"
              aria-label="Tài khoản"
            >
              {/* Account header */}
              <div className="px-4 py-3.5 border-b border-border">
                <b className="block text-[14px] font-bold text-text truncate">
                  {displayName}
                </b>
                <div className="text-[12px] text-text-muted truncate mt-0.5">
                  {displayEmail}
                </div>
              </div>

              {/* Items */}
              <div className="p-1.5 flex flex-col gap-0.5">
                <button
                  type="button"
                  role="menuitem"
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover font-medium text-[14px] text-left border-0 bg-transparent cursor-pointer transition-colors duration-150"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/admin/settings");
                  }}
                >
                  <i className="ph ph-gear-six text-lg text-text-subtle" aria-hidden="true" />
                  <span>Cài đặt hệ thống</span>
                </button>

                <div className="h-[1px] bg-border my-1 -mx-1.5" />

                <button
                  type="button"
                  role="menuitem"
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-danger hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] font-medium text-[14px] text-left border-0 bg-transparent cursor-pointer transition-colors duration-150"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <i className="ph ph-sign-out text-lg" aria-hidden="true" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
