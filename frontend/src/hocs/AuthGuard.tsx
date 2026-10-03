import { type PropsWithChildren } from "react";
import useAuth from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export type AuthGuardProps = PropsWithChildren & {
  allowedRoles?: string[];
};

const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && user) {
    if (!user.role || !allowedRoles.map((r) => r.toLowerCase()).includes(user.role.toLowerCase())) {
      return <Navigate to="/" replace />;
    }
  }

  return <div>{children}</div>;
};

export default AuthGuard;
