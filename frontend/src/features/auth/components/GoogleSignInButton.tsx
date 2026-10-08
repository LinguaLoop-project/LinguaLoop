import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { isGoogleConfigured } from "../googleConfig";
import { errorMessage, toApiError } from "../errors";
import { homePathFor } from "../navigation";
import { useAuthStore } from "../stores/authStore";
import type { ApiError } from "../types";

type Props = {
  /** `continue_with` cho đăng nhập, `signup_with` cho đăng ký (chữ trên nút do Google vẽ, theo ngôn ngữ nạp script ở GoogleAuthProvider). */
  text: "continue_with" | "signup_with";
};

// Google chỉ nhận chiều rộng 200–400px
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

/** Theme sáng/tối của app nằm ở thuộc tính data-theme của <html>. */
function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function GoogleSignInButtonInner({ text }: Props) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const theme = useSyncExternalStore(subscribeTheme, getTheme);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(MAX_WIDTH);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.floor(entry.contentRect.width))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onSuccess = async ({ credential }: CredentialResponse) => {
    if (!credential) return;
    setError(null);
    setBusy(true);
    try {
      const { user } = await googleLogin(credential);
      navigate(homePathFor(user), { replace: true });
    } catch (err: unknown) {
      setError(toApiError(err));
      setBusy(false);
    }
  };

  // Đóng popup hoặc từ chối: Google không gọi backend, ở lại trang và không báo lỗi (AC-AUTH-21)
  const onError = () => undefined;

  return (
    <>
      <div ref={containerRef} className="flex justify-center" aria-busy={busy} style={busy ? { opacity: 0.6, pointerEvents: "none" } : undefined}>
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          text={text}
          theme={theme === "light" ? "outline" : "filled_black"}
          shape="rectangular"
          size="large"
          width={width}
        />
      </div>
      {busy && (
        <p className="text-center text-[13px]" style={{ color: "var(--text-muted)" }} role="status">
          {t("google.signingIn")}
        </p>
      )}
      {error && (
        <div className="ll-form-alert danger" role="alert">
          <i className="ph ph-warning-circle" style={{ fontSize: 20, flexShrink: 0 }} />
          <span>{errorMessage(error)}</span>
        </div>
      )}
      <div className="ll-or">
        <span>{t("google.orDivider")}</span>
      </div>
    </>
  );
}

/** Nút "Tiếp tục với Google" kèm dòng phân cách "hoặc dùng email". Chưa cấu hình client ID thì không hiện gì. */
export default function GoogleSignInButton(props: Props) {
  if (!isGoogleConfigured) return null;
  return <GoogleSignInButtonInner {...props} />;
}
