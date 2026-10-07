import AuthLayout from "@/components/layouts/AuthLayout";
import MainLayout from "@/components/layouts/MainLayout";
import StudentLayout from "@/components/layouts/StudentLayout";
import TeacherLayout from "@/components/layouts/TeacherLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Login, Register, ForgotPassword, CheckEmail, VerifyEmail } from "@/features/auth";
import NotFound from "@/components/common/NotFound";
import { Navigate, useRoutes, type RouteObject } from "react-router-dom";
import { AuthGuard } from "@/app/guards";
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
        { path: "logout" },
      ],
    },
    // Placeholder: trang thiết lập hồ sơ làm ở PR onboarding (UC-AUTH-08)
    {
      path: "onboarding",
      element: (
        <AuthGuard allowedRoles={["student"]}>
          <PlaceholderPage
            title="Thiết lập hồ sơ học tập"
            description="Chọn mục tiêu mỗi ngày, ngôn ngữ giao diện và múi giờ trước khi bắt đầu học."
          />
        </AuthGuard>
      ),
    },
    // Đích của link trong thư xác thực (backend gửi frontend-url + /verify-email?token=...)
    { path: "verify-email", element: <VerifyEmail /> },
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
          element: (
            <PlaceholderPage
              title="Hôm nay"
              description="Bảng điều khiển học tập cá nhân, chuỗi ngày streak và gợi ý bài học hàng ngày."
            />
          ),
        },
        {
          path: "lessons",
          element: (
            <PlaceholderPage
              title="Bài học"
              description="Kho bài học đa phương tiện phân tầng từ A1 đến C2 kèm video, audio và phụ đề."
            />
          ),
        },
        {
          path: "lessons/:id",
          element: (
            <PlaceholderPage
              title="Chi tiết bài học"
              description="Trải nghiệm học tương tác, nghe transcript và làm bài tập củng cố."
            />
          ),
        },
        {
          path: "dictation",
          element: (
            <PlaceholderPage
              title="Nghe chép chính tả"
              description="Luyện kỹ năng nghe ngấm và viết đúng chính tả từng câu với audio chuẩn bản xứ."
            />
          ),
        },
        {
          path: "dictation/:id",
          element: (
            <PlaceholderPage
              title="Luyện nghe chép"
              description="Không gian nghe chép trực tiếp với chấm điểm AI và phản hồi từng ký tự."
            />
          ),
        },
        {
          path: "shadowing",
          element: (
            <PlaceholderPage
              title="Luyện nói Shadowing"
              description="Luyện ngữ điệu, trọng âm và nối từ theo phương pháp Shadowing chuyên sâu."
            />
          ),
        },
        {
          path: "shadowing/:id",
          element: (
            <PlaceholderPage
              title="Phòng luyện nói"
              description="Phòng thu âm đối chiếu sóng âm thanh và nhận diện phát âm thời gian thực."
            />
          ),
        },
        {
          path: "vocab",
          element: (
            <PlaceholderPage
              title="Kho từ vựng"
              description="Các bộ từ vựng theo chủ đề, chứng chỉ TOEIC, IELTS và Oxford 3000."
            />
          ),
        },
        {
          path: "vocab/:deckId",
          element: (
            <PlaceholderPage
              title="Bộ thẻ từ vựng"
              description="Luyện tập Flashcard lặp lại ngắt quãng (Spaced Repetition) thông minh."
            />
          ),
        },
        {
          path: "deck/:id",
          element: (
            <PlaceholderPage
              title="Bộ thẻ từ vựng"
              description="Luyện tập Flashcard lặp lại ngắt quãng (Spaced Repetition) thông minh."
            />
          ),
        },
        {
          path: "topics",
          element: (
            <PlaceholderPage
              title="Chủ đề học tập"
              description="Khám phá các chủ đề giao tiếp, đời sống, du lịch và công việc."
            />
          ),
        },
        {
          path: "topics/:id",
          element: (
            <PlaceholderPage
              title="Chi tiết chủ đề"
              description="Danh sách các bài học và bộ từ vựng thuộc chủ đề này."
            />
          ),
        },
        {
          path: "mywords",
          element: (
            <PlaceholderPage
              title="Từ & câu đã lưu"
              description="Kho từ vựng và câu yêu thích bạn đã ghim lại trong các bài học."
            />
          ),
        },
        {
          path: "weakness",
          element: (
            <PlaceholderPage
              title="Phân tích điểm yếu"
              description="Bản đồ các âm vị khó, ngữ pháp hay nhầm lẫn và bài tập khắc phục trọng điểm."
            />
          ),
        },
        {
          path: "test",
          element: (
            <PlaceholderPage
              title="Kiểm tra trình độ"
              description="Bài kiểm tra trình độ CEFR thích ứng giúp xác định chính xác năng lực ngôn ngữ."
            />
          ),
        },
        {
          path: "settings",
          element: (
            <PlaceholderPage
              title="Cài đặt tài khoản"
              description="Quản lý hồ sơ cá nhân, gói Pro, nhắc nhở học tập và quyền riêng tư."
            />
          ),
        },
        {
          path: "profile",
          element: (
            <PlaceholderPage
              title="Hồ sơ học viên"
              description="Thông tin cá nhân, huy hiệu thành tích và chuỗi ngày học tập."
            />
          ),
        },
        {
          path: "notifications",
          element: (
            <PlaceholderPage
              title="Thông báo"
              description="Nhắc nhở học tập hàng ngày, bài tập mới và cập nhật hệ thống."
            />
          ),
        },
        {
          path: "stats",
          element: (
            <PlaceholderPage
              title="Thống kê học tập"
              description="Biểu đồ phân tích thời gian học, số từ đã thuộc và mức độ tiến bộ."
            />
          ),
        },
      ],
    },
  ];

  // ── Teacher routes ──
  const teacherRoutes: RouteObject[] = [
    {
      path: "teacher",
      element: (
        <AuthGuard allowedRoles={["instructor"]}>
          <TeacherLayout />
        </AuthGuard>
      ),
      children: [
        {
          index: true,
          element: (
            <PlaceholderPage
              title="Tổng quan giảng viên"
              description="Bảng điều khiển nhanh các chỉ số lớp học, bài giảng cần duyệt và báo lỗi cần xử lý."
            />
          ),
        },
        {
          path: "topics",
          element: (
            <PlaceholderPage
              title="Quản lý chủ đề"
              description="Phân loại hệ thống chủ đề bài học theo các cấp độ chuẩn CEFR từ A1 đến C2."
            />
          ),
        },
        {
          path: "topics/:id",
          element: (
            <PlaceholderPage
              title="Chi tiết chủ đề"
              description="Xem và quản lý các bài học, bộ từ vựng nằm trong chủ đề này."
            />
          ),
        },
        {
          path: "lessons",
          element: (
            <PlaceholderPage
              title="Quản lý bài học"
              description="Danh sách bài học kèm video/audio, transcript và các bài tập tương tác."
            />
          ),
        },
        {
          path: "lessons/:id",
          element: (
            <PlaceholderPage
              title="Chi tiết bài học"
              description="Chỉnh sửa kịch bản bài học, mốc thời gian phụ đề và bài tập đi kèm."
            />
          ),
        },
        {
          path: "compose",
          element: (
            <PlaceholderPage
              title="Soạn bài học mới"
              description="Công cụ soạn thảo bài giảng đa phương tiện, tích hợp gợi ý CEFR và từ điển AI."
            />
          ),
        },
        {
          path: "decks",
          element: (
            <PlaceholderPage
              title="Bộ từ vựng giáo trình"
              description="Quản lý các bộ Flashcard chính quy phục vụ giảng dạy và bài tập bổ trợ."
            />
          ),
        },
        {
          path: "decks/:id",
          element: (
            <PlaceholderPage
              title="Chi tiết bộ từ vựng"
              description="Danh sách từ vựng, phiên âm IPA, nghĩa tiếng Việt và câu ví dụ minh họa."
            />
          ),
        },
        {
          path: "cefr",
          element: (
            <PlaceholderPage
              title="Duyệt CEFR AI"
              description="Hàng đợi duyệt phân loại độ khó từ vựng và câu do thuật toán AI tự động gợi ý."
            />
          ),
        },
        {
          path: "dict",
          element: (
            <PlaceholderPage
              title="Từ điển chuyên môn"
              description="Tra cứu và tinh chỉnh các định nghĩa từ vựng, ngữ nghĩa theo ngữ cảnh tiếng Việt."
            />
          ),
        },
        {
          path: "phoneme",
          element: (
            <PlaceholderPage
              title="Ngữ âm & Phát âm"
              description="Cơ sở dữ liệu âm vị học, cặp âm tối thiểu (minimal pairs) và bài luyện âm IPA."
            />
          ),
        },
        {
          path: "qbank",
          element: (
            <PlaceholderPage
              title="Ngân hàng câu hỏi"
              description="Kho câu hỏi trắc nghiệm, điền từ, nghe chép và kiểm tra phát âm."
            />
          ),
        },
        {
          path: "reports",
          element: (
            <PlaceholderPage
              title="Báo lỗi của tôi"
              description="Theo dõi và phản hồi các góp ý, báo cáo sai sót nội dung từ người học."
            />
          ),
        },
        {
          path: "reports/:id",
          element: (
            <PlaceholderPage
              title="Xử lý báo lỗi"
              description="Xem chi tiết nội dung bị báo lỗi và xác nhận cập nhật chỉnh sửa."
            />
          ),
        },
        {
          path: "audit",
          element: (
            <PlaceholderPage
              title="Lịch sử thay đổi"
              description="Nhật ký các thao tác tạo mới, cập nhật hoặc xoá nội dung trong tài khoản giáo viên."
            />
          ),
        },
        {
          path: "classes",
          element: (
            <PlaceholderPage
              title="Quản lý lớp học"
              description="Danh sách các lớp giảng dạy, sĩ số, bài tập phân công và kết quả kiểm tra."
            />
          ),
        },
        {
          path: "students",
          element: (
            <PlaceholderPage
              title="Danh sách học viên"
              description="Hồ sơ theo dõi từng học viên, tỷ lệ chuyên cần và mức độ tiến bộ qua thời gian."
            />
          ),
        },
        {
          path: "progress",
          element: (
            <PlaceholderPage
              title="Tiến độ lớp"
              description="Biểu đồ thống kê mức độ hoàn thành bài học và phân bố điểm số của học viên."
            />
          ),
        },
        {
          path: "weakness",
          element: (
            <PlaceholderPage
              title="Điểm yếu chung"
              description="Tổng hợp các lỗi phát âm và từ vựng học viên trong lớp thường gặp nhất."
            />
          ),
        },
        {
          path: "settings",
          element: (
            <PlaceholderPage
              title="Cài đặt giảng viên"
              description="Tùy chỉnh thông báo, lịch giảng dạy, liên kết tài khoản và phương thức dạy học."
            />
          ),
        },
        {
          path: "profile",
          element: (
            <PlaceholderPage
              title="Hồ sơ giảng viên"
              description="Thông tin cá nhân giảng viên, bằng cấp, chứng chỉ và môn giảng dạy."
            />
          ),
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
          element: (
            <PlaceholderPage
              title="Tổng quan hệ thống"
              description="Bảng điều khiển KPI toàn hệ thống: người dùng hoạt động, doanh thu và cảnh báo kiểm duyệt."
            />
          ),
        },
        {
          path: "users",
          element: (
            <PlaceholderPage
              title="Quản lý người dùng"
              description="Danh sách tài khoản học viên, giảng viên và quản trị viên kèm phân quyền hệ thống."
            />
          ),
        },
        {
          path: "users/:id",
          element: (
            <PlaceholderPage
              title="Chi tiết người dùng"
              description="Thông tin chi tiết tài khoản, lịch sử học tập, giao dịch và quyền truy cập."
            />
          ),
        },
        {
          path: "reports",
          element: (
            <PlaceholderPage
              title="Hàng đợi báo lỗi"
              description="Kiểm duyệt các báo cáo nội dung không phù hợp hoặc sai lệch từ cộng đồng người dùng."
            />
          ),
        },
        {
          path: "reports/:id",
          element: (
            <PlaceholderPage
              title="Chi tiết báo cáo lỗi"
              description="Xem bằng chứng báo cáo, người gửi và quyết định xử lý vi phạm nội dung."
            />
          ),
        },
        {
          path: "decks",
          element: (
            <PlaceholderPage
              title="Duyệt bộ từ công khai"
              description="Phê duyệt các bộ từ vựng do cộng đồng chia sẻ trước khi hiển thị công khai."
            />
          ),
        },
        {
          path: "decks/:id",
          element: (
            <PlaceholderPage
              title="Kiểm duyệt bộ từ"
              description="Xem danh sách từ ngữ trong bộ thẻ do người dùng đóng góp để duyệt hiển thị."
            />
          ),
        },
        {
          path: "audit",
          element: (
            <PlaceholderPage
              title="Nhật ký nội dung"
              description="Truy vết toàn bộ lịch sử chỉnh sửa, xuất bản nội dung của các giảng viên."
            />
          ),
        },
        {
          path: "limits",
          element: (
            <PlaceholderPage
              title="Gói & Hạn mức"
              description="Cấu hình giới hạn số lượt tra từ AI, số bài học mỗi ngày cho tài khoản Free và Pro."
            />
          ),
        },
        {
          path: "subs",
          element: (
            <PlaceholderPage
              title="Đăng ký Pro"
              description="Theo dõi danh sách đăng ký thuê bao trả phí, doanh thu thanh toán và gia hạn."
            />
          ),
        },
        {
          path: "errors",
          element: (
            <PlaceholderPage
              title="Danh mục lỗi"
              description="Quản lý bảng phân loại nguyên nhân lỗi phục vụ phân loại báo cáo và thống kê."
            />
          ),
        },
        {
          path: "teachers",
          element: (
            <PlaceholderPage
              title="Quản lý giáo viên"
              description="Xét duyệt hồ sơ, cấp quyền giảng viên và đánh giá chất lượng biên soạn."
            />
          ),
        },
        {
          path: "subscriptions",
          element: (
            <PlaceholderPage
              title="Cấu hình gói dịch vụ"
              description="Thiết lập các mức giá thuê bao tháng/năm, chính sách khuyến mãi và tính năng độc quyền."
            />
          ),
        },
        {
          path: "content",
          element: (
            <PlaceholderPage
              title="Quản trị nội dung"
              description="Tổng quan kho tài nguyên bài học, âm thanh, video và tài liệu toàn hệ thống."
            />
          ),
        },
        {
          path: "settings",
          element: (
            <PlaceholderPage
              title="Cài đặt hệ thống"
              description="Cấu hình máy chủ, khóa API AI, email dịch vụ và cổng thanh toán trực tuyến."
            />
          ),
        },
        {
          path: "logs",
          element: (
            <PlaceholderPage
              title="Nhật ký hoạt động"
              description="Nhật ký truy cập, bảo mật, xác thực người dùng và giám sát lỗi server."
            />
          ),
        },
        {
          path: "profile",
          element: (
            <PlaceholderPage
              title="Hồ sơ quản trị viên"
              description="Thông tin cá nhân quản trị viên và nhật ký phiên đăng nhập."
            />
          ),
        },
        {
          path: "analytics",
          element: (
            <PlaceholderPage
              title="Phân tích & Thống kê"
              description="Báo cáo chuyên sâu về tăng trưởng người dùng, tỷ lệ giữ chân và doanh thu."
            />
          ),
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
  return useRoutes(getRoutesConfig());
};

export default AppRoutes;

