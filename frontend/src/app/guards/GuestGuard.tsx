import { type PropsWithChildren } from "react";
import { useAuth, resolvePostLoginPath, type FromLocation } from "@/features/auth";
import { Navigate, useLocation } from "react-router-dom";
import LoadingScreen from "@/components/common/LoadingScreen";

export type GuestGuardProps = PropsWithChildren & {};
const GuestGuard = ({ children }: GuestGuardProps) => {
  const { isAuthenticated, initialized, user } = useAuth();
  const location = useLocation();

  if (!initialized) {
    return <LoadingScreen />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={resolvePostLoginPath(user, (location.state as { from?: FromLocation } | null)?.from)} replace />;
  }

  return <>{children}</>;
};
export default GuestGuard;
