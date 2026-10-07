import { type PropsWithChildren } from "react";
import { useAuth } from "@/features/auth";
import { Navigate } from "react-router-dom";
import LoadingScreen from "@/components/common/LoadingScreen";

export type GuestGuardProps = PropsWithChildren & {};
const GuestGuard = ({ children }: GuestGuardProps) => {
  const { isAuthenticated, initialized } = useAuth();

  if (!initialized) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
export default GuestGuard;
