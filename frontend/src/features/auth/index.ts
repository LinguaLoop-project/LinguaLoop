// Pages
export { default as Login } from "./pages/Login";
export { default as Register } from "./pages/Register";
export { default as ForgotPassword } from "./pages/ForgotPassword";

// Components
export { default as AuthSidePanel } from "./components/AuthSidePanel";
export { default as AuthTopBar } from "./components/AuthTopBar";

// Store & Types
export { useAuthStore } from "./stores/authStore";
export type {
  User,
  AuthResponseData,
  AuthState,
  AuthActions,
} from "./stores/authStore";

// Hooks
export { default as useAuth } from "./hooks/useAuth";

// Services
export { authService } from "./services/authService";

// Validation Schemas & Types
export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  USER_RE,
} from "./validations/authSchemas";
export type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
} from "./validations/authSchemas";
