import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth";
import Button from "@/components/common/Button";
import LearningProfileForm from "../components/LearningProfileForm";

/** Thiết lập hồ sơ học tập sau lần đăng nhập đầu tiên (UC-TK-08). */
export default function OnboardingPage() {
  const { t } = useTranslation("auth");
  const { user, handleLogout } = useAuth();

  // Đã hoàn tất thiết lập thì không cho quay lại màn này (AC-TK-52).
  if (user?.onboarded) {
    return <Navigate to="/student" replace />;
  }

  return (
    <section className="flex w-full flex-col gap-5">
      <div>
        <span className="block text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text">
          {t("onboarding.overline")}
        </span>
        <h1 className="text-[30px] font-bold leading-[48px] text-text">{t("onboarding.title")}</h1>
        <p className="text-[14px] leading-relaxed text-text-muted">{t("onboarding.description")}</p>
      </div>

      <LearningProfileForm mode="onboarding" />

      <div className="flex justify-center">
        <Button variant="ghost" onClick={() => void handleLogout()}>
          {t("onboarding.logout")}
        </Button>
      </div>
    </section>
  );
}
