import type { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import i18n from "@/i18n";
import { GOOGLE_CLIENT_ID, isGoogleConfigured } from "../googleConfig";

/**
 * Nạp Google Identity Services cho cả app; chưa có client ID thì bỏ qua, không nạp script của Google.
 * Ngôn ngữ chữ trên nút Google (`hl`) chốt lúc nạp script nên theo ngôn ngữ đang chọn khi mở app; đổi ngôn ngữ
 * sau đó cần tải lại trang mới đổi chữ trên nút.
 */
export default function GoogleAuthProvider({ children }: { children: ReactNode }) {
  if (!isGoogleConfigured) return <>{children}</>;
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} locale={i18n.resolvedLanguage}>{children}</GoogleOAuthProvider>;
}
