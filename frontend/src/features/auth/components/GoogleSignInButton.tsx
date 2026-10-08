import { useTranslation } from "react-i18next";
import { isGoogleConfigured } from "../googleConfig";
import { startGoogleLogin } from "../googleOAuth";

type Props = {
  /** `continue` cho trang đăng nhập, `signup` cho trang đăng ký. */
  variant: "continue" | "signup";
};

/** Nút "Tiếp tục với Google" kèm dòng phân cách "hoặc dùng email". Chưa cấu hình client ID thì không hiện gì. */
export default function GoogleSignInButton({ variant }: Props) {
  const { t } = useTranslation("auth");
  if (!isGoogleConfigured) return null;

  return (
    <>
      <button type="button" className="ll-btn ghost lg full" onClick={startGoogleLogin}>
        <svg className="mr-1 h-5 w-5" aria-hidden="true">
          <use href="#g-google" />
        </svg>
        <span>{t(`google.${variant}`)}</span>
      </button>
      <div className="ll-or">
        <span>{t("google.orDivider")}</span>
      </div>
    </>
  );
}
