import { type PropsWithChildren } from "react";
import { useAuth } from "@/features/auth";
import { Navigate, useLocation } from "react-router-dom";
import LoadingScreen from "@/components/common/LoadingScreen";

export type AuthGuardProps = PropsWithChildren & {
  allowedRoles?: string[];
};

const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
  const { isAuthenticated, initialized, user } = useAuth();
  const location = useLocation();

  // Chưa khôi phục xong phiên (F5): chưa quyết định được, tránh đá về /auth/login nhầm
  if (!initialized) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    if (!user.role || !allowedRoles.map((r) => r.toLowerCase()).includes(user.role.toLowerCase())) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default AuthGuard;
