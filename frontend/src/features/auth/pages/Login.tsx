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
import { PasswordField, TextField } from "@/components/common/TextField";

export const Login = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  // Trang đặt lại mật khẩu chuyển về đây kèm state để báo thành công (AC-AUTH-35)
  const passwordReset = (useLocation().state as { passwordReset?: boolean } | null)?.passwordReset === true;

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
        <span className="block text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text">
          {t("login.overline")}
        </span>
        <h1 className="text-[30px] font-bold leading-[48px] text-text">
          {t("login.title")}
        </h1>
        <p className="text-[15px] text-text-muted">
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
                className="font-semibold text-primary-text underline"
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
      <TextField
        id="liEmail"
        label={t("login.email")}
        icon="mail"
        type="email"
        autoComplete="email"
        placeholder={t("login.emailPlaceholder")}
        error={errors.email?.message}
        {...register("email")}
      />

      {/* Password */}
      <PasswordField
        id="liPw"
        label={t("login.password")}
        autoComplete="current-password"
        placeholder={t("login.passwordPlaceholder")}
        showLabel={t("login.showPassword")}
        hideLabel={t("login.hidePassword")}
        labelAside={
          <Link to="/auth/forgot-password" className="text-primary-text hover:underline text-[13px] font-medium transition-colors">
            {t("login.forgotPassword")}
          </Link>
        }
        error={errors.password?.message as string | undefined}
        {...register("password")}
      />

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
          className="font-semibold text-primary-text hover:underline"
        >
          {t("login.registerFree")}
        </Link>
      </p>
    </form>
  );
};

export default Login;
