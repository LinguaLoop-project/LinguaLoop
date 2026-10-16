/**
 * InstructorLayout — Khung giao diện chuẩn cho Giảng viên (Cosmic Violet design system).
 * Tách biệt InstructorSidebar và InstructorTopBar tương tự StudentLayout.
 * Hoàn toàn dùng TailwindCSS v4.
 */

import { Outlet } from "react-router-dom";
import InstructorSidebar from "@/components/layouts/InstructorSidebar";
import InstructorTopBar from "@/components/layouts/InstructorTopBar";
import Footer from "@/components/layouts/Footer";

const InstructorLayout = () => {
  return (
    <>
      {/* Shell layout: sidebar + page */}
      <div className="relative z-[1] grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] min-h-screen">
        <InstructorSidebar />
        <div className="min-w-0 flex flex-col justify-between">
          <InstructorTopBar />
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
  );
};

export default InstructorLayout;
