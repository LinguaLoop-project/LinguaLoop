import AuthLayout from "@/components/layouts/AuthLayout";
import MainLayout from "@/components/layouts/MainLayout";
import { Login, Register, ForgotPassword } from "@/features/auth";
import NotFound from "@/components/common/NotFound";
import { Navigate, type RouteObject } from "react-router-dom";

export const getRoutes = (): RouteObject[] => {
  const role = "ADMIN";

  const publicRoutes: RouteObject[] = [
    {
      path: "/",
      element: <MainLayout />,
      children: [
        {
          index: true,
          element: <div>Home</div>,
        },
      ],
    },
    {
      path: "auth",
      element: <AuthLayout />,
      children: [
        {
          path: "login",
          element: <Login />,
        },
        {
          path: "register",
          element: <Register />,
        },
        {
          path: "forgot-password",
          element: <ForgotPassword />,
        },
        {
          path: "forgot",
          element: <ForgotPassword />,
        },
        {
          path: "logout",
        },
      ],
    },
    {
      path: "login",
      element: <Navigate to="/auth/login" replace />,
    },
    {
      path: "register",
      element: <Navigate to="/auth/register" replace />,
    },
    {
      path: "forgot-password",
      element: <Navigate to="/auth/forgot-password" replace />,
    },
    {
      path: "forgot",
      element: <Navigate to="/auth/forgot-password" replace />,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ];

  const adminRoutes: RouteObject[] = [];

  switch (role) {
    case "ADMIN":
      return [...publicRoutes, ...adminRoutes];
    default:
      return publicRoutes;
  }
};
