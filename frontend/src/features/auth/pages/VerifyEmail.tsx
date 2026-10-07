import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../services/authService";
import { errorMessage, toApiError } from "../errors";
import { EMAIL_RE } from "../validations/authSchemas";
import AuthSidePanel from "../components/AuthSidePanel";
import AuthTopBar from "../components/AuthTopBar";

type Status = "loading" | "verified" | "already" | "invalid" | "error";

const REDIRECT_DELAY_MS = 2000;

const headingStyle = {
  fontSize: 28,
  fontWeight: 700,
  fontFamily: "var(--font-display)",
  lineHeight: 1.2,
  marginBottom: 8,
} as const;

/** Đích của link trong thư xác thực: `/verify-email?token=...`. Nằm ngoài AuthLayout để người đã đăng nhập vẫn mở được. */
const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(token ? "loading" : "invalid");
  const [errorText, setErrorText] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Token chỉ dùng được một lần: chặn gọi API hai lần (React StrictMode chạy effect hai lần ở dev)
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    authService
      .verifyEmail(token)
      .then((response) => {
        setStatus(response.data.data.result === "VERIFIED" ? "verified" : "already");
      })
      .catch((err: unknown) => {
        const error = toApiError(err);
        if (error.code === "AUTH_LINK_INVALID") {
          setStatus("invalid");
        } else {
          setErrorText(errorMessage(error));
          setStatus("error");
        }
      });
  }, [token]);

  // Xác thực xong thì tự chuyển tới trang đăng nhập (AC-AUTH-28)
  useEffect(() => {
    if (status !== "verified") return;
    const timer = setTimeout(() => navigate("/auth/login"), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setEmailError("Email chưa đúng định dạng, ví dụ ban@email.com");
      return;
    }
    setEmailError(null);
    setSending(true);
    try {
      await authService.resendVerification(value);
      navigate("/auth/check-email", { state: { email: value, mailSent: true } });
    } catch (err: unknown) {
      setEmailError(errorMessage(toApiError(err)));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-layout" id="auth">
      <AuthSidePanel />

      <main className="auth-main">
        <AuthTopBar />

        <div className="auth-box">
          <section className="auth-form text-center items-center" style={{ maxWidth: 440 }} aria-live="polite">
            {status === "loading" && (
              <>
                <span
                  className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
                  role="status"
                  aria-label="Đang xác thực"
                />
                <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)" }}>
                  Đang xác thực email...
                </h1>
              </>
            )}

            {(status === "verified" || status === "already") && (
              <>
                <img src="/loopi-hello.svg" width={120} height={120} alt="" draggable={false} />
                <div>
                  <span className="ll-overline">{status === "verified" ? "Thành công" : "Đã xác thực"}</span>
                  <h1 style={headingStyle}>
                    {status === "verified" ? "Email đã được xác thực" : "Email này đã được xác thực rồi"}
                  </h1>
                  <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>
                    {status === "verified"
                      ? "Tài khoản của bạn đã sẵn sàng. Đang chuyển tới trang đăng nhập..."
                      : "Bạn không cần làm gì thêm, cứ đăng nhập để học tiếp."}
                  </p>
                </div>
                <Link to="/auth/login" className="ll-btn primary lg">
                  Đăng nhập
                </Link>
              </>
            )}

            {status === "invalid" && (
              <>
                <div>
                  <span className="ll-overline">Không dùng được</span>
                  <h1 style={headingStyle}>Liên kết không hợp lệ</h1>
                  <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>
                    Liên kết xác thực này sai, đã hết hạn hoặc đã được dùng. Nhập email để nhận liên kết mới.
                  </p>
                </div>

                <form className="flex w-full flex-col gap-3 text-left" onSubmit={handleResend} noValidate>
                  <div className={`ll-field ${emailError ? "bad" : ""}`}>
                    <label htmlFor="vfEmail" className="ll-label">
                      Email
                    </label>
                    <div className="ll-inp">
                      <i className="ph ph-envelope-simple" />
                      <input
                        id="vfEmail"
                        type="email"
                        autoComplete="email"
                        placeholder="ban@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {emailError && <p className="ll-err">{emailError}</p>}
                  </div>
                  <button type="submit" className="ll-btn primary lg full" disabled={sending}>
                    {sending ? "Đang gửi..." : "Gửi lại email xác thực"}
                  </button>
                </form>

                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                  <Link to="/auth/login" className="ll-link">
                    Về đăng nhập
                  </Link>
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="ll-form-alert danger text-left" role="alert">
                  <i className="ph ph-warning-circle" style={{ fontSize: 20, flexShrink: 0 }} />
                  <span>{errorText}</span>
                </div>
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                  Liên kết của bạn chưa bị dùng. Tải lại trang để thử lại.
                </p>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;
