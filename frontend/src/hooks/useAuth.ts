import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/modules/auth/services/authService";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logoutState = useAuthStore((state) => state.logout);
  const clearErrorState = useAuthStore((state) => state.clearError);
  const initAuthState = useAuthStore((state) => state.initAuth);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Dù logout API lỗi vẫn xóa state cục bộ
    } finally {
      logoutState();
      queryClient.clear();
      navigate("/auth/login");
    }
  };

  const handleClearError = () => clearErrorState();

  const handleInitAuth = () => initAuthState();

  return {
    isAuthenticated,
    user,
    loading,
    error,
    accessToken,
    handleLogout,
    handleClearError,
    handleInitAuth,
  };
};

export default useAuth;
