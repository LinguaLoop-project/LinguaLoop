/**
 * AdminLayout — Khung giao diện chuẩn cho Quản trị viên (Cosmic Violet design system).
 * Tách biệt AdminSidebar và AdminTopBar tương tự StudentLayout và InstructorLayout.
 * Hoàn toàn dùng TailwindCSS v4.
 */

import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminTopBar from "@/components/layouts/AdminTopBar";
import Footer from "@/components/layouts/Footer";

const AdminLayout = () => {
  return (
    <>
      {/* Shell layout: sidebar + page */}
      <div className="relative z-[1] grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] min-h-screen">
        <AdminSidebar />
        <div className="min-w-0 flex flex-col justify-between">
          <AdminTopBar />
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

export default AdminLayout;
