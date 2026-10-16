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
import StudentSidebar from "./StudentSidebar";
import StudentTopBar from "./StudentTopBar";
import StudentMobileNav from "./StudentMobileNav";
import Footer from "@/components/layouts/Footer";
import { UpgradeModal } from "@/components/common/UpgradeModal";
import { useQuotaStore } from "@/stores/quotaStore";

const StudentLayout = () => {
  const { showUpgradeModal, setShowUpgradeModal } = useQuotaStore();

  return (
    <>
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* Shell: sidebar + page */}
      <div className="relative z-[1] grid grid-cols-1 md:grid-cols-[248px_minmax(0,1fr)] min-h-screen">
        {/* Sidebar */}
        <StudentSidebar />

        {/* Page area */}
        <div className="min-w-0 flex flex-col justify-between">
          <StudentTopBar />

          {/* Main content */}
          <main
            className="p-3.5 sm:p-5 md:px-6 md:pt-6 pb-28 md:pb-20 min-w-0 overflow-x-clip"
            id="main-content"
          >
            <div className="max-w-[1200px] mx-auto w-full">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>

      {/* Mobile Navigation Dock (< 768px) */}
      <StudentMobileNav />
    </>
  );
};

export default StudentLayout;
