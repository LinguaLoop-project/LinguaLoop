import { type PropsWithChildren } from "react";
import { useAuth, homePathFor } from "@/features/auth";
import { Navigate } from "react-router-dom";
import LoadingScreen from "@/components/common/LoadingScreen";

export type GuestGuardProps = PropsWithChildren & {};
const GuestGuard = ({ children }: GuestGuardProps) => {
  const { isAuthenticated, initialized, user } = useAuth();

  if (!initialized) {
    return <LoadingScreen />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  return <>{children}</>;
};
export default GuestGuard;
