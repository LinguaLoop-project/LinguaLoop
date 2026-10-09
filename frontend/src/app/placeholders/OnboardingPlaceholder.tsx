import { useAuth } from "@/features/auth";
import PlaceholderPage from "@/components/common/PlaceholderPage";

/** Tạm thời, thay bằng trang thiết lập hồ sơ ở PR onboarding (UC-AUTH-08). Có nút đăng xuất vì trang này chưa có layout. */
const OnboardingPlaceholder = () => {
  const { handleLogout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <PlaceholderPage
        title="Thiết lập hồ sơ học tập"
        description="Chọn mục tiêu mỗi ngày, ngôn ngữ giao diện và múi giờ trước khi bắt đầu học."
      />
      <button type="button" className="ll-btn ghost" onClick={() => void handleLogout()}>
        Đăng xuất
      </button>
    </div>
  );
};

export default OnboardingPlaceholder;
