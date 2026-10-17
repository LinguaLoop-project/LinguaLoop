import { useEffect, useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RouteErrorBoundary from "@/components/common/RouteErrorBoundary";
import ToastHost from "@/components/common/ToastHost";
import AppFooter from "./AppFooter";
import CommandPalette from "./CommandPalette";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useSidebarCollapsed } from "./useSidebarCollapsed";
import type { ShellConfig } from "./shellConfig";

/** Cột thanh bên: 76px khi thu gọn, 248px đầy đủ từ 1024px (DESIGN.v2 §11). */
const COLUMNS = {
  true: "md:grid-cols-[76px_minmax(0,1fr)]",
  false: "md:grid-cols-[76px_minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)]",
} as const;

const MAIN = {
  comfortable: "p-4 md:p-6",
  dense: "p-4 md:p-7",
} as const;

/** Khung chung cho học viên, giáo viên, admin: thanh bên + thanh trên + nội dung + chân trang. */
export default function AppShell({ config, children }: { config: ShellConfig; children?: ReactNode }) {
  const { t } = useTranslation("layout");
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

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
      <ToastHost />
      <CommandPalette config={config} open={paletteOpen} onOpenChange={setPaletteOpen} />

      <div className={`relative z-[1] grid min-h-screen grid-cols-1 ${COLUMNS[`${collapsed}`]}`}>
        {drawerOpen && (
          <button
            type="button"
            aria-label={t("shell.closeMenu")}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 cursor-default border-0 bg-black/50 md:hidden"
          />
        )}

        <Sidebar
          config={config}
          collapsed={collapsed}
          drawerOpen={drawerOpen}
          onToggleCollapsed={toggleCollapsed}
          onNavigate={() => setDrawerOpen(false)}
        />

        <div className="flex min-w-0 flex-col">
          <TopBar config={config} drawerOpen={drawerOpen} onOpenDrawer={() => setDrawerOpen(true)} onOpenPalette={() => setPaletteOpen(true)} />
          <main className={`min-w-0 flex-1 ${MAIN[config.density]}`} id="main-content">
            <div className="mx-auto w-full max-w-[1200px]">
              <RouteErrorBoundary>
                <Outlet />
              </RouteErrorBoundary>
            </div>
          </main>
          <AppFooter config={config} />
        </div>
      </div>
    </>
  );
}
