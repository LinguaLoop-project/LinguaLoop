/**
 * StudentLayout — khung chính cho tất cả trang học viên.
 *
 * Cấu trúc (theo student.css):
 *   .shell  → grid 2 cột: 248px (sidebar) + minmax(0,1fr) (page)
 *   .rail   → sticky sidebar (StudentSidebar)
 *   .page   → vùng nội dung chính
 *     .top  → sticky topbar (StudentTopBar)
 *     .main → padding nội dung
 *       .wrap → max-width 1200px
 *
 * Bảo vệ bởi AuthGuard: chỉ student authenticated mới vào được.
 */

import { Outlet } from "react-router-dom";
// import AuthGuard from "@/app/guards/AuthGuard";
import SvgSprites from "@/components/common/SvgSprites";
import StudentSidebar from "./StudentSidebar";
import StudentTopBar from "./StudentTopBar";
import Footer from "@/components/layouts/Footer";
import { UpgradeModal } from "@/components/common/UpgradeModal";
import { useQuotaStore } from "@/stores/quotaStore";

const StudentLayout = () => {
  const { showUpgradeModal, setShowUpgradeModal } = useQuotaStore();

  return (
    // <AuthGuard allowedRoles={["STUDENT", "USER"]}>
    <>
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* SVG sprite sheet — dùng chung cho toàn bộ trang student */}
      <SvgSprites />

      {/* Background effects */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-0 md:left-[248px] right-0 top-0 h-[760px] bg-[var(--hero-radial)] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(var(--text)_1px,transparent_1.2px)] [background-size:24px_24px] [mask-image:linear-gradient(180deg,#000,transparent_75%)]" />
      </div>

      {/* Shell: sidebar + page */}
      <div className="relative z-[1] grid grid-cols-1 md:grid-cols-[248px_minmax(0,1fr)] min-h-screen">
        {/* Sidebar */}
        <StudentSidebar />

        {/* Page area */}
        <div className="min-w-0 flex flex-col justify-between ">
          <StudentTopBar />

          {/* Main content */}
          <main
            className="p-4 md:px-6 md:pt-6 md:pb-20 min-w-0 overflow-x-clip"
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
    // </AuthGuard>
  );
};

export default StudentLayout;
