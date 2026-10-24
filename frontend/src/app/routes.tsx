import { lazy, Suspense } from "react";
import NotFound from "@/components/common/NotFound";
import { Navigate, useRoutes, type RouteObject } from "react-router-dom";
import { AuthGuard, GuestGuard } from "@/app/guards";
import OnboardingPlaceholder from "@/app/placeholders/OnboardingPlaceholder";
import PlaceholderPage from "@/components/common/PlaceholderPage";
import RouteErrorBoundary from "@/components/common/RouteErrorBoundary";
import LoadingScreen from "@/components/common/LoadingScreen";

// Mỗi layout/trang là một chunk riêng: người dùng chỉ tải phần mình cần
// (khách không phải tải layout admin, học viên không tải layout giảng viên...).
const AuthLayout = lazy(() => import("@/components/layouts/AuthLayout"));
const MainLayout = lazy(() => import("@/components/layouts/MainLayout"));
const StudentLayout = lazy(() => import("@/components/layouts/StudentLayout"));
const InstructorLayout = lazy(() => import("@/components/layouts/InstructorLayout"));
const AdminLayout = lazy(() => import("@/components/layouts/AdminLayout"));

const Login = lazy(() => import("@/features/auth/pages/Login"));
const Register = lazy(() => import("@/features/auth/pages/Register"));
const ForgotPassword = lazy(() => import("@/features/auth/pages/ForgotPassword"));
const CheckEmail = lazy(() => import("@/features/auth/pages/CheckEmail"));
const VerifyEmail = lazy(() => import("@/features/auth/pages/VerifyEmail"));
const ResetPassword = lazy(() => import("@/features/auth/pages/ResetPassword"));
const GoogleCallback = lazy(() => import("@/features/auth/pages/GoogleCallback"));

const Settings = lazy(() => import("@/features/user/pages/Settings"));

const LessonLibraryPage = lazy(() =>
  import("@/features/lesson/pages/LessonLibraryPage").then((m) => ({ default: m.LessonLibraryPage })),
);
const LessonDetailPage = lazy(() =>
  import("@/features/lesson/pages/LessonDetailPage").then((m) => ({ default: m.LessonDetailPage })),
);
const TopicDetailPage = lazy(() =>
  import("@/features/lesson/pages/TopicDetailPage").then((m) => ({ default: m.TopicDetailPage })),
);
const DictationPage = lazy(() => import("@/features/dictation/pages/DictationPage"));
const MyWordsPage = lazy(() => import("@/features/mywords/pages/MyWordsPage"));

const ShadowingPage = lazy(() => import("@/features/shadowing/pages/ShadowingPage"));

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
      element: (
        <GuestGuard>
          <AuthLayout />
        </GuestGuard>
      ),
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
    // Đích của link trong thư xác thực và thư đặt lại mật khẩu (backend gửi frontend-url + /verify-email?token=..., /reset-password?token=...).
    // Không bọc GuestGuard để người đã đăng nhập vẫn mở được link.
    {
      element: <AuthLayout />,
      children: [
        { path: "verify-email", element: <VerifyEmail /> },
        { path: "reset-password", element: <ResetPassword /> },
      ],
    },
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
          element: <LessonLibraryPage />,
        },
        {
          path: "lessons/:slug",
          element: <LessonDetailPage />,
        },
        {
          path: "dictation",
          element: <LessonLibraryPage mode="dictation" />,
        },
        {
          path: "dictation/:slug",
          element: <DictationPage />,
        },
        {
          path: "shadowing",
          element: <LessonLibraryPage mode="shadowing" />,
        },
        {
          path: "shadowing/:slug",
          element: <ShadowingPage />,
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
          path: "topics/:slug",
          element: <TopicDetailPage />,
        },
        {
          path: "mywords",
          element: <MyWordsPage />,
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
  const element = useRoutes(getRoutesConfig());
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>{element}</Suspense>
    </RouteErrorBoundary>
  );
};

export default AppRoutes;

