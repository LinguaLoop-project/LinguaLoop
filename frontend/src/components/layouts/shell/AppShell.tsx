import { useEffect, useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RouteErrorBoundary from "@/components/common/RouteErrorBoundary";
import Footer from "@/components/layouts/Footer";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useSidebarCollapsed } from "./useSidebarCollapsed";
import type { ShellConfig } from "./shellConfig";

/** Cột thanh bên: 72px khi thu gọn, 248px đầy đủ từ 1024px (DESIGN.v2 §11). */
const COLUMNS = {
  true: "md:grid-cols-[72px_minmax(0,1fr)]",
  false: "md:grid-cols-[72px_minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)]",
} as const;

const MAIN = {
  comfortable: "p-3.5 pb-16 sm:p-5 md:px-6 md:pt-6",
  dense: "p-4 pb-12 md:p-7",
} as const;

/** Khung chung cho học viên, giáo viên, admin: thanh bên + thanh trên + nội dung + chân trang. */
export default function AppShell({ config, children }: { config: ShellConfig; children?: ReactNode }) {
  const { t } = useTranslation("layout");
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <>
      {children}

      {drawerOpen && (
        <button
          type="button"
          aria-label={t("shell.closeMenu")}
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 cursor-default border-0 bg-black/50 md:hidden"
        />
      )}

      <div className={`relative grid min-h-screen grid-cols-1 ${COLUMNS[`${collapsed}`]}`}>
        <Sidebar
          config={config}
          collapsed={collapsed}
          drawerOpen={drawerOpen}
          onToggleCollapsed={toggleCollapsed}
          onNavigate={() => setDrawerOpen(false)}
        />

        <div className="flex min-w-0 flex-col justify-between">
          <TopBar config={config} drawerOpen={drawerOpen} onOpenDrawer={() => setDrawerOpen(true)} />
          <main className={`min-w-0 overflow-x-clip ${MAIN[config.density]}`} id="main-content">
            <div className="mx-auto w-full max-w-[1200px]">
              <RouteErrorBoundary>
                <Outlet />
              </RouteErrorBoundary>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}
