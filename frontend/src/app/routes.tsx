import { lazy, Suspense } from "react";
import NotFound from "@/components/common/NotFound";
import { Navigate, useRoutes, type RouteObject } from "react-router-dom";
import { AuthGuard, GuestGuard } from "@/app/guards";
import OnboardingPlaceholder from "@/app/placeholders/OnboardingPlaceholder";
import PlaceholderPage from "@/components/common/PlaceholderPage";
import RouteErrorBoundary from "@/components/common/RouteErrorBoundary";
import LoadingScreen from "@/components/common/LoadingScreen";

// Mỗi layout/trang là một chunk riêng: người dùng chỉ tải phần mình cần
// (khách không phải tải layout admin, học viên không tải layout giáo viên...).
const AuthLayout = lazy(() => import("@/components/layouts/AuthLayout"));
const MainLayout = lazy(() => import("@/components/layouts/MainLayout"));
const StudentLayout = lazy(() => import("@/components/layouts/StudentLayout"));
const TeacherLayout = lazy(() => import("@/components/layouts/TeacherLayout"));
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
const MyWordsPage = lazy(() => import("@/features/practice/pages/MyWordsPage"));
const VocabPage = lazy(() => import("@/features/vocab/pages/VocabPage"));
const DeckPage = lazy(() => import("@/features/vocab/pages/DeckPage"));
const PartPage = lazy(() => import("@/features/vocab/pages/PartPage"));
const TeacherDeckListPage = lazy(() => import("@/features/vocab/pages/teacher/TeacherDeckListPage"));
const TeacherDeckCreatePage = lazy(() => import("@/features/vocab/pages/teacher/TeacherDeckCreatePage"));
const TeacherDeckDetailPage = lazy(() => import("@/features/vocab/pages/teacher/TeacherDeckDetailPage"));
const AdminDeckListPage = lazy(() => import("@/features/vocab/pages/admin/AdminDeckListPage"));
const AdminDeckDetailPage = lazy(() => import("@/features/vocab/pages/admin/AdminDeckDetailPage"));

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
          path: "lessons/:id",
          element: <LessonDetailPage />,
        },
        {
          path: "dictation",
          element: <LessonLibraryPage mode="dictation" />,
        },
        {
          path: "dictation/:id",
          element: <DictationPage />,
        },
        {
          path: "shadowing",
          element: <LessonLibraryPage mode="shadowing" />,
        },
        {
          path: "shadowing/:id",
          element: <ShadowingPage />,
        },
        {
          path: "vocab",
          element: <VocabPage />,
        },
        {
          path: "vocab/:deckId",
          element: <DeckPage />,
        },
        {
          path: "vocab/:deckId/parts/:part",
          element: <PartPage />,
        },
        {
          path: "deck/:id",
          element: <DeckPage />,
        },
        {
          path: "topics",
          element: <PlaceholderPage pageKey="student.topics" />,
        },
        {
          path: "topics/:id",
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

  // ── Teacher routes ──
  const teacherRoutes: RouteObject[] = [
    {
      path: "teacher",
      element: (
        <AuthGuard allowedRoles={["teacher", "admin"]}>
          <TeacherLayout />
        </AuthGuard>
      ),
      children: [
        {
          index: true,
          element: <PlaceholderPage pageKey="teacher.overview" />,
        },
        {
          path: "lessons",
          element: <PlaceholderPage pageKey="teacher.lessons" />,
        },
        {
          path: "lessons/:id",
          element: <PlaceholderPage pageKey="teacher.lessonDetail" />,
        },
        {
          path: "compose",
          element: <PlaceholderPage pageKey="teacher.compose" />,
        },
        {
          path: "decks",
          element: <TeacherDeckListPage />,
        },
        {
          path: "decks/new",
          element: <TeacherDeckCreatePage />,
        },
        {
          path: "decks/:id",
          element: <TeacherDeckDetailPage />,
        },
        {
          path: "reports",
          element: <PlaceholderPage pageKey="teacher.reports" />,
        },
        {
          path: "reports/:id",
          element: <PlaceholderPage pageKey="teacher.reportDetail" />,
        },
        {
          path: "settings",
          element: <Settings />,
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
          element: <AdminDeckListPage />,
        },
        {
          path: "decks/:id",
          element: <AdminDeckDetailPage />,
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
          path: "teachers",
          element: <PlaceholderPage pageKey="admin.teachers" />,
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
    ...teacherRoutes,
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

