import AuthLayout from "@/components/layouts/AuthLayout";
import MainLayout from "@/components/layouts/MainLayout";
import StudentLayout from "@/components/layouts/StudentLayout";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Login, Register, ForgotPassword, CheckEmail, VerifyEmail, ResetPassword, GoogleCallback } from "@/features/auth";
import { Settings } from "@/features/user";
import NotFound from "@/components/common/NotFound";
import { Navigate, useRoutes, type RouteObject } from "react-router-dom";
import { AuthGuard } from "@/app/guards";
import OnboardingPlaceholder from "@/app/placeholders/OnboardingPlaceholder";
import PlaceholderPage from "@/components/common/PlaceholderPage";

const getRoutesConfig = (): RouteObject[] => {
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
        { path: "login", element: <Login /> },
        { path: "register", element: <Register /> },
        { path: "check-email", element: <CheckEmail /> },
        { path: "forgot-password", element: <ForgotPassword /> },
        { path: "forgot", element: <ForgotPassword /> },
      ],
    },
    // Placeholder: trang thiết lập hồ sơ làm ở PR onboarding (UC-AUTH-08)
    {
      path: "onboarding",
      element: (
        <AuthGuard allowedRoles={["student"]}>
          <OnboardingPlaceholder />
        </AuthGuard>
      ),
    },
    // Đích Google chuyển về sau khi người dùng đồng ý (redirect URI khai trong Google Console)
    { path: "authenticate", element: <GoogleCallback /> },
    // Đích của link trong thư xác thực (backend gửi frontend-url + /verify-email?token=...)
    { path: "verify-email", element: <VerifyEmail /> },
    // Đích của link trong thư đặt lại mật khẩu (backend gửi frontend-url + /reset-password?token=...)
    { path: "reset-password", element: <ResetPassword /> },
    // ── Redirect shorthands ──
    { path: "login", element: <Navigate to="/auth/login" replace /> },
    { path: "register", element: <Navigate to="/auth/register" replace /> },
    {
      path: "forgot-password",
      element: <Navigate to="/auth/forgot-password" replace />,
    },
    {
      path: "forgot",
      element: <Navigate to="/auth/forgot-password" replace />,
    },
  ];

  // ── Student routes ──
  const studentRoutes: RouteObject[] = [
    {
      path: "student",
      element: (
        <AuthGuard allowedRoles={["student"]}>
          <StudentLayout />
        </AuthGuard>
      ),
      children: [
        {
          index: true,
          element: <PlaceholderPage pageKey="student.today" />,
        },
        {
          path: "lessons",
          element: <PlaceholderPage pageKey="student.lessons" />,
        },
        {
          path: "lessons/:id",
          element: <PlaceholderPage pageKey="student.lessonDetail" />,
        },
        {
          path: "dictation",
          element: <PlaceholderPage pageKey="student.dictation" />,
        },
        {
          path: "dictation/:id",
          element: <PlaceholderPage pageKey="student.dictationDetail" />,
        },
        {
          path: "shadowing",
          element: <PlaceholderPage pageKey="student.shadowing" />,
        },
        {
          path: "shadowing/:id",
          element: <PlaceholderPage pageKey="student.shadowingDetail" />,
        },
        {
          path: "vocab",
          element: <PlaceholderPage pageKey="student.vocab" />,
        },
        {
          path: "vocab/:deckId",
          element: <PlaceholderPage pageKey="student.deckDetail" />,
        },
        {
          path: "deck/:id",
          element: <PlaceholderPage pageKey="student.deckDetail" />,
        },
        {
          path: "topics",
          element: <PlaceholderPage pageKey="student.topics" />,
        },
        {
          path: "topics/:id",
          element: <PlaceholderPage pageKey="student.topicDetail" />,
        },
        {
          path: "mywords",
          element: <PlaceholderPage pageKey="student.mywords" />,
        },
        {
          path: "weakness",
          element: <PlaceholderPage pageKey="student.weakness" />,
        },
        {
          path: "test",
          element: <PlaceholderPage pageKey="student.test" />,
        },
        {
          path: "settings",
          element: <Settings />,
        },
        {
          path: "profile",
          element: <PlaceholderPage pageKey="student.profile" />,
        },
        {
          path: "notifications",
          element: <PlaceholderPage pageKey="student.notifications" />,
        },
        {
          path: "stats",
          element: <PlaceholderPage pageKey="student.stats" />,
        },
      ],
    },
  ];

  // ── Instructor routes ──
  const instructorRoutes: RouteObject[] = [
    {
      path: "instructor",
      element: (
        <AuthGuard allowedRoles={["instructor", "admin"]}>
          <InstructorLayout />
        </AuthGuard>
      ),
      children: [
        {
          index: true,
          element: <PlaceholderPage pageKey="instructor.overview" />,
        },
        {
          path: "topics",
          element: <PlaceholderPage pageKey="instructor.topics" />,
        },
        {
          path: "topics/:id",
          element: <PlaceholderPage pageKey="instructor.topicDetail" />,
        },
        {
          path: "lessons",
          element: <PlaceholderPage pageKey="instructor.lessons" />,
        },
        {
          path: "lessons/:id",
          element: <PlaceholderPage pageKey="instructor.lessonDetail" />,
        },
        {
          path: "compose",
          element: <PlaceholderPage pageKey="instructor.compose" />,
        },
        {
          path: "decks",
          element: <PlaceholderPage pageKey="instructor.decks" />,
        },
        {
          path: "decks/:id",
          element: <PlaceholderPage pageKey="instructor.deckDetail" />,
        },
        {
          path: "cefr",
          element: <PlaceholderPage pageKey="instructor.cefr" />,
        },
        {
          path: "dict",
          element: <PlaceholderPage pageKey="instructor.dict" />,
        },
        {
          path: "phoneme",
          element: <PlaceholderPage pageKey="instructor.phoneme" />,
        },
        {
          path: "qbank",
          element: <PlaceholderPage pageKey="instructor.qbank" />,
        },
        {
          path: "reports",
          element: <PlaceholderPage pageKey="instructor.reports" />,
        },
        {
          path: "reports/:id",
          element: <PlaceholderPage pageKey="instructor.reportDetail" />,
        },
        {
          path: "audit",
          element: <PlaceholderPage pageKey="instructor.audit" />,
        },
        {
          path: "classes",
          element: <PlaceholderPage pageKey="instructor.classes" />,
        },
        {
          path: "students",
          element: <PlaceholderPage pageKey="instructor.students" />,
        },
        {
          path: "progress",
          element: <PlaceholderPage pageKey="instructor.progress" />,
        },
        {
          path: "weakness",
          element: <PlaceholderPage pageKey="instructor.weakness" />,
        },
        {
          path: "settings",
          element: <Settings />,
        },
        {
          path: "profile",
          element: <PlaceholderPage pageKey="instructor.profile" />,
        },
      ],
    },
  ];

  // ── Admin routes ──
  const adminRoutes: RouteObject[] = [
    {
      path: "admin",
      element: (
        <AuthGuard allowedRoles={["admin"]}>
          <AdminLayout />
        </AuthGuard>
      ),
      children: [
        {
          index: true,
          element: <PlaceholderPage pageKey="admin.overview" />,
        },
        {
          path: "users",
          element: <PlaceholderPage pageKey="admin.users" />,
        },
        {
          path: "users/:id",
          element: <PlaceholderPage pageKey="admin.userDetail" />,
        },
        {
          path: "reports",
          element: <PlaceholderPage pageKey="admin.reports" />,
        },
        {
          path: "reports/:id",
          element: <PlaceholderPage pageKey="admin.reportDetail" />,
        },
        {
          path: "decks",
          element: <PlaceholderPage pageKey="admin.decks" />,
        },
        {
          path: "decks/:id",
          element: <PlaceholderPage pageKey="admin.deckDetail" />,
        },
        {
          path: "audit",
          element: <PlaceholderPage pageKey="admin.audit" />,
        },
        {
          path: "limits",
          element: <PlaceholderPage pageKey="admin.limits" />,
        },
        {
          path: "subs",
          element: <PlaceholderPage pageKey="admin.subs" />,
        },
        {
          path: "errors",
          element: <PlaceholderPage pageKey="admin.errors" />,
        },
        {
          path: "instructors",
          element: <PlaceholderPage pageKey="admin.instructors" />,
        },
        {
          path: "subscriptions",
          element: <PlaceholderPage pageKey="admin.subscriptions" />,
        },
        {
          path: "content",
          element: <PlaceholderPage pageKey="admin.content" />,
        },
        {
          path: "settings",
          element: <Settings />,
        },
        {
          path: "logs",
          element: <PlaceholderPage pageKey="admin.logs" />,
        },
        {
          path: "profile",
          element: <PlaceholderPage pageKey="admin.profile" />,
        },
        {
          path: "analytics",
          element: <PlaceholderPage pageKey="admin.analytics" />,
        },
      ],
    },
  ];

  const catchAll: RouteObject[] = [{ path: "*", element: <NotFound /> }];

  return [
    ...publicRoutes,
    ...studentRoutes,
    ...instructorRoutes,
    ...adminRoutes,
    ...catchAll,
  ];
};

export const AppRoutes = () => {
  return useRoutes(getRoutesConfig());
};

export default AppRoutes;

