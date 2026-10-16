import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../services/authService";
import { errorMessage, toApiError } from "../errors";
import type { ApiError } from "../types";
import { EMAIL_RE } from "../validations/authSchemas";
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";

type VerifyStatus = "loading" | "verified" | "already" | "invalid_link" | "error";

const REDIRECT_DELAY_MS = 2000;

/** Đích của link trong thư xác thực: `/verify-email?token=...`. */
const VerifyEmail = () => {
  const { t } = useTranslation("auth");
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();

  const [status, setStatus] = useState<VerifyStatus>(() => (token ? "loading" : "invalid_link"));
  const [verifyError, setVerifyError] = useState<ApiError | null>(null);
  const [email, setEmail] = useState("");
  // "format" = lỗi định dạng tại chỗ; ApiError = lỗi từ server. Giữ mã lỗi để dịch lại khi đổi ngôn ngữ.
  const [emailError, setEmailError] = useState<"format" | ApiError | null>(
    null,
  );
  const [sending, setSending] = useState(false);

  // Token chỉ dùng được một lần: chặn gọi API hai lần (React StrictMode chạy effect hai lần ở dev)
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      return;
    }
    if (calledRef.current) return;
    calledRef.current = true;

    authService
      .verifyEmail(token)
      .then((response) => {
        setStatus(
          response.data.data.result === "VERIFIED" ? "verified" : "already",
        );
      })
      .catch((err: unknown) => {
        const error = toApiError(err);
        setVerifyError(error);
        setStatus(error.code === "AUTH_LINK_INVALID" ? "invalid_link" : "error");
      });
  }, [token]);

  // Xác thực xong thì tự chuyển tới trang đăng nhập (AC-AUTH-28)
  useEffect(() => {
    if (status !== "verified") return;
    const timer = setTimeout(() => navigate("/auth/login"), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setEmailError("format");
      return;
    }
    setEmailError(null);
    setSending(true);
    try {
      await authService.resendVerification(value);
      navigate("/auth/check-email", {
        state: { email: value, mailSent: true },
      });
    } catch (err: unknown) {
      setEmailError(toApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      className="flex flex-col gap-5 text-center items-center w-full"
      aria-live="polite"
    >
      {status === "loading" && (
        <>
          <span
            className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
            role="status"
            aria-label={t("verify.verifying")}
          />
          <h1 className="text-2xl font-bold font-display text-text">
            {t("verify.verifyingTitle")}
          </h1>
        </>
      )}

      {(status === "verified" || status === "already") && (
        <>
          <img
            src="/loopi-hello.svg"
            width={120}
            height={120}
            alt=""
            draggable={false}
            className="select-none pointer-events-none"
          />
          <div>
            <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-accent mb-1 block">
              {status === "verified"
                ? t("verify.success")
                : t("verify.alreadyOverline")}
            </span>
            <h1 className="text-2xl sm:text-[28px] font-bold font-display text-text leading-tight mb-2">
              {status === "verified"
                ? t("verify.verifiedTitle")
                : t("verify.alreadyTitle")}
            </h1>
            <p className="text-[15px] text-text-muted mt-1 leading-relaxed">
              {status === "verified"
                ? t("verify.verifiedDesc")
                : t("verify.alreadyDesc")}
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/auth/login")}
          >
            {t("verify.login")}
          </Button>
        </>
      )}

      {status === "invalid_link" && (
        <>
          <FormAlert variant="warning" className="text-left w-full">
            {t("verify.invalidAlert")}
          </FormAlert>

          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold font-display text-text leading-tight mb-2">
              {t("verify.resendTitle")}
            </h1>
            <p className="text-[15px] text-text-muted mt-1 leading-relaxed">
              {t("verify.resendDesc")}
            </p>
          </div>

          <form
            className="flex w-full flex-col gap-3 text-left"
            onSubmit={handleResend}
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="vfEmail"
                className="text-[13px] font-semibold text-text"
              >
                {t("verify.email")}
              </label>
              <div
                className={`relative flex items-center h-11 px-3.5 rounded-md border bg-surface-glass text-text transition-colors duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
                  emailError
                    ? "border-danger focus-within:border-danger focus-within:ring-danger/20"
                    : "border-border"
                }`}
              >
                <Icon name="mail" className="text-lg text-text-subtle mr-2.5 shrink-0" />
                <input
                  id="vfEmail"
                  type="email"
                  autoComplete="email"
                  placeholder={t("verify.emailPlaceholder")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  className="w-full h-full bg-transparent border-0 outline-none text-text text-sm placeholder:text-text-subtle"
                />
              </div>
              {emailError && (
                <p className="text-xs font-medium text-danger mt-0.5">
                  {emailError === "format"
                    ? t("validation.emailFormat")
                    : errorMessage(emailError)}
                </p>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={sending}
              isLoading={sending}
            >
              {sending ? t("verify.sending") : t("verify.resend")}
            </Button>
          </form>

          <p className="text-[13px] text-text-muted">
            <Link
              to="/auth/login"
              className="text-accent hover:underline font-medium"
            >
              {t("verify.backToLogin")}
            </Link>
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <FormAlert variant="danger" className="text-left w-full">
            {verifyError && errorMessage(verifyError)}
          </FormAlert>
          <p className="text-[13px] text-text-muted">
            {t("verify.errorHint")}
          </p>
        </>
      )}
    </section>
  );
};

export default VerifyEmail;
