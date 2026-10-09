import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoadingScreen from "@/components/common/LoadingScreen";
import { errorMessage, toApiError } from "../errors";
import { consumeGoogleState } from "../googleOAuth";
import { homePathFor } from "../navigation";
import { useAuthStore } from "../stores/authStore";
import type { ApiError, MeResponse } from "../types";

// `code` chỉ dùng được một lần mà React StrictMode chạy effect hai lần ở dev: dùng chung một lần gọi cho cùng `code`.
let attempt: { code: string; promise: Promise<MeResponse> } | null = null;

const STATE_MISMATCH: ApiError = { status: 0, code: "AUTH_GOOGLE_TOKEN_INVALID", message: "", errors: [], details: {} };

/** Đích Google chuyển về sau khi người dùng đồng ý (`/authenticate?code=...&state=...`): đổi code lấy phiên đăng nhập. */
export default function GoogleCallback() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const [error, setError] = useState<ApiError | null>(null);

  const code = params.get("code");
  const state = params.get("state");
  const denied = params.get("error") !== null;

  useEffect(() => {
    // Đóng hoặc từ chối ở Google (`error=access_denied`), hoặc vào thẳng trang này: về đăng nhập, không báo lỗi (AC-AUTH-21)
    if (denied || !code) {
      navigate("/auth/login", { replace: true });
      return;
    }
    if (attempt?.code !== code) {
      attempt = {
        code,
        promise: consumeGoogleState(state)
          ? googleLogin(code).then((data) => data.user)
          : Promise.reject(STATE_MISMATCH),
      };
    }
    let active = true;
    attempt.promise.then(
      (user) => {
        if (active) navigate(homePathFor(user), { replace: true });
      },
      (err: unknown) => {
        if (active) setError(err === STATE_MISMATCH ? STATE_MISMATCH : toApiError(err));
      },
    );
    return () => {
      active = false;
    };
  }, [code, state, denied, googleLogin, navigate]);

  if (!error) return <LoadingScreen />;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="ll-card flex w-full max-w-[420px] flex-col gap-4">
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {t("google.failedTitle")}
        </h1>
        <div className="ll-form-alert danger" role="alert">
          <i className="ph ph-warning-circle" style={{ fontSize: 20, flexShrink: 0 }} />
          <span>{errorMessage(error)}</span>
        </div>
        <Link to="/auth/login" className="ll-btn primary lg full" replace>
          {t("google.backToLogin")}
        </Link>
      </div>
    </main>
  );
}
