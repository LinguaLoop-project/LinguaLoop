import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthSidePanel from "@/features/auth/components/AuthSidePanel";
import AuthTopBar from "@/features/auth/components/AuthTopBar";

const FOOT_LINK = "cursor-pointer border-0 bg-transparent p-0 font-medium text-text-muted transition-colors hover:text-text hover:underline";

/** Khung màn đăng nhập (`.auth` trong mockup v2): cột trái 5fr, cột phải 6fr; dưới 768px chỉ còn cột phải. */
const AuthLayout = () => {
  const { t } = useTranslation("auth");

  return (
    <div className="relative z-[1] grid min-h-screen grid-cols-1 text-text md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]" id="auth">
      <AuthSidePanel />

      <main className="flex min-w-0 flex-col p-4 md:px-8 md:py-6">
        <AuthTopBar />

        <div className="grid flex-1 place-items-start justify-items-center py-6 md:place-items-center md:py-8">
          <div className="w-full max-w-[420px]">
            <Outlet />
          </div>
        </div>

        <p className="text-center text-[13px] leading-normal text-text-muted">
          © 2026 LinguaLoop ·{" "}
          <button type="button" className={FOOT_LINK}>
            {t("footer.terms")}
          </button>{" "}
          ·{" "}
          <button type="button" className={FOOT_LINK}>
            {t("footer.privacy")}
          </button>{" "}
          ·{" "}
          <button type="button" className={FOOT_LINK}>
            {t("footer.help")}
          </button>
        </p>
      </main>
    </div>
  );
};

export default AuthLayout;
