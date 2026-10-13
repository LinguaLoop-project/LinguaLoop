import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthSidePanel from "@/features/auth/components/AuthSidePanel";
import AuthTopBar from "@/features/auth/components/AuthTopBar";

const AuthLayout = () => {
  const { t } = useTranslation("auth");

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[700px_1fr] lg:grid-cols-[780px_1fr] min-h-screen bg-bg-base text-text"
      id="auth"
    >
      {/* ── Left side panel with Loopi mascot and 3D objects ── */}
      <AuthSidePanel />

      {/* ── Right side main container ── */}
      <main className="flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <AuthTopBar />

        {/* Dynamic page content */}
        <div className="w-full max-w-[440px] mx-auto my-auto py-6">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-[13px] text-center text-text-muted mt-auto pt-4">
          © 2026 LinguaLoop ·{" "}
          <button
            type="button"
            className="text-text-muted hover:text-text hover:underline transition-colors cursor-pointer bg-transparent border-0"
          >
            {t("footer.terms")}
          </button>{" "}
          ·{" "}
          <button
            type="button"
            className="text-text-muted hover:text-text hover:underline transition-colors cursor-pointer bg-transparent border-0"
          >
            {t("footer.privacy")}
          </button>{" "}
          ·{" "}
          <button
            type="button"
            className="text-text-muted hover:text-text hover:underline transition-colors cursor-pointer bg-transparent border-0"
          >
            {t("footer.help")}
          </button>
        </p>
      </main>
    </div>
  );
};

export default AuthLayout;
