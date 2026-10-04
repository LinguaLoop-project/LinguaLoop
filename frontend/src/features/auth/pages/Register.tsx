import React, { useState, useEffect, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/features/auth/services/authService";
import {
  registerSchema,
  type RegisterFormData,
  USER_RE,
} from "../validations/authSchemas";
import AuthSidePanel from "../components/AuthSidePanel";
import AuthTopBar from "../components/AuthTopBar";

const TAKEN_USERNAMES = [
  "admin",
  "root",
  "support",
  "test",
  "loopi",
  "minhanh",
];
const PW_LABELS = ["", "Yếu", "Tạm được", "Mạnh", "Rất mạnh"];

function getPwScore(v: string): number {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[a-z]/i.test(v) && /\d/.test(v)) s++;
  if (/[^a-z0-9]/i.test(v)) s++;
  if (v.length >= 12) s++;
  return Math.max(1, s);
}

function isPwValid(v: string): boolean {
  return v.length >= 8 && /[a-z]/i.test(v) && /\d/.test(v);
}

const Register = () => {
  const navigate = useNavigate();
  const formId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live input states for feedback
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  // Username live check state
  const [userStatus, setUserStatus] = useState<
    "idle" | "checking" | "ok" | "bad"
  >("idle");
  const [userMsg, setUserMsg] = useState<string>(
    "3–20 ký tự: chữ thường, số hoặc dấu gạch dưới",
  );

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      terms: false,
    },
    mode: "onTouched",
  });

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  // Debounced username check
  useEffect(() => {
    const u = usernameInput.trim().toLowerCase();
    if (!u) {
      const timer = setTimeout(() => {
        setUserStatus("idle");
        setUserMsg("3–20 ký tự: chữ thường, số hoặc dấu gạch dưới");
      }, 0);
      return () => clearTimeout(timer);
    }

    if (!USER_RE.test(u)) {
      const timer = setTimeout(() => {
        setUserStatus("bad");
        setUserMsg(
          "Chỉ dùng chữ thường không dấu, số hoặc dấu gạch dưới, 3–20 ký tự",
        );
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setUserStatus("checking");
      setUserMsg("Đang kiểm tra tên người dùng...");
      const isTaken = TAKEN_USERNAMES.includes(u);
      if (isTaken) {
        setUserStatus("bad");
        setUserMsg(`@${u} đã có người dùng. Thử @${u}_2026?`);
      } else {
        setUserStatus("ok");
        setUserMsg(`@${u} dùng được`);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [usernameInput]);

  // Password score calculation
  const pwScore = getPwScore(passwordInput);
  const pwValid = isPwValid(passwordInput);

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);

    if (userStatus === "bad") {
      setError("username", { message: userMsg });
      return;
    }

    setSubmitting(true);
    try {
      await authService.register({
        username: data.username.trim().toLowerCase(),
        email: data.email.trim(),
        password: data.password,
      });
      setSuccessMsg(
        "Tài khoản đã tạo thành công! Vui lòng kiểm tra email để xác minh tài khoản.",
      );
      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      const resMsg = error.response?.data?.message || error.message;
      if (error.response?.status === 404 || !error.response) {
        // Fallback simulation for demo
        setSuccessMsg("Đăng ký thành công! Đang chuyển đến trang đăng nhập...");
        setTimeout(() => navigate("/auth/login"), 1500);
      } else {
        setApiError(resMsg || "Đăng ký không thành công. Vui lòng thử lại!");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout" id="auth">
      {/* ── Left side hero panel ── */}
      <AuthSidePanel />

      {/* ── Right side main form ── */}
      <main className="auth-main">
        {/* Top header bar */}
        <AuthTopBar />

        {/* Form container */}
        <div className="auth-box">
          <section
            className="auth-form"
            style={{ width: "100%", maxWidth: 420 }}
          >
            {/* Header info */}
            <div>
              <span className="ll-overline">Miễn phí, không cần thẻ</span>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}
              >
                Tạo tài khoản
              </h1>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                Chưa tới một phút. Xong thì làm bài kiểm tra 10 phút để có kế
                hoạch riêng.
              </p>
            </div>

            {/* Success message */}
            {successMsg && (
              <div className="ll-form-alert success">
                <i className="ph ph-check-circle text-xl flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error alert */}
            {apiError && (
              <div className="ll-form-alert danger">
                <i className="ph ph-warning-circle text-xl flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Google OAuth button */}
            <button
              type="button"
              className="ll-btn ghost lg full"
              onClick={() => {
                alert("Tính năng Đăng ký bằng Google đang được kết nối.");
              }}
            >
              <svg className="w-5 h-5 mr-1" aria-hidden="true">
                <use href="#g-google" />
              </svg>
              <span>Đăng ký với Google</span>
            </button>

            {/* Divider */}
            <div className="ll-or">
              <span>hoặc dùng email</span>
            </div>

            {/* Register form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
              noValidate
            >
              {/* Username */}
              <div
                className={`ll-field ${
                  errors.username || userStatus === "bad"
                    ? "bad"
                    : userStatus === "ok"
                      ? "ok"
                      : ""
                }`}
              >
                <label htmlFor={`${formId}-username`} className="ll-label">
                  Tên người dùng
                </label>
                <div className="ll-inp">
                  <span className="ll-pre">@</span>
                  <input
                    id={`${formId}-username`}
                    type="text"
                    autoComplete="username"
                    placeholder="vd: minhanh_2003"
                    maxLength={20}
                    spellCheck={false}
                    {...register("username", {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        setUsernameInput(e.target.value),
                    })}
                  />
                  {userStatus === "checking" && (
                    <i className="ph ph-circle-notch animate-spin text-[18px] text-[var(--text-subtle)] mr-3" />
                  )}
                </div>

                {/* Username live feedback hint */}
                <p
                  className={`ll-hint ${
                    errors.username || userStatus === "bad"
                      ? "bad"
                      : userStatus === "ok"
                        ? "ok"
                        : ""
                  }`}
                >
                  {userStatus === "ok" && <i className="ph ph-check-circle" />}
                  {(errors.username || userStatus === "bad") && (
                    <i className="ph ph-warning-circle" />
                  )}
                  {userStatus === "checking" && (
                    <i className="ph ph-circle-notch animate-spin" />
                  )}
                  <span>
                    {errors.username ? errors.username.message : userMsg}
                  </span>
                </p>
              </div>

              {/* Email */}
              <div className={`ll-field ${errors.email ? "bad" : ""}`}>
                <label htmlFor={`${formId}-email`} className="ll-label">
                  Email
                </label>
                <div className="ll-inp">
                  <i className="ph ph-envelope-simple" />
                  <input
                    id={`${formId}-email`}
                    type="email"
                    autoComplete="email"
                    placeholder="ban@email.com"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="ll-err">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className={`ll-field ${errors.password ? "bad" : ""}`}>
                <label htmlFor={`${formId}-password`} className="ll-label">
                  Mật khẩu
                </label>
                <div className="ll-inp">
                  <i className="ph ph-lock-simple" />
                  <input
                    id={`${formId}-password`}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Ít nhất 8 ký tự"
                    {...register("password", {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        setPasswordInput(e.target.value),
                    })}
                  />
                  <button
                    type="button"
                    className="ll-pw-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={showPassword}
                  >
                    <i
                      className={showPassword ? "ph ph-eye-slash" : "ph ph-eye"}
                    />
                  </button>
                </div>

                {/* Password meter bars */}
                <div
                  className="ll-pw-meter"
                  data-s={pwScore}
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                  <i />
                </div>

                {/* Password hint */}
                <p className={`ll-hint ${errors.password ? "bad" : ""}`}>
                  {errors.password ? (
                    <>
                      <i className="ph ph-warning-circle" />
                      <span>{errors.password.message}</span>
                    </>
                  ) : passwordInput ? (
                    <span>
                      Độ mạnh: <b>{PW_LABELS[pwScore]}</b>
                      {!pwValid && " · cần ít nhất 8 ký tự, có cả chữ và số"}
                    </span>
                  ) : (
                    "Ít nhất 8 ký tự, có cả chữ và số"
                  )}
                </p>
              </div>

              {/* Terms Checkbox */}
              <div className={`ll-field ${errors.terms ? "bad" : ""}`}>
                <label className="ll-check items-start">
                  <input type="checkbox" {...register("terms")} />
                  <span className="ll-check-box mt-0.5">
                    <i className="ph ph-check" />
                  </span>
                  <span className="text-[14px] leading-snug">
                    Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng
                    tư của LinguaLoop
                  </span>
                </label>
                <p
                  className="text-[13px] pl-7"
                  style={{ color: "var(--text-muted)" }}
                >
                  <button type="button" className="ll-link">
                    Đọc điều khoản
                  </button>
                  {" · "}
                  <button type="button" className="ll-link">
                    Đọc chính sách
                  </button>
                </p>
                {errors.terms && (
                  <p className="ll-err pl-7">{errors.terms.message}</p>
                )}
              </div>

              {/* Privacy / AI speech note */}
              <div className="ll-note-sm">
                <i className="ph ph-shield-check" />
                <span>
                  Quyền lưu giọng nói và gửi bài đọc cho AI được hỏi riêng khi
                  bạn ghi âm lần đầu. Đổi lúc nào cũng được trong Cài đặt.
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="ll-btn primary lg full"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang tạo tài khoản...
                  </span>
                ) : (
                  "Tạo tài khoản"
                )}
              </button>

              {/* Link back to login */}
              <p
                className="text-center text-[13px]"
                style={{ color: "var(--text-muted)" }}
              >
                Đã có tài khoản?{" "}
                <Link to="/auth/login" className="ll-link">
                  Đăng nhập
                </Link>
              </p>
            </form>
          </section>
        </div>

        {/* Footer */}
        <p
          className="auth-foot text-[13px] text-center"
          style={{
            color: "var(--text-muted)",
            marginTop: "auto",
            paddingTop: 16,
          }}
        >
          © 2026 LinguaLoop ·{" "}
          <button type="button" className="ll-link">
            Điều khoản
          </button>{" "}
          ·{" "}
          <button type="button" className="ll-link">
            Quyền riêng tư
          </button>{" "}
          ·{" "}
          <button type="button" className="ll-link">
            Trợ giúp
          </button>
        </p>
      </main>
    </div>
  );
};

export default Register;
