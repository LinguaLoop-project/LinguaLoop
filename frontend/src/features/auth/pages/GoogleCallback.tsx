import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoadingScreen from "@/components/common/LoadingScreen";
import Card from "@/components/common/Card";
import FormAlert from "@/components/common/FormAlert";
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
      <Card className="flex w-full max-w-[420px] flex-col gap-4">
        <h1 className="text-xl font-bold font-display text-text">
          {t("google.failedTitle")}
        </h1>
        <FormAlert variant="danger">
          <span>{errorMessage(error)}</span>
        </FormAlert>
        <Link
          to="/auth/login"
          replace
          className="inline-flex items-center justify-center font-semibold select-none rounded-xl transition-all duration-200 cursor-pointer h-12 px-6 text-sm bg-[var(--btn-primary)] hover:bg-[var(--btn-primary-hover)] text-white shadow-[0_2px_12px_rgba(123,77,232,0.35)] hover:shadow-[0_4px_16px_rgba(123,77,232,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] w-full"
        >
          {t("google.backToLogin")}
        </Link>
      </Card>
    </main>
  );
}
