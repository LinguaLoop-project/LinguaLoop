// Pages không export ở đây: routes.tsx nạp lazy theo đường dẫn để tách chunk.

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
  resetPasswordSchema,
} from "./validations/authSchemas";
export type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
} from "./validations/authSchemas";
