import { Outlet } from "react-router-dom";
import { GuestGuard } from "@/app/guards";
import Footer from "./Footer";

const AuthLayout = () => {

  return (
    <GuestGuard>
      {/* bg-glow: hiệu ứng nền từ student.css */}
      <div className="bg-glow" aria-hidden="true" />
      <Outlet />
      <Footer />
    </GuestGuard>
  );
};

export default AuthLayout;
