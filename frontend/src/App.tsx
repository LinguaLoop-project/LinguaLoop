import { AppRoutes } from "@/app/routes";
import { useEffect } from "react";
import { useAuthStore } from "@/features/auth";
import SvgSprites from "@/components/common/SvgSprites";

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  // Khôi phục phiên từ cookie refresh khi mở app (BR-AUTH-07)
  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  return (
    <>
      <SvgSprites />
      <AppRoutes />
    </>
  );
}

export default App;

