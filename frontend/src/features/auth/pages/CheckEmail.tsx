import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { authService } from "../services/authService";
import { errorMessage, toApiError } from "../errors";
import type { ApiError } from "../types";
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";

const RESEND_COOLDOWN_MS = 60_000;

/** `mailSent`: true/false khi vừa đăng ký; null khi tới từ đăng nhập (chưa gửi thư nào). */
export type CheckEmailState = { email: string; mailSent: boolean | null };

const CheckEmail = () => {
  const { t } = useTranslation("auth");
  const location = useLocation();
  const state = location.state as Partial<CheckEmailState> | null;

  // Vừa gửi thư thì phải chờ 60 giây mới cho gửi lại (AC-AUTH-31); thư chưa gửi được thì cho gửi ngay
  const [cooldownEnd, setCooldownEnd] = useState(() =>
    state?.mailSent === true ? Date.now() + RESEND_COOLDOWN_MS : 0,
  );
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
  const introKey = mailFailed
    ? "checkEmail.mailFailed"
    : state?.mailSent === null
      ? "checkEmail.notVerified"
      : "checkEmail.sent";

  return (
    <section className="flex flex-col gap-5 text-center items-center w-full">
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
          {t("checkEmail.overline")}
        </span>
        <h1 className="text-2xl sm:text-[28px] font-bold font-display text-text leading-tight mb-2">
          {t("checkEmail.title")}
        </h1>
        <p className="text-[15px] text-text-muted mt-1 leading-relaxed">
          <Trans
            t={t}
            i18nKey={introKey}
            values={{ email }}
            components={{ b: <b className="text-text font-semibold" /> }}
            shouldUnescape
            tOptions={{ interpolation: { escapeValue: true } }}
          />
        </p>
      </div>

      {mailFailed && (
        <FormAlert variant="danger" className="text-left w-full">
          {t("checkEmail.mailFailedAlert")}
        </FormAlert>
      )}

      {resent && !error && (
        <FormAlert variant="success" className="text-left w-full">
          {t("checkEmail.resent")}
        </FormAlert>
      )}

      {error && (
        <FormAlert variant="danger" className="text-left w-full">
          {errorMessage(error)}
        </FormAlert>
      )}

      <Button
        variant="ghost"
        size="lg"
        onClick={handleResend}
        disabled={sending || secondsLeft > 0}
        isLoading={sending}
        leftIcon={<i className="ph ph-paper-plane-tilt" />}
      >
        {secondsLeft > 0
          ? t("checkEmail.resendIn", { seconds: secondsLeft })
          : t("checkEmail.resend")}
      </Button>

      <p className="text-[13px] text-text-muted">
        {t("checkEmail.wrongEmail")}{" "}
        <Link
          to="/auth/register"
          className="text-accent hover:underline font-medium"
        >
          {t("checkEmail.registerAgain")}
        </Link>
        {" · "}
        <Link
          to="/auth/login"
          className="text-accent hover:underline font-medium"
        >
          {t("checkEmail.backToLogin")}
        </Link>
      </p>
    </section>
  );
};

export default CheckEmail;
