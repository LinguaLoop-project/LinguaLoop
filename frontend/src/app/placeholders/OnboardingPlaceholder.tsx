import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth";
import PlaceholderPage from "@/components/common/PlaceholderPage";
import Button from "@/components/common/Button";

/** Tạm thời, thay bằng trang thiết lập hồ sơ ở PR onboarding (UC-AUTH-08). Có nút đăng xuất vì trang này chưa có layout. */
const OnboardingPlaceholder = () => {
  const { t } = useTranslation("auth");
  const { handleLogout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <PlaceholderPage
        title={t("onboarding.title")}
        description={t("onboarding.description")}
      />
      <Button variant="ghost" onClick={() => void handleLogout()}>
        {t("onboarding.logout")}
      </Button>
    </div>
  );
};

export default OnboardingPlaceholder;
