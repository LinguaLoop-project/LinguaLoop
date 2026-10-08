import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { authService } from "../services/authService";
import { errorMessage, toApiError } from "../errors";
import type { ApiError } from "../types";
import AuthSidePanel from "../components/AuthSidePanel";
import AuthTopBar from "../components/AuthTopBar";

const RESEND_COOLDOWN_MS = 60_000;

/** `mailSent`: true/false khi vừa đăng ký; null khi tới từ đăng nhập (chưa gửi thư nào). */
export type CheckEmailState = { email: string; mailSent: boolean | null };

const CheckEmail = () => {
  const { t } = useTranslation("auth");
  const location = useLocation();
  const state = location.state as Partial<CheckEmailState> | null;

  // Vừa gửi thư thì phải chờ 60 giây mới cho gửi lại (AC-AUTH-31); thư chưa gửi được thì cho gửi ngay
  const [cooldownEnd, setCooldownEnd] = useState(() => (state?.mailSent === true ? Date.now() + RESEND_COOLDOWN_MS : 0));
  const [now, setNow] = useState(() => Date.now());
  const [sending, setSending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const secondsLeft = Math.max(0, Math.ceil((cooldownEnd - now) / 1000));

  useEffect(() => {
    if (cooldownEnd <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [cooldownEnd]);

  const email = state?.email;
  if (!email) {
    // Mở thẳng trang này mà không có email thì không biết gửi cho ai
    return <Navigate to="/auth/register" replace />;
  }

  const handleResend = async () => {
    setSending(true);
    setError(null);
    try {
      await authService.resendVerification(email);
      setResent(true);
      setNow(Date.now());
      setCooldownEnd(Date.now() + RESEND_COOLDOWN_MS);
    } catch (err: unknown) {
      setError(toApiError(err));
    } finally {
      setSending(false);
    }
  };

  const mailFailed = state?.mailSent === false;

  return (
    <div className="auth-layout" id="auth">
      <AuthSidePanel />

      <main className="auth-main">
        <AuthTopBar />

        <div className="auth-box">
          <section className="auth-form text-center items-center" style={{ maxWidth: 440 }}>
            <img src="/loopi-hello.svg" width={120} height={120} alt="" draggable={false} />

            <div>
              <span className="ll-overline">{t("checkEmail.overline")}</span>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}
              >
                {t("checkEmail.title")}
              </h1>
              {mailFailed ? (
                <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>
                  <Trans
                    t={t}
                    i18nKey="checkEmail.mailFailed"
                    values={{ email }}
                    components={{ b: <b /> }}
                    shouldUnescape tOptions={{ interpolation: { escapeValue: true } }}
                  />
                </p>
              ) : state?.mailSent === null ? (
                <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>
                  <Trans
                    t={t}
                    i18nKey="checkEmail.notVerified"
                    values={{ email }}
                    components={{ b: <b /> }}
                    shouldUnescape tOptions={{ interpolation: { escapeValue: true } }}
                  />
                </p>
              ) : (
                <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>
                  <Trans
                    t={t}
                    i18nKey="checkEmail.sent"
                    values={{ email }}
                    components={{ b: <b /> }}
                    shouldUnescape tOptions={{ interpolation: { escapeValue: true } }}
                  />
                </p>
              )}
            </div>

            {mailFailed && (
              <div className="ll-form-alert danger text-left" role="alert">
                <i className="ph ph-warning-circle" style={{ fontSize: 20, flexShrink: 0 }} />
                <span>{t("checkEmail.mailFailedAlert")}</span>
              </div>
            )}

            {resent && !error && (
              <div className="ll-form-alert success text-left" role="status">
                <i className="ph ph-check-circle" style={{ fontSize: 20, flexShrink: 0 }} />
                <span>{t("checkEmail.resent")}</span>
              </div>
            )}

            {error && (
              <div className="ll-form-alert danger text-left" role="alert">
                <i className="ph ph-warning-circle" style={{ fontSize: 20, flexShrink: 0 }} />
                <span>{errorMessage(error)}</span>
              </div>
            )}

            <button
              type="button"
              className="ll-btn ghost lg"
              onClick={handleResend}
              disabled={sending || secondsLeft > 0}
            >
              <i className="ph ph-paper-plane-tilt" />
              {sending
                ? t("checkEmail.sending")
                : secondsLeft > 0
                  ? t("checkEmail.resendIn", { seconds: secondsLeft })
                  : t("checkEmail.resend")}
            </button>

            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {t("checkEmail.wrongEmail")}{" "}
              <Link to="/auth/register" className="ll-link">
                {t("checkEmail.registerAgain")}
              </Link>
              {" · "}
              <Link to="/auth/login" className="ll-link">
                {t("checkEmail.backToLogin")}
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CheckEmail;
