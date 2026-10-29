# AI Usage Log — Nguyễn Trí Lâm

- **Dự án:** LinguaLoop
- **Thành viên:** Nguyễn Trí Lâm
- **Mã thành viên (dùng trong ID):** LAM

## 1. Nhật ký sử dụng AI

### AI-LAM-001

- **Ngày:** 2026-10-04
- **Công cụ AI / model:** Other: Google Antigravity (Gemini 2.5 Pro)
- **Phạm vi (`Scope`):** AUTH
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Tái hiện giao diện Login, Register, Forgot Password theo mockup; tích hợp Zustand và Yup validation
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/auth/pages/Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`; `components/AuthSidePanel.tsx`, `AuthTopBar.tsx`; `validations/authSchemas.ts`; `stores/authStore.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** bc777f3 (sửa vi phạm React Compiler & ESLint rules)
- **Commit:** e0d9e97, bc777f3
- **Lỗi liên quan:** AI-ERR-LAM-001, AI-ERR-LAM-002

### AI-LAM-002

- **Ngày:** 2026-10-04
- **Công cụ AI / model:** Other: Google Antigravity (Gemini 2.5 Pro)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** DEBUGGING
- **Prompt chính / yêu cầu:** Khắc phục lỗi React Compiler vi phạm setState đồng bộ trong useEffect và cấu hình linter cho CI
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/components/layouts/Header.tsx:34-40`, `features/auth/components/AuthTopBar.tsx:8-14`, `features/auth/pages/Register.tsx`, `features/auth/stores/authStore.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên tự viết lại phần khởi tạo theme trong `Header.tsx` và `AuthTopBar.tsx` theo gợi ý của AI, chuyển từ `setTheme` đồng bộ trong `useEffect` sang lazy state initialization (`useState(() => localStorage.getItem(...))`), commit bc777f3.
- **Commit:** bc777f3
- **Lỗi liên quan:** AI-ERR-LAM-002

### AI-LAM-003

- **Ngày:** 2026-10-04
- **Công cụ AI / model:** Other: Google Antigravity (Gemini 2.5 Pro)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** DESIGN
- **Prompt chính / yêu cầu:** Chuẩn hóa tên 17 thư mục features trên frontend đồng bộ với backend domain modules
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/` (đổi `settings` -> `user`, `lessons` -> `lesson`, `mywords` -> `dictionary`, `today` -> `plan`; tạo `audit`, `report`, `subscription`; `components/common/NotFound.tsx`)
- **Commit:** 38e69d0
- **Lỗi liên quan:** NONE

### AI-LAM-004

- **Ngày:** 2026-10-04
- **Công cụ AI / model:** Other: Google Antigravity (Gemini 2.5 Pro)
- **Phạm vi (`Scope`):** AUTH
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Đóng gói phân hệ auth theo Feature-Driven (chuyển store, hook useAuth, tạo index.ts public API), chuyển Guard sang app/guards, bỏ fallback giả lập
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/auth/hooks/useAuth.ts`, `features/auth/stores/authStore.ts`, `features/auth/index.ts`, `app/guards/AuthGuard.tsx`, `app/guards/GuestGuard.tsx`, `features/auth/pages/Register.tsx:143-156`, `ForgotPassword.tsx:34-45`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** f3ef4ee (Lâm dọn dẹp các bridge file cũ tại `src/hooks/useAuth.ts` và `src/stores/authStore.ts`)
- **Commit:** 3dd970c, f3ef4ee
- **Lỗi liên quan:** AI-ERR-LAM-001

### AI-LAM-005

- **Ngày:** 2026-10-04
- **Công cụ AI / model:** Other: Google Antigravity (Gemini 3.1 Pro)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Refactor toàn bộ shell layout (Student, Teacher, Admin) từ CSS thuần sang TailwindCSS, chuẩn hóa kích thước Logo và cấu trúc Sidebar/TopBar
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/components/layouts/*`, `frontend/src/styles/index.css`
- **Commit:** 4e378b7
- **Lỗi liên quan:** NONE

### AI-LAM-006

- **Ngày:** 2026-10-04
- **Công cụ AI / model:** Other: Google Antigravity (Gemini 3.1 Pro)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Thiết kế lại `PlaceholderPage` bằng TailwindCSS, hỗ trợ tự động nhận diện icon theo title, định tuyến các trang chưa hoàn thiện trong `routes.tsx`
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/components/common/PlaceholderPage.tsx`, `frontend/src/app/routes.tsx`
- **Commit:** 4e378b7
- **Lỗi liên quan:** NONE

### AI-LAM-007

- **Ngày:** 2026-10-04
- **Công cụ AI / model:** Other: Google Antigravity (Gemini 3.1 Pro)
- **Phạm vi (`Scope`):** SUBSCRIPTION
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Tích hợp Quota Logic (5 actions/day), tạo `useQuota`, store `UpgradeModal` toàn cục và config API interceptor bắt lỗi `QUOTA_EXCEEDED`
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/hooks/useQuota.ts`, `stores/quotaStore.ts`, `components/common/UpgradeModal.tsx`, `api/axiosClient.ts`, `StudentTopBar.tsx`
- **Commit:** 4e378b7
- **Lỗi liên quan:** AI-ERR-LAM-004

### AI-LAM-008

- **Ngày:** 2026-10-10
- **Công cụ AI / model:** Other: Google Antigravity (Gemini 2.5 Pro)
- **Phạm vi (`Scope`):** LESSON
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Triển khai backend APIs cho thư viện bài học (chủ đề, danh sách, chi tiết, câu transcript, Flyway migrations)
- **Vị trí code do AI sinh (`file:hàm`):** `backend/src/main/java/com/lingualoop/backend/lesson/controller/LessonController.java`, `TopicController.java`; `service/LessonQueryService.java`, `SentenceQueryService.java`; `repository/LessonSpecification.java`, `LessonRepository.java`; `entity/Lesson.java`, `Topic.java`, `Sentence.java`; `db/migration/V20261009_0900__lesson_library_fields.sql`; seed bài học nằm ở `backend/seed/*.sql.gz` (đã chuyển ra khỏi Flyway); `LessonQueryServiceTest.java`, `LessonControllerTest.java`
- **Commit:** b3f5483
- **Lỗi liên quan:** NONE

### AI-LAM-009

- **Ngày:** 2026-10-10
- **Công cụ AI / model:** Other: Google Antigravity (Gemini 3.1 Pro)
- **Phạm vi (`Scope`):** LESSON
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Xây dựng giao diện Lesson Library, Topic Detail, Lesson Detail bằng React TSX & Tailwind CSS theo mockup
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/lesson/pages/LessonLibraryPage.tsx`, `TopicDetailPage.tsx`, `LessonDetailPage.tsx`; `components/LessonCard.tsx`; `services/lessonService.ts`; `hooks/useLessons.ts`; `types.ts`
- **Commit:** b3f5483
- **Lỗi liên quan:** NONE

### AI-LAM-010

- **Ngày:** 2026-10-10
- **Công cụ AI / model:** Other: Google Antigravity (Gemini 2.5 Pro)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** DEBUGGING
- **Prompt chính / yêu cầu:** Khắc phục cảnh báo ESLint về hooks thiếu dependencies (`react-hooks/exhaustive-deps`) và kiểu `any` trong các trang bài học
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/lesson/pages/LessonLibraryPage.tsx`, `TopicDetailPage.tsx`
- **Commit:** b3f5483
- **Lỗi liên quan:** NONE

### AI-LAM-011

- **Ngày:** 2026-10-11
- **Công cụ AI / model:** Other: Google Antigravity (Gemini 2.5 Pro)
- **Phạm vi (`Scope`):** LESSON
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Bổ sung đa ngôn ngữ i18n cho UI bài học (vi/en), chuẩn hóa bộ UI components dùng chung và tách `LessonQueryServiceImpl` ở backend
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/i18n/locales/vi/pages.json`, `en/pages.json`; `components/common/Badge.tsx`, `EmptyState.tsx`, `SearchInput.tsx`; `features/lesson/pages/*`; `backend/src/main/java/com/lingualoop/backend/lesson/service/LessonQueryServiceImpl.java`
- **Commit:** b3f5483
- **Lỗi liên quan:** NONE

### AI-LAM-012

- **Ngày:** 2026-10-11
- **Công cụ AI / model:** Other: Google Antigravity (Gemini 3.1 Pro)
- **Phạm vi (`Scope`):** LESSON
- **Loại công việc (`Task Type`):** DEBUGGING
- **Prompt chính / yêu cầu:** Sửa DTO LessonDetail thiếu topic, fix unwrap dữ liệu TopicRow lồng nhau, phân trang transcript 8 câu kèm IPA và toggle nút Đăng nhập/Đăng xuất ở Header theo Auth state
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../lesson/dto/LessonDetail.java`, `mapper/LessonMapper.java`, `service/LessonQueryServiceImpl.java:getLessonDetail`; `frontend/.../lesson/pages/LessonDetailPage.tsx`, `TopicDetailPage.tsx`; `components/layouts/Header.tsx:authButton`
- **Commit:** b3f5483
- **Lỗi liên quan:** NONE

### AI-LAM-013

- **Ngày:** 2026-10-12
- **Công cụ AI / model:** Other: Google Antigravity (Gemini 3.1 Pro)
- **Phạm vi (`Scope`):** TESTING
- **Loại công việc (`Task Type`):** TEST_GENERATION
- **Prompt chính / yêu cầu:** Bổ sung unit tests cho toàn bộ phân hệ Lesson (controllers, services, specifications) đạt 100% line coverage trên New Code để vượt Quality Gate SonarCloud
- **Vị trí code do AI sinh (`file:hàm`):** `TopicControllerTest.java`, `LessonControllerTest.java`, `LessonQueryServiceTest.java`, `LessonSpecificationTest.java`, `LessonProgressServiceImplTest.java`, `PlanServiceTest.java`, `SentenceQueryServiceImplTest.java`
- **Commit:** b3f5483
- **Lỗi liên quan:** NONE

### AI-LAM-014

- **Ngày:** 2026-10-12
- **Công cụ AI / model:** Claude Code (Opus 5.5 lập kế hoạch, Sonnet 5.5 triển khai)
- **Phạm vi (`Scope`):** LESSON
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Sửa PR #21 theo review: trả lại code auth/user của Kế từ main, đưa seed 38MB ra khỏi Flyway (nén `.sql.gz` + script nạp), ẩn bài chưa duyệt, gộp truy vấn đếm (hết N+1), `@CurrentUserId`, `PageResponse`, lọc `state`, `SubscriptionQueryService` đọc `v_user_plan`, `SentenceQueryService` thật, test tích hợp Testcontainers với mã AC-LESSON, đồng bộ type/route/trạng thái lỗi ở frontend
- **Vị trí code do AI sinh (`file:hàm`):** `backend/seed/*`; `lesson/service/LessonQueryServiceImpl.java`, `SentenceQueryServiceImpl.java`; `lesson/repository/LessonRepository.java`, `LessonSpecification.java`; `subscription/service/SubscriptionQueryService.java`; `lesson/controller/*`; `LessonLibraryIntegrationTest.java`, `SentenceQueryServiceIntegrationTest.java`; `docs/srs/use-cases/LESSON.md`; `frontend/src/features/lesson/*`
- **Commit:** b3f5483
- **Lỗi liên quan:** NONE

### AI-LAM-015

- **Ngày:** 2026-10-13
- **Công cụ AI / model:** Claude Code (Opus 5.5 lập kế hoạch, Sonnet 5.5 triển khai)
- **Phạm vi (`Scope`):** AUTH
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Tách giao diện auth Tailwind thành PR riêng cho Kế review: dựng lại nhánh từ `feat/lesson-library`, chỉ giữ thay đổi giao diện auth/user và sửa các regression review #1 đã chỉ ra (chuyển `check-email` khi chưa xác thực email, mã `AUTH_EMAIL_TAKEN` và lỗi field khi đăng ký, tự chuyển về đăng nhập sau xác thực email, GuestGuard, `trim` email, `remember` mặc định true)
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/auth/pages/Login.tsx`, `Register.tsx`, `VerifyEmail.tsx`; `frontend/src/app/routes.tsx`; `frontend/src/components/common/FormAlert.tsx`, `Checkbox.tsx`
- **Commit:** d680b9f
- **Lỗi liên quan:** NONE

### AI-LAM-016

- **Ngày:** 2026-10-16
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Chuyển token màu sang DESIGN.v2 (màu chức năng, theme theo hệ thống) cho frontend
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/styles/index.css`, `hooks/useTheme.ts`, `components/common/Logo.tsx`, `LanguageSwitcher.tsx`
- **Commit:** 3662079
- **Lỗi liên quan:** NONE

### AI-LAM-017

- **Ngày:** 2026-10-16
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Thay Phosphor bằng Lucide qua `Icon` dùng chung, bỏ sprite 3D và hiệu ứng trang trí
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/components/common/Icon.tsx`, `SvgSprites.tsx` (xoá), `PlaceholderPage.tsx`, `index.html`, `App.tsx`
- **Commit:** 7a8662c
- **Lỗi liên quan:** NONE

### AI-LAM-018

- **Ngày:** 2026-10-16
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Đưa component dùng chung sang token v2 (Button, Badge, Card, ProgressBar, ErrorState, Skeleton, Mascot…), xoá CSS cũ `.ll-*`
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/components/common/*.tsx`, `frontend/src/styles/index.css`
- **Commit:** 08a172d
- **Lỗi liên quan:** NONE

### AI-LAM-019

- **Ngày:** 2026-10-16
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Gộp layout student/instructor/admin thành một `AppShell` (Sidebar, TopBar, AccountMenu, cấu hình theo vai trò)
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/components/layouts/shell/AppShell.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `AccountMenu.tsx`, `shellConfigs.ts`
- **Commit:** 5826089
- **Lỗi liên quan:** NONE

### AI-LAM-020

- **Ngày:** 2026-10-16
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** LESSON
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Tách trang thư viện/chủ đề/chi tiết bài thành component; thêm trạng thái tải và lỗi, retry thông minh cho `queryClient`
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/lesson/components/*`, `pages/LessonLibraryPage.tsx`, `TopicDetailPage.tsx`, `LessonDetailPage.tsx`; `api/queryClient.ts`; `components/common/RouteErrorBoundary.tsx`
- **Commit:** 59b9a94
- **Lỗi liên quan:** NONE

### AI-LAM-021

- **Ngày:** 2026-10-17
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Đối chiếu số đo với mockup v2 cho khung, thư viện, chủ đề, chi tiết bài, auth, Settings; thêm Dialog, toast, Command palette (Ctrl K), chân trang
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/components/common/Dialog.tsx`, `ToastHost.tsx`, `LoopiSay.tsx`; `components/layouts/shell/CommandPalette.tsx`, `AppFooter.tsx`; `features/lesson/components/library/*`, `detail/*`; `features/auth/components/AuthSidePanel.tsx`, `GoogleSignInButton.tsx`; `features/user/pages/Settings.tsx`
- **Commit:** be50bbb
- **Lỗi liên quan:** NONE

### AI-LAM-022

- **Ngày:** 2026-10-17
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** LESSON
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Chip chủ đề kéo/lăn chuột, thumbnail 16:9, huy hiệu đậm, hover phát sáng, đường dẫn `/student/<mode>/<slug>`, quota và ngôn ngữ ở thanh trên, sửa drawer mobile không bấm được; đổi 6 bài mỗi chủ đề
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/lesson/components/library/TopicChips.tsx`, `LessonCard.tsx`, `LessonThumb.tsx`; `components/layouts/shell/AppShell.tsx`, `TopBar.tsx`; `components/common/YouTubeLogo.tsx`, `Badge.tsx`; `backend/.../lesson/service/LessonQueryServiceImpl.java:POPULAR_PER_TOPIC`
- **Commit:** 60af725
- **Lỗi liên quan:** NONE

### AI-LAM-023

- **Ngày:** 2026-10-17
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** LESSON
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Phân trang trang chủ đề (số trang trên URL `?page=`); dọn component, asset, token CSS và khoá i18n không còn dùng
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/lesson/components/Pagination.tsx`, `pages/TopicDetailPage.tsx`; xoá `Table.tsx`, `GlassTag.tsx`, các `index.ts` barrel
- **Commit:** 2c9d8e1
- **Lỗi liên quan:** NONE

### AI-LAM-024

- **Ngày:** 2026-10-17
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Refactor `MainLayout` và `Header` công khai theo thiết kế mới, dùng chung `AppFooter`, xoá `Footer` cũ
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/components/layouts/MainLayout.tsx`, `Header.tsx`
- **Commit:** 91b8ce8
- **Lỗi liên quan:** NONE

### AI-LAM-025

- **Ngày:** 2026-10-17
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Lát 0 của kế hoạch shadowing: API đọc gói `GET /subscriptions/me`, API thử `PUT /dev/plan` và `POST /dev/usage/reset` (chỉ nạp khi `app.dev-tools.enabled`), nút gạt Free/Pro và đặt lại lượt ở thanh trên
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../devtools/DevToolsController.java`, `DevToolsService.java:setPro,resetUsage`; `subscription/controller/SubscriptionController.java:getMyPlan`; `backend/src/test/.../devtools/*IntegrationTest.java`; `frontend/src/features/subscription/*`, `hooks/useQuota.ts`, `components/layouts/shell/TopBar.tsx`
- **Commit:** 3432a8b
- **Lỗi liên quan:** NONE

### AI-LAM-026

- **Ngày:** 2026-10-17
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Lát A shadowing: đặc tả SRS, API chấm Azure + hạn mức theo ngày + tiếp tục bài + tiến độ bài, chuyển âm vị Azure sang bảng phonemes (ADR 0004), trang luyện `/student/shadowing/:slug` theo mockup v2
- **Vị trí code do AI sinh (`file:hàm`):** `docs/srs/use-cases/SHADOWING.md`; `backend/.../shadowing/**` (`ShadowingAttemptServiceImpl.java:assess`, `AzurePhonemeMapper.java:toTableSymbols`, `WavAudio.java:parse`, `AzurePronunciationScoringService.java`); `subscription/service/UsageServiceImpl.java:tryConsume,refund,usageOf`; `lesson/service/LessonProgressServiceImpl.java:recordActivity`; `frontend/src/features/shadowing/**`, `lib/pcmRecorder.ts`, `hooks/useQuota.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chạy Azure thật với câu "Good morning" và thấy `AzurePhonemeMapper` bỏ mất âm `ɔɹ` do Azure trả về như một âm vị; tự thêm ánh xạ ɔɹ→ɔː, ɑɹ→ɑː, ɪɹ→ɪə, ɛɹ→eə, ʊɹ→ʊə kèm test và SHADOWING.md (79b4a4a). Sửa `ShadowingAttemptServiceImpl` để API trả ký hiệu âm vị theo bảng `phonemes`, hiện IPA của từ ở ô chi tiết và đăng ký icon mic mới (3e37cf5).
- **Commit:** d0fa6d5, fba7924, 2f5d6fd, 79b4a4a, 3e37cf5
- **Lỗi liên quan:** NONE

### AI-LAM-027

- **Ngày:** 2026-10-18
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DEVOPS_CI
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Sửa cảnh báo SonarCloud (tệp tạm) bằng luồng đẩy PCM; bấm câu trong danh sách thì phát đoạn mẫu; thêm tab Xem/Luyện, cài đặt, ẩn video và phím tắt theo mockup v2
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../shadowing/azure/WavPcm.java:extract`, `AzurePronunciationScoringService.java:recognize`; `frontend/src/features/shadowing/hooks/useModelPlayer.ts:watch`, `useShadowingHotkeys.ts`, `useShadowingSettings.ts`; `components/ShadowingPractice.tsx:pickFromList,switchTab`, `WatchPanel.tsx`, `ToolbarPanels.tsx`, `ToolbarPopover.tsx`, `SentenceList.tsx`
- **Commit:** 88faa33, b2f0713, 410174f
- **Lỗi liên quan:** NONE

### AI-LAM-028

- **Ngày:** 2026-10-18
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DEVOPS_CI
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Cho các file yml của backend dùng được biến trong `.env` (`spring.config.import`), giữ test độc lập với `.env` của máy dev
- **Vị trí code do AI sinh (`file:hàm`):** `backend/src/main/resources/application.yml` (khối `spring.config.import`), `backend/pom.xml` (surefire `DOTENV_DIR`), `backend/.env.example`
- **Commit:** 97368e4
- **Lỗi liên quan:** NONE

### AI-LAM-029

- **Ngày:** 2026-10-18
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Chỉnh giao diện trang shadowing theo mockup v2: phiên âm dưới từng từ, thanh phía trên video có đồng hồ và trục các câu, hàng điều khiển gộp, khối kết quả gọn, danh sách bản chép có tiến độ
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/shadowing/components/MediaBar.tsx`, `ControlBar.tsx`, `SentenceWords.tsx`, `AttemptResult.tsx`, `SentenceList.tsx`, `ShadowingPractice.tsx`; `utils.ts:wordIpa,litTokenIndex,weakPhonemes`; `hooks/useModelPlayer.ts:positionMs`
- **Commit:** 7c4651a
- **Lỗi liên quan:** NONE

### AI-LAM-030

- **Ngày:** 2026-10-18
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Theo góp ý review: chuyển truy cập dữ liệu shadowing, hạn mức, gói và tiến độ từ JdbcClient sang Spring Data JPA (hạn mức giữ nguyên tử bằng UPDATE có điều kiện); thêm circuit breaker và timeout cho lời gọi Azure
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../shadowing/entity/**`, `shadowing/repository/**`, `subscription/entity/**`, `subscription/repository/**`, `subscription/service/UsageServiceImpl.java`, `lesson/repository/LessonModeProgressRepository.java`, `shadowing/azure/GuardedPronunciationScoringService.java`, `config/ScoringGuardProperties.java`
- **Commit:** 9ed2a92
- **Lỗi liên quan:** NONE

### AI-LAM-031

- **Ngày:** 2026-10-18
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** TESTING
- **Loại công việc (`Task Type`):** TEST_GENERATION
- **Prompt chính / yêu cầu:** Cài Vitest cho frontend và viết 40 unit test cho `features/shadowing/utils.ts` (test phát hiện lỗi `fmtClock` hiện "00:60.0", đã sửa)
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/shadowing/utils.test.ts`, `utils.ts:fmtClock`, `frontend/vite.config.ts`, `frontend/package.json`
- **Commit:** 091c476
- **Lỗi liên quan:** NONE

### AI-LAM-032

- **Ngày:** 2026-10-18
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** LESSON
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Trang chi tiết bài học hiện tiến độ thật (phần trăm câu đã luyện theo chế độ, thời gian học) thay cho giá trị 0 cố định; điểm từng từ hiện dưới phiên âm; nút "Nghe mẫu từ" có nhãn
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../lesson/service/LessonQueryServiceImpl.java:progressOf`, `lesson/repository/LessonProgressRepository.java:countAttemptedSentences`, `LessonModeProgressRepository.java:sumStudyTime`; `frontend/.../SentenceWords.tsx`, `WordDetail.tsx`, `AsideCards.tsx`, `useShadowing.ts`
- **Commit:** a9dfebe
- **Lỗi liên quan:** NONE

### AI-LAM-033

- **Ngày:** 2026-10-19
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Bài âm thanh trong shadowing: hiện thanh phát của trình duyệt (phát, tua, âm lượng) thay cho khung trống, và chọn câu theo vị trí khi người học tự tua
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/shadowing/hooks/useModelPlayer.ts`, `components/ShadowingPractice.tsx`
- **Commit:** 030d0d3
- **Lỗi liên quan:** NONE

### AI-LAM-034

- **Ngày:** 2026-10-19
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Lát B bước 1-2: đặc tả UC-SHADOW-07/08, nạp 14 mẹo sửa âm tiếng Việt vào `phoneme_confusions` (lấy từ TipCatalog của demo), kết quả chấm kèm mẹo và video khẩu hình khoá ở server cho gói Free, hiển thị trong ô chi tiết từ
- **Vị trí code do AI sinh (`file:hàm`):** `docs/srs/use-cases/SHADOWING.md`, `backend/.../db/migration/V20261019_1400__seed_pronunciation_tips.sql`, `shadowing/service/PronunciationHints.java`, `ShadowingAttemptServiceImpl.java:toResponse`, `frontend/.../WordDetail.tsx`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chuyển text video khẩu hình sang đúng nhóm khóa `shadowingPractice` trong `pages.json` (vi/en), vì component đọc ở nhóm đó (fd76599).
- **Commit:** 81af7f4, fd76599
- **Lỗi liên quan:** NONE

### AI-LAM-035

- **Ngày:** 2026-10-19
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Lát B bước 3: Nhận xét AI cho từng lượt shadowing bằng Gemini văn bản (API `POST /shadowing-attempts/{id}/ai-feedback`, mỗi lượt một nhận xét, Free 5 lượt/ngày, Pro không giới hạn, hoàn lượt khi lỗi), tách `ExternalCallGuard` dùng chung cho Azure và Gemini, thẻ "Nhận xét AI" ở trang luyện
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../ai/**`, `common/resilience/ExternalCallGuard.java`, `shadowing/service/AiFeedbackServiceImpl.java`, `db/migration/V20261019_1410__ai_feedback_limits.sql`, `frontend/.../AiFeedbackCard.tsx`
- **Commit:** 0f96a0a
- **Lỗi liên quan:** NONE

### AI-LAM-036

- **Ngày:** 2026-10-19
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Nhận xét AI hiện chữ chạy dần: endpoint SSE `POST /shadowing-attempts/{id}/ai-feedback/stream` (Gemini `generateContentStream`), hook đọc luồng qua axios `onDownloadProgress`, thẻ hiện chữ kèm con trỏ; log lỗi Gemini gọn một dòng
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../shadowing/controller/ShadowingController.java:aiFeedbackStream`, `SseStream.java`, `ai/GeminiFeedbackGenerator.java`, `frontend/.../shadowingService.ts:streamAiFeedback`, `sse.ts`, `AiFeedbackCard.tsx`
- **Commit:** 0cf01a2
- **Lỗi liên quan:** NONE

### AI-LAM-037

- **Ngày:** 2026-10-19
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** DEBUGGING
- **Prompt chính / yêu cầu:** Gemini quá tải (503/429): tắt thử lại ngầm của SDK, tự thử lại một lần sau 1 giây với model dự phòng tùy chọn (`GEMINI_FALLBACK_MODEL`), mã lỗi mới `AI_FEEDBACK_BUSY` ("AI đang bận"), log ghi mã lỗi và nguyên nhân gốc
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../ai/GeminiFeedbackGenerator.java`, `config/GeminiProperties.java`, `common/exception/ErrorCode.java`, `frontend/.../AiFeedbackCard.tsx`
- **Commit:** e309a72
- **Lỗi liên quan:** NONE

### AI-LAM-038

- **Ngày:** 2026-10-20
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Mở lại bài vẫn thấy đủ kết quả Azure: API `latest` trả thêm điểm thành phần, từng âm vị kèm mẹo sửa và video khẩu hình (khoá theo gói), nhận xét AI đã lưu; thẻ nhận xét tự hiện bản đã lưu
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../shadowing/service/ShadowingAttemptServiceImpl.java:latestByLesson`, `dto/LatestAttemptResponse.java`, `repository/AttemptPhonemeRepository.java`, `frontend/.../ShadowingPractice.tsx:recordsFromLatest`, `AiFeedbackCard.tsx`
- **Commit:** 9b97b62
- **Lỗi liên quan:** NONE

### AI-LAM-039

- **Ngày:** 2026-10-20
- **Công cụ AI / model:** Claude Code (Sonnet 5.5, một phần Opus 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Bấm âm vị nào xem mẹo và video âm đó; mẹo và video theo âm mẫu: tách phiên âm mẫu của câu (`ExpectedPhonemes`) rồi ghép với âm Azure báo; khôi phục khi mở lại bài; phụ âm khác âm mẫu dù điểm cao cũng là "cần sửa" (`PhonemeRules`), gỡ mẹo dự phòng từ mô tả chung; thử Azure thật với en-US/en-GB và giọng máy
- **Vị trí code do AI sinh (`file:hàm`):** `shadowing/azure/ExpectedPhonemes.java`; `shadowing/service/PhonemeRules.java`, `PhonemeTargets.java`, `PronunciationHints.java`, `ShadowingAttemptServiceImpl.java`, `FeedbackRequestLoader.java`; `frontend/src/features/shadowing/components/WordDetail.tsx`, `utils.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên sửa `ExpectedPhonemes` để chuyển IPA Mỹ của câu qua `AzurePhonemeMapper` trước khi căn với âm Azure báo (8130057).
- **Commit:** ff7d66f, c36244d, 58a44f4, 8130057, 56038b3
- **Lỗi liên quan:** NONE

### AI-LAM-040

- **Ngày:** 2026-10-20
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Mô hình âm đích (ADR 0005): migration thêm `azure_symbol`, `target_phoneme_id`, cho `phoneme_id` rỗng; lưu cả âm lạ và ứng viên `NBestPhonemes` cao điểm nhất; gộp nguyên âm với `ɹ` như Azure khi tách phiên âm mẫu; mở lại bài dùng âm đích đã lưu; view thống kê theo âm đích
- **Vị trí code do AI sinh (`file:hàm`):** `db/migration/V20261020_1500__phoneme_target_model.sql`; `shadowing/entity/AttemptPhoneme.java`, `AttemptWord.java`; `shadowing/service/ShadowingAttemptRecorder.java`, `PhonemeTargets.java`; `shadowing/azure/AzurePronunciationScoringService.java`, `PronunciationAssessment.java`, `ExpectedPhonemes.java`; `docs/srs/use-cases/SHADOWING.md` (AC-SHADOW-36)
- **Commit:** b77c5ae
- **Lỗi liên quan:** NONE

### AI-LAM-041

- **Ngày:** 2026-10-21
- **Công cụ AI / model:** Claude Code (Sonnet 5.5, một phần Opus 5.5)
- **Phạm vi (`Scope`):** OTHER — gia sư giọng nói (tutor), README §4.2 chưa có giá trị riêng
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Gia sư giọng nói (Lát C1, backend): đặc tả UC/BR-TUTOR, migration phiên/lời mời/kết quả từng từ, luật thuần (chọn từ, lượt chấm, chấm điểm), entity có khoá dòng, API lời mời và tạo phiên cấp token Gemini Live qua circuit breaker, vòng đời phiên (started và trừ lượt, đổi từ, chấm lượt, lạc đề, kết thúc, xem lại), job dọn phiên quá 15 giây
- **Vị trí code do AI sinh (`file:hàm`):** `docs/srs/use-cases/TUTOR.md`; `db/migration/*tutor*`; `backend/.../tutor/**` (`TutorSessionService`, `TutorAttemptService`, `LockedSessions`, `GuardedLiveTokenIssuer`, `TutorSessionCleanup`); `shadowing/service/AttemptSnapshotsImpl.java`, `AssessmentSnapshots.java`
- **Commit:** 5b7940a, d4eea14, df46488, 99681d8, e8b0559, 98d2ea1
- **Lỗi liên quan:** NONE

### AI-LAM-042

- **Ngày:** 2026-10-21
- **Công cụ AI / model:** Claude Code (Sonnet 5.5, một phần Opus 5.5)
- **Phạm vi (`Scope`):** OTHER — gia sư giọng nói (tutor), README §4.2 chưa có giá trị riêng
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Sửa sau review C1 (AI review rồi hỏi lại Lâm từng điểm là lỗi hay cố ý): backend tự đóng phiên đã `started` quá 10 phút + 30 giây (`timeout`) và job dọn quét loại phiên này; timeout HTTP cho lời gọi cấp token Gemini; lời mời phải thuộc đúng lượt; `lesson-events` với bài không tồn tại trả 404; trần 5 phiên chưa `started` mỗi ngày (`TUTOR_TOO_MANY_FAILED_STARTS`); cập nhật BR-TUTOR-04/06/07 và AC-TUTOR-29..32
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../tutor/entity/TutorSession.java:expireIfOverdue`, `TutorSessionService.java`, `TutorSessionCleanup.java`, `TutorOfferService.java`, `GeminiLiveTokenIssuer.java`, `TutorSessionRepository.java`; `docs/srs/business-rules.md`, `docs/srs/use-cases/TUTOR.md`
- **Commit:** 90a507d, 6e3c1d8
- **Lỗi liên quan:** NONE

### AI-LAM-043

- **Ngày:** 2026-10-21
- **Công cụ AI / model:** Claude Code (Sonnet 5.5, một phần Opus 5.5)
- **Phạm vi (`Scope`):** OTHER — gia sư giọng nói (tutor), README §4.2 chưa có giá trị riêng
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Giao diện Phiên gia sư (Lát C2): bộ điều khiển Gemini Live phía trình duyệt (token một lần, tool `request_retry`, `switch_word`, `log_turn`, `end_session`, trần 10 phút, nhắc chốt, im lặng 60/90 giây) nối API của C1, các thành phần giao diện (công tắc, thẻ hỏi bật, lời mời đếm ngược, khung phiên, chip từ, nút giữ để đọc, kết quả, dự phòng mẹo chữ) theo mockup, nối vào trang Shadowing (nhớ bật/tắt theo người dùng và bài, lời mời sau mỗi lượt chấm, nút "Hỏi gia sư", khoá Free hết lượt, dòng "Gia sư: … 54 → 86"), chuỗi i18n vi/en; sửa theo AI review: "Thử lại" không báo phiên sau, lời mời cũ tự mở lại, thông báo chỉ có tiếng Việt, lựa chọn bật gia sư không theo người dùng
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/tutor/**` (`controller.ts`, `rules.ts`, `api.ts`, `components/*`), `features/shadowing/components/ShadowingPractice.tsx`, `AttemptResult.tsx`, `i18n/locales/*/pages.json`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên sửa `ShadowingPractice.tsx` và `TutorPanel.tsx`: báo đúng phiên sau "Thử lại", bỏ lời mời cũ khi người học chuyển câu để banner không tự mở lại và tự khởi động phiên (6f76d14).
- **Commit:** 21807ad, a54eea2, bb2abb0, 6f76d14, 6d1f07a, 07ea575
- **Lỗi liên quan:** NONE

### AI-LAM-044

- **Ngày:** 2026-10-22
- **Công cụ AI / model:** Claude Code (Sonnet 5.5, một phần Opus 5.5)
- **Phạm vi (`Scope`):** OTHER — gia sư giọng nói (tutor), README §4.2 chưa có giá trị riêng
- **Loại công việc (`Task Type`):** DEBUGGING
- **Prompt chính / yêu cầu:** Nghiệm thu C2 và sửa các điểm lòi ra: chạy trên Chromium do Playwright điều khiển với backend, Postgres mới, Gemini Live và Azure thật, micro giả (phát file WAV vào `getUserMedia`); sửa Esc không đóng hộp mời Pro và hộp nói "lượt hành động" khi hết phiên gia sư; thay regex cắt dấu câu bị SonarCloud báo (S5850, S8786) bằng vòng lặp; gỡ 5 file ghi âm cá nhân lỡ vào nhánh PR #29 và đưa `backend/samples/` vào `.gitignore`
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/stores/quotaStore.ts`, `components/common/UpgradeModal.tsx`, `api/axiosClient.ts`, `backend/.../tutor/Words.java`, `.gitignore`; kịch bản và kết quả nghiệm thu ở `docs/ux/` (cục bộ)
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên phát hiện `UpgradeModal` không đóng bằng Esc và luôn nói "lượt hành động"; thêm `reason` (quota hoặc tutor) vào `quotaStore`, chọn theo `details.feature` của lỗi 429, và thêm `quotaStore.test.ts` (ca8988a).
- **Commit:** ca8988a, 584ebb5, c5f31d0
- **Lỗi liên quan:** NONE

### AI-LAM-045

- **Ngày:** 2026-10-23
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SUBSCRIPTION
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Bể năng lượng AI chung: bỏ bộ đếm `shadowing_assess`, gộp `ai_feedback` và `tutor_session` thành `ai_energy` (Free 8/ngày, Pro không giới hạn; nhận xét tốn 1, phiên gia sư tốn 3); `tryConsume` tính theo giá và `refund` trả đủ giá; `GET /me/usage` trả bảng giá `costs`; phản hồi chấm shadowing bỏ trường `usage`; `useAiEnergy` thay `useQuota`; hộp mời Pro nói đúng hoạt động hết năng lượng (gia sư, nhận xét AI, nội dung Pro); BR-QUOTA-01, ADR 0006, viết lại AC liên quan
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../subscription/service/UsageServiceImpl.java:tryConsume`, `:refund`; `subscription/constant/AiAction.java`; `UsageCounterRepository.java:incrementBelow`; `V20261023_0100__ai_energy_pool.sql`; `tutor/TutorSessionService.java:createSession`, `:started`; `frontend/src/hooks/useAiEnergy.ts`, `aiEnergyMath.ts`; `components/common/UpgradeModal.tsx`; `docs/srs/business-rules.md`, `docs/adr/0006-ai-energy-pool.md`
- **Commit:** e20ff10
- **Lỗi liên quan:** NONE

### AI-LAM-046

- **Ngày:** 2026-10-23
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Chấm Azure chịu tải: giới hạn số lời gọi đồng thời (`max-concurrent`, mặc định 1 theo bậc F0), lỗi `TooManyRequests` báo `SHADOWING_SCORING_BUSY` (503) và không làm mở circuit breaker, hết quota/sai khoá ghi log ERROR; thông báo "hệ thống chấm đang bận" kèm thử lại; bài dò đồng thời với Azure thật; BR-SHADOW-14, AC-SHADOW-38/39; bổ sung test cho phần Sonar báo thiếu độ phủ; gộp `main` (có #37) và giải quyết xung đột
- **Vị trí code do AI sinh (`file:hàm`):** `shadowing/azure/AzureCancellation.java:toException`, `GuardedPronunciationScoringService.java:assess`, `:acquire`; `config/ScoringGuardProperties.java`; `AzureConcurrencyProbeExternalTest.java`; `ShadowingPractice.tsx:noteFromError`; `docs/srs/business-rules.md`, `docs/srs/use-cases/SHADOWING.md`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên tự giải quyết xung đột khi gộp `main` (có #37) vào nhánh: giữ ghi chú `SHADOWING_SCORING_BUSY` và bỏ ghi chú `QUOTA_EXCEEDED` của shadowing trong `ShadowingPractice.tsx`/`pages.json`; đánh lại số AC của Azure thành AC-SHADOW-38/39 vì #37 đã dùng AC-SHADOW-37; sửa `ShadowingAttemptIntegrationTest` kiểm tra bộ đếm năng lượng (`energyUsed`) không đổi khi báo bận; sửa BR-SHADOW-09/14 bỏ ý "được hoàn lượt". Các thay đổi này nằm trong merge commit nên không ghi hash (README §5.1).
- **Commit:** c3c387f, ba1dd5b
- **Lỗi liên quan:** AI-ERR-LAM-010

### AI-LAM-047

- **Ngày:** 2026-10-23
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Mốc thời gian video khẩu hình cho 8 phụ âm (/m/ /n/ /ŋ/ /h/ /l/ /r/ /w/ /j/) dùng chung một video BBC dài 75 phút: thêm `&t=` (giây) vào `mouth_video_url`
- **Vị trí code do AI sinh (`file:hàm`):** `backend/src/main/resources/db/migration/V20261022_2240__phoneme_mouth_video_timestamps.sql`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên đổi tên migration thành `V20261023_1600__phoneme_mouth_video_timestamps.sql`, nội dung giữ nguyên, vì prod đã áp V20261023_0100 nên Flyway dừng khởi động với tên cũ V20261022_2240 (e0160e0).
- **Commit:** 17ecd71, e0160e0
- **Lỗi liên quan:** NONE

### AI-LAM-048

- **Ngày:** 2026-10-24
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DICTATION
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Hoàn thiện nghe chép tuần 3, phần 1: lịch sử các lượt làm của một câu (mở lại kết quả từng từ của lượt cũ), ghi chú mỗi người một câu (tối đa 1000 ký tự), danh sách Câu cần ôn (tự thêm khi dưới 60 điểm, tự gỡ khi từ 80, ghim và gỡ tay), kèm thanh công cụ trong màn nghe chép; UC-DICT-08/09/10, AC-DICT-46..61, BR-DICT-14..17 và `GLOSSARY.md`
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../practice/service/SentenceReviewServiceImpl.java:recordDictationScore`, `:pin`; `SentenceNoteServiceImpl.java:save`; `practice/repository/SentenceReviewRepository.java:addDictation`, `:findDictationEntries`; `dictation/service/DictationServiceImpl.java:getAttempt`, `:getAttemptHistory`, `:submitAttempt`; `V20261024_0900__sentence_notes_one_per_sentence.sql`; `frontend/src/features/dictation/components/SentenceTools.tsx`, `NotePanel.tsx`, `HistoryPanel.tsx`; `docs/srs/use-cases/DICT.md` (UC-DICT-08..10)
- **Commit:** 069b824, 59e1692
- **Lỗi liên quan:** NONE

### AI-LAM-049

- **Ngày:** 2026-10-24
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DICTIONARY
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Nghe chép tuần 3, phần 2: trang `mywords` (Từ & câu đã lưu) với tab Câu cần ôn (Đã ổn, Luyện lại mở đúng câu ở chế độ làm lại qua `?sentence=&redo=1`) và tab Ghi chú (sửa, xoá tại chỗ); khung Ghi chú của tôi ở chi tiết bài hiện ghi chú thật
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/mywords/` (`hooks.ts`, `components/ReviewTab.tsx`, `components/NotesTab.tsx`, `pages/MyWordsPage.tsx`, `links.ts`); `features/dictation/deepLink.ts:deepLinkTarget`; `features/dictation/pages/DictationPage.tsx` (khởi tạo `index`, `redo`); `features/lesson/components/detail/AsideCards.tsx:NotesCard`; `i18n/locales/*/mywords.json`
- **Commit:** 9d09d62
- **Lỗi liên quan:** NONE

## 2. Lỗi, đề xuất sai hoặc thiếu sót của AI đã được xác minh

Lỗi trong file này do chủ file tự phát hiện. Mỗi lỗi cần commit sửa thật (xem `README.md` §4.5).

### AI-ERR-LAM-001

- **Liên kết bản ghi AI:** AI-LAM-001
- **Loại lỗi (`Error Type`):** LOGIC_ERROR
- **Ngày phát hiện:** 2026-10-04
- **Đầu ra sai/thiếu sót và bối cảnh:** AI tự chèn fallback `if (error.response?.status === 404 || !error.response)` tự set "Đăng ký thành công!" và redirect login khi API lỗi mạng hoặc 404.
- **Vị trí (`file:hàm`):** `frontend/src/features/auth/pages/Register.tsx:onSubmit`, `ForgotPassword.tsx:onSubmit`
- **Nguyên nhân phân tích:** AI cố tình viết logic giả lập cho mockup chạy độc lập mà bỏ qua xử lý lỗi kết nối thật với backend.
- **Cách phát hiện / bằng chứng:** Log cũ không ghi cách phát hiện cụ thể.
- **Cách sửa:** Bỏ fallback giả lập khi đóng gói phân hệ auth (AI-LAM-004).
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** e0d9e97
- **Commit sửa (bắt buộc, khác commit trên):** 3dd970c
- **Kiểm chứng sau sửa:** Theo AI-LAM-004: `npx tsc -b`, `npm run build`, `npm run lint`, kiểm tra hiển thị lỗi API thật.
- **Trạng thái (`Error Status`):** VERIFIED

### AI-ERR-LAM-002

- **Liên kết bản ghi AI:** AI-LAM-001
- **Loại lỗi (`Error Type`):** API_MISUSE
- **Ngày phát hiện:** 2026-10-04
- **Đầu ra sai/thiếu sót và bối cảnh:** AI khởi tạo theme từ localStorage bằng `setTheme` đồng bộ trong `useEffect`, vi phạm quy tắc `react-hooks/set-state-in-effect` của React Compiler gây cascading render.
- **Vị trí (`file:hàm`):** `frontend/src/components/layouts/Header.tsx`, `features/auth/components/AuthTopBar.tsx`
- **Nguyên nhân phân tích:** AI áp dụng pattern React đời cũ thay vì dùng lazy state initialization (`useState(() => localStorage.getItem(...))`).
- **Cách phát hiện / bằng chứng:** ESLint (`react-hooks/set-state-in-effect`) báo lỗi.
- **Cách sửa:** Chuyển sang lazy state initialization (AI-LAM-002).
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** e0d9e97
- **Commit sửa (bắt buộc, khác commit trên):** bc777f3
- **Kiểm chứng sau sửa:** Theo AI-LAM-002: `npx eslint . --max-warnings 0`, `npm run build` qua.
- **Trạng thái (`Error Status`):** VERIFIED

### AI-ERR-LAM-003

- **Liên kết bản ghi AI:** AI-LAM-007
- **Loại lỗi (`Error Type`):** API_MISUSE
- **Ngày phát hiện:** 2026-10-04
- **Đầu ra sai/thiếu sót và bối cảnh:** AI lại tiếp tục khởi tạo Quota state bằng `setActionsToday` đồng bộ trong `useEffect`, vi phạm `react-hooks/set-state-in-effect`, đồng thời dùng `any` và thiếu dependency.
- **Vị trí (`file:hàm`):** `frontend/src/hooks/useQuota.ts:useQuota`
- **Nguyên nhân phân tích:** AI vẫn sinh code theo pattern React cũ, chưa bắt kịp tính năng lazy state init với `useState` và cách sync prop/state trực tiếp khi render.
- **Cách phát hiện / bằng chứng:** ESLint báo lỗi (theo tiêu đề commit sửa).
- **Cách sửa:** Sửa `useQuota` theo lazy state init, bỏ `any`, bổ sung dependency.
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** 4e378b7
- **Commit sửa (bắt buộc, khác commit trên):** 1d93dcf
- **Kiểm chứng sau sửa:** Log cũ không ghi.
- **Trạng thái (`Error Status`):** FIXED

### AI-ERR-LAM-004

- **Liên kết bản ghi AI:** AI-LAM-046
- **Loại lỗi (`Error Type`):** TEST_GAP
- **Ngày phát hiện:** 2026-10-23
- **Đầu ra sai/thiếu sót và bối cảnh:** Code mới của PR chịu tải Azure chỉ đạt 62.5% độ phủ (yêu cầu ≥ 80%): nhánh xử lý khi Azure huỷ nhận dạng nằm giữa lời gọi SDK nên không có test nào chạm tới, và nhánh `InterruptedException` khi chờ permit chưa được test.
- **Vị trí (`file:hàm`):** `shadowing/azure/AzurePronunciationScoringService.java:recognize`, `GuardedPronunciationScoringService.java:acquire`
- **Nguyên nhân phân tích:** AI để logic ánh xạ lỗi và ghi log ngay trong đoạn gọi SDK thay vì tách thành hàm test được, và không viết test cho nhánh bị ngắt luồng.
- **Cách phát hiện / bằng chứng:** Lâm thấy SonarCloud báo độ phủ code mới 62.5% trên PR.
- **Cách sửa:** Tách ánh xạ lỗi Azure ra `AzureCancellation`, thêm test cho nhánh huỷ nhận dạng và nhánh bị ngắt luồng.
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** c3c387f
- **Commit sửa (bắt buộc, khác commit trên):** ba1dd5b
- **Kiểm chứng sau sửa:** SonarCloud trên PR (log cũ không ghi độ phủ sau sửa).
- **Trạng thái (`Error Status`):** FIXED

## 3. Bằng chứng bổ sung (nếu cần)

Không lưu API key, mật khẩu, token, secret hoặc dữ liệu nhạy cảm trong file log.
