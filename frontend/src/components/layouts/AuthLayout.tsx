import { Outlet } from "react-router-dom";
import { GuestGuard } from "@/app/guards";
import Footer from "./Footer";

const AuthLayout = () => {
  return (
    <GuestGuard>
      <div className="relative min-h-screen flex flex-col justify-between overflow-x-clip bg-bg-base text-text">
        {/* Glow effect with Tailwind */}
        <div
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.18)_0%,transparent_70%)] blur-3xl" />
        </div>
        <main className="relative z-10 flex-1 flex flex-col">
          <Outlet />
        </main>
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </GuestGuard>
  );
};

export default AuthLayout;
