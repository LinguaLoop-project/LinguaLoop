import { useTranslation } from "react-i18next";
import GoogleLogo from "@/features/auth/components/GoogleLogo";
import { isGoogleConfigured } from "../googleConfig";
import { startGoogleLogin } from "../googleOAuth";
import Button from "@/components/common/Button";

/**
 * Nút "Tiếp tục với Google" kèm dòng phân cách "hoặc dùng email" (`.oauth` + `.or` của mockup), chỉ có ở trang đăng nhập:
 * đăng ký và đăng nhập bằng Google là một (email chưa có tài khoản thì tự tạo). Chưa cấu hình client ID thì không hiện gì.
 */
export default function GoogleSignInButton() {
  const { t } = useTranslation("auth");
  if (!isGoogleConfigured) return null;

  return (
    <>
      <Button variant="ghost" size="lg" fullWidth onClick={startGoogleLogin} leftIcon={<GoogleLogo className="h-5 w-5" />}>
        {t("google.continue")}
      </Button>
      <div className="flex items-center gap-3 text-[13px] text-text-subtle before:h-px before:flex-1 before:bg-border before:content-[''] after:h-px after:flex-1 after:bg-border after:content-['']">
        {t("google.orDivider")}
      </div>
    </>
  );
}
