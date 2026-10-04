/**
 * TeacherLayout — Khung giao diện chuẩn cho Giảng viên (Cosmic Violet design system).
 * Tách biệt TeacherSidebar và TeacherTopBar tương tự StudentLayout.
 * Hoàn toàn dùng TailwindCSS v4.
 */

import { Outlet } from "react-router-dom";
import AuthGuard from "@/app/guards/AuthGuard";
import SvgSprites from "@/components/common/SvgSprites";
import TeacherSidebar from "@/components/layouts/TeacherSidebar";
import TeacherTopBar from "@/components/layouts/TeacherTopBar";
import Footer from "@/components/layouts/Footer";

const TeacherLayout = () => {
  return (
    <AuthGuard allowedRoles={["TEACHER"]}>
      <>
        <SvgSprites />

        {/* Background effects */}
        <div
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute left-0 md:left-[260px] right-0 top-0 h-[640px] bg-[var(--hero-radial)] animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(var(--text)_1px,transparent_1.2px)] [background-size:24px_24px] [mask-image:linear-gradient(180deg,#000,transparent_65%)]" />
        </div>

        {/* Shell layout: sidebar + page */}
        <div className="relative z-[1] grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] min-h-screen">
          <TeacherSidebar />
          <div className="min-w-0 flex flex-col justify-between">
            <TeacherTopBar />
            <main
              className="p-4 md:p-7 min-w-0 overflow-x-clip"
              id="main-content"
            >
              <div className="max-w-[1200px] mx-auto w-full">
                <Outlet />
              </div>
            </main>
            <Footer />
          </div>
        </div>
      </>
    </AuthGuard>
  );
};

export default TeacherLayout;
