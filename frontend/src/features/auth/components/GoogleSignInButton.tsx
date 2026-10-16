import { useTranslation } from "react-i18next";
import GoogleLogo from "@/features/auth/components/GoogleLogo";
import { isGoogleConfigured } from "../googleConfig";
import { startGoogleLogin } from "../googleOAuth";
import Button from "@/components/common/Button";

/**
 * Nút "Tiếp tục với Google" kèm dòng phân cách "hoặc dùng email", chỉ có ở trang đăng nhập: đăng ký và đăng nhập
 * bằng Google là một (email chưa có tài khoản thì tự tạo). Chưa cấu hình client ID thì không hiện gì.
 */
export default function GoogleSignInButton() {
  const { t } = useTranslation("auth");
  if (!isGoogleConfigured) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="lg"
        fullWidth
        onClick={startGoogleLogin}
        leftIcon={
          <GoogleLogo className="mr-1 h-5 w-5" />
        }
      >
        <span>{t("google.continue")}</span>
      </Button>
      <div className="relative my-4 flex items-center justify-center before:content-[''] before:absolute before:inset-x-0 before:top-1/2 before:border-t before:border-border">
        <span className="relative bg-surface px-3 text-xs uppercase tracking-wider text-text-subtle font-medium">
          {t("google.orDivider")}
        </span>
      </div>
    </>
  );
}
