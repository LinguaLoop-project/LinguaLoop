import type { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID, isGoogleConfigured } from "../googleConfig";

/** Nạp Google Identity Services cho cả app; chưa có client ID thì bỏ qua, không nạp script của Google. */
export default function GoogleAuthProvider({ children }: { children: ReactNode }) {
  if (!isGoogleConfigured) return <>{children}</>;
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
}
