import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuthStore } from "../stores/authStore";
import { loginSchema, type LoginFormData } from "../validations/authSchemas";
import { errorMessage, toApiError } from "../errors";
import GoogleSignInButton from "../components/GoogleSignInButton";
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";
import Checkbox from "@/components/common/Checkbox";
import Icon from "@/components/common/Icon";

export const Login = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  // Trang đặt lại mật khẩu chuyển về đây kèm state để báo thành công (AC-AUTH-35)
  const passwordReset = (useLocation().state as { passwordReset?: boolean } | null)?.passwordReset === true;
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  // Chỉ gợi ý đặt lại mật khẩu khi lỗi có thể do quên mật khẩu (sai nhiều lần / đang bị khoá)
  const [showResetHint, setShowResetHint] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
    mode: "onTouched",
  });

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    setShowResetHint(false);
    try {
      // Thành công thì GuestGuard (route cha) tự chuyển trang, kể cả quay lại trang đang mở dở
      await login({ email: data.email.trim(), password: data.password });
    } catch (err: unknown) {
      const apiError = toApiError(err);
      if (apiError.code === "AUTH_EMAIL_NOT_VERIFIED") {
        // Đúng mật khẩu nhưng chưa xác thực email: không cấp phiên, mời gửi lại thư (AC-AUTH-10)
        clearError();
        navigate("/auth/check-email", { state: { email: data.email.trim(), mailSent: null } });
        return;
      }
      setShowResetHint(apiError.code === "AUTH_INVALID_CREDENTIALS" || apiError.code === "AUTH_ACCOUNT_LOCKED");
      // Câu lỗi hiển thị lấy từ store
    }
  };

  return (
    <form
      className="flex flex-col gap-5 w-full"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {/* Heading */}
      <div>
        <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-accent mb-1 block">
          {t("login.overline")}
        </span>
        <h1 className="text-2xl sm:text-[28px] font-bold font-display text-text leading-tight mb-2">
          {t("login.title")}
        </h1>
        <p className="text-[15px] text-text-muted mt-1">
          {t("login.subtitle")}
        </p>
      </div>

      {passwordReset && !error && (
        <FormAlert variant="success">
          {t("login.passwordResetNotice")}
        </FormAlert>
      )}

      {/* API error alert */}
      {error && (
        <FormAlert variant="danger">
          {errorMessage(error)}
          {showResetHint && (
            <>
              {" "}
              <Link
                to="/auth/forgot-password"
                className="text-accent underline font-medium"
              >
                {t("login.resetPassword")}
              </Link>
            </>
          )}
        </FormAlert>
      )}

      {/* Google + "or" divider (ẩn khi chưa có client ID) */}
      <GoogleSignInButton />

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="liEmail"
          className="text-[13px] font-semibold text-text"
        >
          {t("login.email")}
        </label>
        <div
          className={`relative flex items-center h-11 px-3.5 rounded-md border bg-surface-glass text-text transition-colors duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
            errors.email
              ? "border-danger focus-within:border-danger focus-within:ring-danger/20"
              : "border-border"
          }`}
        >
          <Icon name="mail" className="text-lg text-text-subtle mr-2.5 shrink-0" />
          <input
            id="liEmail"
            type="email"
            autoComplete="email"
            placeholder={t("login.emailPlaceholder")}
            aria-describedby="liEmailErr"
            className="w-full h-full bg-transparent border-0 outline-none text-text text-sm placeholder:text-text-subtle"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p
            id="liEmailErr"
            className="text-xs font-medium text-danger mt-0.5"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label
            htmlFor="liPw"
            className="text-[13px] font-semibold text-text"
          >
            {t("login.password")}
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-accent hover:underline text-[13px] font-medium transition-colors"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>
        <div
          className={`relative flex items-center h-11 px-3.5 rounded-md border bg-surface-glass text-text transition-colors duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
            errors.password
              ? "border-danger focus-within:border-danger focus-within:ring-danger/20"
              : "border-border"
          }`}
        >
          <Icon name="lock" className="text-lg text-text-subtle mr-2.5 shrink-0" />
          <input
            id="liPw"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={t("login.passwordPlaceholder")}
            aria-describedby="liPwErr"
            className="w-full h-full bg-transparent border-0 outline-none text-text text-sm placeholder:text-text-subtle"
            {...register("password")}
          />
          <button
            type="button"
            className="shrink-0 p-1 text-lg text-text-subtle hover:text-text cursor-pointer transition-colors border-0 bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={
              showPassword
                ? t("login.hidePassword")
                : t("login.showPassword")
            }
            aria-pressed={showPassword}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} />
          </button>
        </div>
        {errors.password && (
          <p
            id="liPwErr"
            className="text-xs font-medium text-danger mt-0.5"
          >
            {errors.password.message as string}
          </p>
        )}
      </div>

      {/* Remember me */}
      <Checkbox
        id="liRemember"
        label={t("login.remember")}
        {...register("remember")}
      />

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={loading}
        isLoading={loading}
      >
        {t("login.submit")}
      </Button>

      {/* Register link */}
      <p className="text-center text-[13px] text-text-muted">
        {t("login.noAccount")}{" "}
        <Link
          to="/auth/register"
          className="text-accent hover:underline font-medium"
        >
          {t("login.registerFree")}
        </Link>
      </p>
    </form>
  );
};

export default Login;
