import { lazy, Suspense } from "react";
import NotFound from "@/components/common/NotFound";
import { Navigate, useRoutes, type RouteObject } from "react-router-dom";
import { AuthGuard, GuestGuard } from "@/app/guards";
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
const OnboardingPage = lazy(() => import("@/features/user/pages/OnboardingPage"));
const TodayPage = lazy(() => import("@/features/review/pages/TodayPage"));
const DailyReviewPage = lazy(() => import("@/features/review/pages/DailyReviewPage"));
const SentenceReviewPage = lazy(() => import("@/features/review/pages/SentenceReviewPage"));

const LessonLibraryPage = lazy(() =>
  import("@/features/lesson/pages/LessonLibraryPage").then((m) => ({ default: m.LessonLibraryPage })),
);
const LessonDetailPage = lazy(() =>
  import("@/features/lesson/pages/LessonDetailPage").then((m) => ({ default: m.LessonDetailPage })),
);
const AiChatPage = lazy(() => import("@/features/aichat/pages/AiChatPage"));
const TopicDetailPage = lazy(() =>
  import("@/features/lesson/pages/TopicDetailPage").then((m) => ({ default: m.TopicDetailPage })),
);
const DictationPage = lazy(() => import("@/features/dictation/pages/DictationPage"));
const MyWordsPage = lazy(() => import("@/features/practice/pages/MyWordsPage"));
const VocabPage = lazy(() => import("@/features/vocab/pages/VocabPage"));
const StatsPage = lazy(() => import("@/features/stats/pages/StatsPage"));
const WeaknessPage = lazy(() => import("@/features/stats/pages/WeaknessPage"));
const DeckPage = lazy(() => import("@/features/vocab/pages/DeckPage"));
const PartPage = lazy(() => import("@/features/vocab/pages/PartPage"));
const MyDeckDetailPage = lazy(() => import("@/features/vocab/pages/MyDeckDetailPage"));
const TeacherDeckListPage = lazy(() => import("@/features/vocab/pages/teacher/TeacherDeckListPage"));
const TeacherDeckCreatePage = lazy(() => import("@/features/vocab/pages/teacher/TeacherDeckCreatePage"));
const TeacherDeckDetailPage = lazy(() => import("@/features/vocab/pages/teacher/TeacherDeckDetailPage"));
const AdminDeckListPage = lazy(() => import("@/features/vocab/pages/admin/AdminDeckListPage"));
const AdminDeckDetailPage = lazy(() => import("@/features/vocab/pages/admin/AdminDeckDetailPage"));
const TeacherLessonListPage = lazy(() => import("@/features/lesson/pages/teacher/TeacherLessonListPage"));
const TeacherLessonDetailPage = lazy(() => import("@/features/lesson/pages/teacher/TeacherLessonDetailPage"));
const AdminLessonListPage = lazy(() => import("@/features/lesson/pages/admin/AdminLessonListPage"));
const AdminLessonDetailPage = lazy(() => import("@/features/lesson/pages/admin/AdminLessonDetailPage"));

const TeacherReportListPage = lazy(() => import("@/features/report/pages/teacher/TeacherReportListPage"));
const TeacherReportDetailPage = lazy(() => import("@/features/report/pages/teacher/TeacherReportDetailPage"));
const AdminUserListPage = lazy(() => import("@/features/user/pages/admin/AdminUserListPage"));
const AdminUserDetailPage = lazy(() => import("@/features/user/pages/admin/AdminUserDetailPage"));
const AdminCreditConfigPage = lazy(() => import("@/features/credit/pages/admin/AdminCreditConfigPage"));
const AdminProPlanPage = lazy(() => import("@/features/subscription/pages/admin/AdminProPlanPage"));
const AdminContentTransferPage = lazy(() => import("@/features/user/pages/admin/AdminContentTransferPage"));
const AdminReportListPage = lazy(() => import("@/features/report/pages/admin/AdminReportListPage"));
const AdminReportDetailPage = lazy(() => import("@/features/report/pages/admin/AdminReportDetailPage"));
const AdminRepublishListPage = lazy(() => import("@/features/report/pages/admin/AdminRepublishListPage"));
const AdminRepublishDetailPage = lazy(() => import("@/features/report/pages/admin/AdminRepublishDetailPage"));

const SavedLessonsPage = lazy(() => import("@/features/lesson/pages/SavedLessonsPage"));
const WatchPage = lazy(() => import("@/features/watch/pages/WatchPage"));
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
    // Thiết lập hồ sơ học tập sau lần đăng nhập đầu tiên (UC-TK-08)
    {
      path: "onboarding",
      element: (
        <AuthGuard allowedRoles={["student"]}>
          <AuthLayout />
        </AuthGuard>
      ),
      children: [{ index: true, element: <OnboardingPage /> }],
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
          element: <TodayPage />,
        },
        {
          path: "review/daily",
          element: <DailyReviewPage />,
        },
        {
          path: "review/sentences",
          element: <SentenceReviewPage />,
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
          path: "saved-lessons",
          element: <SavedLessonsPage />,
        },
        {
          path: "lessons/:id/ai",
          element: <AiChatPage />,
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
          path: "vocab/mine/:deckId",
          element: <MyDeckDetailPage />,
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
          element: <WeaknessPage />,
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
          element: <StatsPage />,
        },
      ],
    },
  ];

  // Học thụ động: toàn màn hình, nằm ngoài khung StudentLayout nhưng vẫn chỉ cho học viên.
  const watchRoutes: RouteObject[] = [
    {
      path: "watch",
      element: (
        <AuthGuard allowedRoles={["student"]}>
          <WatchPage />
        </AuthGuard>
      ),
    },
  ];

  // ── Teacher routes ──
  const teacherRoutes: RouteObject[] = [
    {
      path: "teacher",
      element: (
        // Chỉ giáo viên: API /teacher/* chỉ nhận vai trò TEACHER; quản trị viên có trang riêng ở /admin.
        <AuthGuard allowedRoles={["teacher"]}>
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
          element: <TeacherLessonListPage />,
        },
        {
          // tạo bài nằm ngay trên trang danh sách
          path: "lessons/new",
          element: <Navigate to="/teacher/lessons" replace />,
        },
        {
          path: "lessons/:id",
          element: <TeacherLessonDetailPage />,
        },
        {
          path: "lessons/:id/sentences",
          // sửa câu nằm ngay trên trang bài học
          element: <Navigate to=".." relative="path" replace />,
        },
        {
          path: "compose",
          element: <Navigate to="/teacher/lessons" replace />,
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
          element: <TeacherReportListPage />,
        },
        {
          path: "reports/:id",
          element: <TeacherReportDetailPage />,
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
          element: <AdminUserListPage />,
        },
        {
          path: "users/:id",
          element: <AdminUserDetailPage />,
        },
        {
          path: "transfers",
          element: <AdminContentTransferPage />,
        },
        {
          path: "reports",
          element: <AdminReportListPage />,
        },
        {
          path: "reports/:id",
          element: <AdminReportDetailPage />,
        },
        {
          path: "republish",
          element: <AdminRepublishListPage />,
        },
        {
          path: "republish/:id",
          element: <AdminRepublishDetailPage />,
        },
        {
          path: "lessons",
          element: <AdminLessonListPage />,
        },
        {
          path: "lessons/:id",
          element: <AdminLessonDetailPage />,
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
          path: "credit",
          element: <AdminCreditConfigPage />,
        },
        {
          path: "plans",
          element: <AdminProPlanPage />,
        },
        {
          // Đường dẫn cũ của "Gói & Hạn mức" (đã tách thành Cấu hình credit và Gói Pro)
          path: "limits",
          element: <Navigate to="/admin/credit" replace />,
        },
        {
          path: "teachers",
          element: <PlaceholderPage pageKey="admin.teachers" />,
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
    ...watchRoutes,
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

