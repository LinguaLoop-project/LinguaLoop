import { Outlet } from "react-router-dom";
import RouteErrorBoundary from "@/components/common/RouteErrorBoundary";
import ToastHost from "@/components/common/ToastHost";
import Header from "@/components/layouts/Header";
import AppFooter from "@/components/layouts/shell/AppFooter";
import { STUDENT_SHELL } from "@/components/layouts/shell/shellConfigs";

/** Khung các trang công khai (trang chủ, bảng giá): thanh trên, nội dung, cùng chân trang 5 cột với khung học viên. */
const MainLayout = () => {
  return (
    <div className="relative z-[1] flex min-h-screen flex-col text-text">
      <ToastHost />
      <Header />
      <main className="flex-grow" id="main-content">
        <RouteErrorBoundary>
          <Outlet />
        </RouteErrorBoundary>
      </main>
      <AppFooter config={STUDENT_SHELL} />
    </div>
  );
};

export default MainLayout;
