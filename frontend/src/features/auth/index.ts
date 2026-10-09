// Pages
export { default as Login } from "./pages/Login";
export { default as Register } from "./pages/Register";
export { default as ForgotPassword } from "./pages/ForgotPassword";
export { default as CheckEmail } from "./pages/CheckEmail";
export { default as VerifyEmail } from "./pages/VerifyEmail";
export { default as GoogleCallback } from "./pages/GoogleCallback";

// Components
export { default as AuthSidePanel } from "./components/AuthSidePanel";
export { default as AuthTopBar } from "./components/AuthTopBar";
export { default as GoogleSignInButton } from "./components/GoogleSignInButton";

// Store & Types
export { useAuthStore } from "./stores/authStore";
export type { MeResponse, AuthResponse, ApiError, ApiErrorBody, FieldError, Role } from "./types";
export type {
  User,
  AuthResponseData,
  AuthState,
  AuthActions,
} from "./stores/authStore";

// Config
export { getPwScore, isPwValid } from "./passwordStrength";
export { isGoogleConfigured } from "./googleConfig";

// Navigation
export { homePathFor, resolvePostLoginPath } from "./navigation";
export type { FromLocation } from "./navigation";

// Errors
export { toApiError, errorMessage, fieldErrorMessage, applyFieldErrors } from "./errors";

// Hooks
export { default as useAuth } from "./hooks/useAuth";

// Services
export { authService } from "./services/authService";

// Validation Schemas & Types
export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
} from "./validations/authSchemas";
export type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
} from "./validations/authSchemas";
