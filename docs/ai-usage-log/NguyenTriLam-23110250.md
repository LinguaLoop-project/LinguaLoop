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

### AI-LAM-050

- **Ngày:** 2026-10-31
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** EXPLANATION
- **Prompt chính / yêu cầu:** Từ một ảnh chụp trang Shadowing, giải thích vì sao điểm cả từ của `can` là 97 nhưng điểm từng âm vị thấp hơn ngưỡng đó, và việc Azure chấm bằng `en-US` ảnh hưởng gì đến thiết kế trang hiện tại
- **Vị trí code do AI sinh (`file:hàm`):**
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Không có thay đổi trong repo. Sinh viên dùng câu trả lời (điểm từ do Azure tổng hợp, không phải trung bình các âm; phiên âm trong câu lẫn Mỹ và Anh) làm cơ sở để chốt hướng chuẩn Mỹ ở các bản ghi sau.
- **Commit:**
- **Lỗi liên quan:** NONE

### AI-LAM-051

- **Ngày:** 2026-10-31
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** DATABASE
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Chốt giọng chấm là giọng Mỹ: tách phiên âm câu thành `ipa_us` (nguồn của âm đích) và `ipa_uk` (chỉ để hiển thị); đổi bảng `phonemes` từ 44 âm Anh-Anh sang 44 âm giọng Mỹ giống ký hiệu Azure en-US trả về, giữ nguyên `id` để mẹo, video, thống kê và lượt đã lưu đi theo; gộp `ɒ` vào `ɑ`, thêm âm `ɚ`; viết lại mẹo sửa âm theo giọng Mỹ; đổi 9 video khẩu hình giọng Anh sang video giọng Mỹ; làm gọn bộ chuyển đổi âm Azure
- **Vị trí code do AI sinh (`file:hàm`):** `backend/src/main/resources/db/migration/V20261031_2300__sentence_ipa_accents.sql`, `V20261031_2310__pronunciation_tips_us.sql`, `V20261031_2320__phoneme_mouth_videos_us.sql`; `backend/.../shadowing/azure/AzurePhonemeMapper.java:toTableSymbols`, `:tableSymbols`, `:convertRColoured`; `shadowing/azure/ExpectedPhonemes.java:wordsOf`, `:ofSentence`; `tutor/TutorAttemptService.java:wordIpa`; `lesson/entity/Sentence.java` (`ipaUs`, `ipaUk`); `lesson/dto/SentenceView.java`, `lesson/dto/response/SentenceResponse.java`; `shadowing/dto/AttemptSnapshot.java`; `shadowing/entity/Phoneme.java`; test `AzurePhonemeMapperTest.java`, `ExpectedPhonemesTest.java`, `ShadowingAttemptIntegrationTest.java:phonemeTable_isTheAmericanInventory_sameSymbolsAsAzureEnUs_ADR_0007`, `:everyPhonemeHasAMouthVideo_andTheNineBritishOnesWereReplacedByAmericanVideos_ADR_0007`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên quyết định các điểm thiết kế qua hỏi đáp với AI: đặt tên cột `ipa_us` thay vì giữ `ipa`, chỉ chuyển dữ liệu seed qua một file duy nhất, câu thiếu phiên âm một từ thì để NULL cả câu, ký hiệu `symbol` của bảng đổi tại chỗ (chọn "ý 2" là có bộ âm giọng Mỹ riêng) thay vì thêm cột phụ `symbol_us`; sinh viên chọn lại hướng sau khi AI phản biện phương án giữ bộ âm Anh trong bảng chấm. Sinh viên cũng yêu cầu lập danh sách video giọng Mỹ ứng viên cho 9 âm rồi viết migration cập nhật.
- **Commit:** 36b8d35
- **Lỗi liên quan:** NONE

### AI-LAM-052

- **Ngày:** 2026-10-31
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** DATABASE
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Sinh lại cột `ipa_us` (CMUdict kèm bảng ghi đè tay) và `ipa_uk` (espeak-ng giọng `en-gb`) cho toàn bộ 45.271 câu của seed, đúng định dạng mỗi từ một cụm; sửa `seed-lessons.ps1` vì sau khi chạy mọi chữ có dấu và ký hiệu IPA trong DB thành `?`
- **Vị trí code do AI sinh (`file:hàm`):** `backend/seed/02_sentences.sql.gz` (cột `ipa_us`, `ipa_uk`; file này do công cụ sinh, công cụ không nằm trong repo); `backend/seed/seed-lessons.ps1` (chép tệp vào container rồi `psql -f`; hàm `Invoke-Sql`; bước tự kiểm tra ký tự ngoài ASCII cuối script)
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chạy `seed-lessons.ps1` trên máy, phát hiện chữ có dấu và IPA bị thành `?` và báo lỗi kèm ảnh chụp; sinh viên yêu cầu không đưa công cụ sinh phiên âm (`backend/seed/tools/`) vào repo và AI đã gỡ khỏi các commit.
- **Commit:** f31e26a
- **Lỗi liên quan:** NONE

### AI-LAM-053

- **Ngày:** 2026-10-31
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Nút chuyển phiên âm US/UK ở trang Shadowing (theo ảnh mẫu): chọn UK thì hiện phiên âm Anh kèm dòng giải thích điểm vẫn chấm theo giọng Mỹ; ô âm vị giữ ký hiệu Mỹ và thêm ký hiệu Anh gần nhất ở dòng nhỏ
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/shadowing/components/IpaAccentSwitch.tsx`; `components/WordDetail.tsx` (ô âm vị, dòng `≈`); `components/ShadowingPractice.tsx` (`shownIpaAccent`, `shownIpa`, `ukMissing`); `hooks/useShadowingSettings.ts:load`; `utils.ts:ukEquivalent`, `:wordIpa`; `utils.test.ts`; `i18n/locales/vi/pages.json`, `en/pages.json` (mục `accent`); `features/lesson/types.ts`, `components/detail/TranscriptList.tsx` (đổi `ipa` thành `ipaUs`)
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên nêu ý tưởng nút chuyển US/UK, hỏi AI phản biện ý tưởng ghi nhãn Anh thay cho ký hiệu Mỹ, rồi chọn phương án giữ ký hiệu Mỹ làm ký hiệu chính; sinh viên chạy giao diện và gửi ảnh chụp để đối chiếu.
- **Commit:** 5893ad8
- **Lỗi liên quan:** NONE

### AI-LAM-054

- **Ngày:** 2026-11-01
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DICTIONARY
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Nối một từ trong câu ở trang Shadowing với từ điển: trước khi chấm bấm từ mở popup từ điển, sau khi chấm khung chi tiết từ có mục "Từ điển" (phiên âm từ điển US và UK kèm nút nghe, CEFR, nghĩa, từ gốc, nút xem đầy đủ); "Nghe mẫu từ" theo giọng đang chọn
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/shadowing/components/WordDictionarySection.tsx`; `components/WordDetail.tsx` (`listen`, `useWordLookup`); `components/SentenceWords.tsx` (từ chưa chấm dùng `LookupWord`); `hooks/useModelPlayer.ts:speakSegment` (tham số `lang`); `frontend/src/features/dictionary/index.ts`, `utils.ts:accentOrder`, `:mainPronunciation`, `:displayGroups`, `components/PronunciationButtons.tsx` (`firstAccent`), `utils.test.ts`; `i18n/locales/*/pages.json` (mục `dictionary`)
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên trả lời 8 câu hỏi thiết kế do AI đặt (nơi bấm, nội dung mục từ điển, hai nhãn phiên âm tách bạch, giọng nghe mẫu, không đổi backend, không đưa dữ liệu từ điển vào repo, phạm vi bản đầu) và nạp dữ liệu từ điển vào DB để chạy thử.
- **Commit:** bb52b3b
- **Lỗi liên quan:** NONE

### AI-LAM-055

- **Ngày:** 2026-11-01
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DATABASE
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Tạo công cụ chuyển ảnh bìa và âm thanh bài học từ Parroto sang S3 của hệ thống (thư mục `lesson/thumbnail/` và `lesson/audio/`), rồi viết lại seed bài học trỏ về S3; sửa công cụ khi gặp tệp gắn nhãn sai (ảnh PNG đặt tên `.webp`, âm thanh M4A đặt tên `.mp3`, MP3 có đệm byte 0)
- **Vị trí code do AI sinh (`file:hàm`):** `backend/seed/01_topics_lessons.sql.gz` (2.336 link `thumbnail_url` và `source_url` đổi sang S3; file do công cụ sinh, công cụ không nằm trong repo)
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên cung cấp bucket và khoá AWS qua biến môi trường, thêm các biến AWS mẫu vào `backend/.env.example`, tự chạy các bước tải về, tải lên, kiểm tra và viết lại seed, phát hiện bucket chưa công khai (`AccessDenied`) và lỗi nhãn tệp để AI sửa công cụ, rồi cho bucket đọc công khai hai thư mục `lesson/`.
- **Commit:** 75f3e41
- **Lỗi liên quan:** NONE

### AI-LAM-056

- **Ngày:** 2026-11-01
- **Công cụ AI / model:** Claude Code (Opus 5.5, Sonnet 5.5)
- **Phạm vi (`Scope`):** DOCUMENTATION
- **Loại công việc (`Task Type`):** DOCUMENTATION
- **Prompt chính / yêu cầu:** Ghi lại quyết định chấm theo giọng Mỹ và phiên âm Anh chỉ để hiển thị (ADR), các thuật ngữ mới (Giọng chấm, Phiên âm hiển thị, Âm đích, Mục từ, Phiên âm từ điển) và cách nạp dữ liệu từ điển nằm ngoài repo; soạn nội dung PR theo `pull_request_template.md`
- **Vị trí code do AI sinh (`file:hàm`):** `docs/adr/0007-cham-giong-my-hien-thi-phien-am-anh-my.md`; `docs/adr/0004-am-vi-azure-my-chuyen-sang-bang-phonemes.md`, `docs/adr/0005-am-dich-tu-phien-am-cua-cau-azure-cham-en-us.md` (cập nhật trạng thái); `GLOSSARY.md` (mục Phát âm, Từ điển); `backend/README.md` (mục "Dữ liệu từ điển (không nằm trong repo)")
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chốt các thuật ngữ và yêu cầu rút gọn nội dung commit.
- **Commit:** b5383ca, adae2d1
- **Lỗi liên quan:** NONE

### AI-LAM-057

- **Ngày:** 2026-11-06
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Từ hai ảnh chụp màn nghe chép và Shadowing, lên kế hoạch rồi làm cho nghe chép đồng nhất với Shadowing; bước 1: bỏ hàng chip YouTube, giờ và thanh các câu phía trên video, dùng thanh điều khiển gốc của YouTube, đầu trang theo mẫu Shadowing
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/dictation/components/MediaBar.tsx:MediaBar`; `frontend/src/features/dictation/usePlayer.ts` (`playerVars.controls`, `playerVars.fs`); `frontend/src/features/dictation/pages/DictationPage.tsx` (khối `<header>`); `frontend/src/i18n/locales/{vi,en}/dictation.json` (`backTo`)
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chốt các quyết định qua hỏi đáp trước khi làm: giữ thanh gốc của YouTube như Shadowing (không bỏ thanh gốc), chỉ bỏ hàng chip và thanh các câu tự vẽ, chỉ sửa class của nghe chép và không gộp thành phần dùng chung với Shadowing.
- **Commit:** 2453f5d
- **Lỗi liên quan:** NONE

### AI-LAM-058

- **Ngày:** 2026-11-06
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** DICTATION
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Bước 2: bấm một câu trong danh sách thì chọn và phát câu đó (câu cần làm tính 1 lần nghe, câu đã làm không đếm); người học tự tua hoặc tự phát bằng thanh YouTube thì màn hình đi theo câu chứa vị trí đó, trừ khi ô gõ đang có chữ; sửa UC-DICT-01 và AC-DICT-04, thêm AC-DICT-62..64; có test
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/dictation/position.ts:sentenceAt`, `:followTarget`; `position.test.ts` (7 test); `usePlayer.ts` (tham số `onSeek`, bộ theo dõi vị trí `WATCH_MS`, `SEEK_THRESHOLD_MS`); `pages/DictationPage.tsx:begin` (tham số `keepPlayer`), `:pickSentence`, bộ đi theo `followRef`; `docs/srs/use-cases/DICT.md` (UC-DICT-01 luồng 8a, 8c, 8d; AC-DICT-04, 62, 63, 64)
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chốt hành vi qua hỏi đáp: tua thì đổi câu như Shadowing nhưng giữ nguyên câu khi ô gõ đang có chữ; bấm câu phát cho cả câu đã làm; phát bằng thanh gốc không đếm lượt nghe; phải sửa đặc tả cùng PR.
- **Commit:** 448a190
- **Lỗi liên quan:** NONE

### AI-LAM-059

- **Ngày:** 2026-11-06
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Bước 3: danh sách câu và cỡ chữ theo mẫu Shadowing: khung, khoảng đệm, chip tiến độ, chip số lượt "N lần" (backend đếm mọi lượt) và dấu tick từ 80 điểm; kết quả và đáp án dùng `font-display font-bold` 22/26px, bản dịch `text-sm`; giữ ô gõ 20px
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/dictation/components/SentenceList.tsx`; `components/ResultDiff.tsx` (khối kết quả từng từ); `hooks.ts:useSubmitAttempt` (`attemptCount`); `backend/.../practice/repository/SentenceAttemptRepository.java:countDictationPerSentence`; `practice/service/PracticeAttemptServiceImpl.java:countDictationAttempts`; `dictation/service/DictationServiceImpl.java:getLesson`, `:toItem`; `dictation/dto/response/DictationLessonResponse.java` (`attemptCount`); `DictationAttemptHistoryIntegrationTest.java:lesson_countsEveryAttemptPerSentence_includingRetriesAndGiveUps`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chốt các điểm thiết kế: giữ chip mức, dấu ghim và dấu ghi chú trong danh sách; câu chưa làm vẫn che bằng dấu chấm theo số từ (không đổi sang dấu `*` theo chữ cái, để không lộ độ dài từng từ, BR-DICT-10); ô gõ giữ 20px.
- **Commit:** 03df3a1
- **Lỗi liên quan:** NONE

### AI-LAM-060

- **Ngày:** 2026-11-06
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** DOCUMENTATION
- **Loại công việc (`Task Type`):** DOCUMENTATION
- **Prompt chính / yêu cầu:** Lên kế hoạch rồi viết đặc tả cho lịch sử các lượt đọc, ghi chú dùng chung với nghe chép và Câu cần ôn của Shadowing: UC-SHADOW-10..12, AC-SHADOW-40..53, BR-SHADOW-15..18; sửa BR-DICT-14 và BR-DICT-17 cho khớp
- **Vị trí code do AI sinh (`file:hàm`):** `docs/srs/use-cases/SHADOWING.md` (UC-SHADOW-10, 11, 12; AC-SHADOW-40..53; bỏ dòng "hàng đợi ôn" ở mục Chưa thuộc phạm vi); `docs/srs/business-rules.md` (BR-SHADOW-15..18; câu cuối của BR-DICT-14 và BR-DICT-17)
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chốt các quyết định qua hỏi đáp: ghi chú dùng chung hai chế độ, ngưỡng 60 và 80 như nghe chép, mỗi chế độ một danh sách riêng, ghim và ghi chú cần đã có lượt đọc, lịch sử không cho nghe lại bản ghi âm, làm trong một PR.
- **Commit:** f2cb044
- **Lỗi liên quan:** NONE

### AI-LAM-061

- **Ngày:** 2026-11-06
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Backend cho UC-SHADOW-10..12: Câu cần ôn theo chế độ (`/review/{mode}/sentences`, danh sách gộp `/review/sentences`, lọc theo bài), lượt shadowing dưới 60 điểm thêm câu và từ 80 gỡ câu trong cùng giao dịch lưu lượt, API lịch sử và mở lại một lượt cũ, ghi chú được khi câu đã có lượt ở bất kỳ chế độ nào; test tích hợp giả lập Azure
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../practice/repository/SentenceReviewRepository.java:add`, `:resolve`, `:findEntries`, `:hasAttempt`, `:hasAnyAttempt`; `practice/service/SentenceReviewServiceImpl.java:recordScore`, `:pin`, `:list`; `practice/controller/SentenceReviewController.java`; `practice/service/SentenceNoteServiceImpl.java:save`; `shadowing/service/ShadowingAttemptRecorder.java:save`; `shadowing/service/ShadowingAttemptServiceImpl.java:history`, `:attempt`, `:toResponses`; `shadowing/repository/ShadowingAttemptRepository.java:findHistory`, `:findHeadById`; `shadowing/controller/ShadowingController.java`; `ShadowingReviewHistoryNotesIntegrationTest.java` (13 test)
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chốt thiết kế API qua hỏi đáp: dùng lại đường dẫn nghe chép cũ để frontend không phải đổi, danh sách lịch sử nhẹ (chưa kèm từng từ) và mở chi tiết từng lượt riêng, hai chế độ độc lập.
- **Commit:** 074164d
- **Lỗi liên quan:** NONE

### AI-LAM-062

- **Ngày:** 2026-11-06
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Tách nút ghim Câu cần ôn, ô ghi chú, API và hook của hai việc này khỏi `dictation` và `mywords` thành `features/practice` dùng chung cho cả ba nơi; hành vi giữ nguyên
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/practice/api.ts:practiceApi`; `practice/hooks.ts:useSetReview`, `:useSaveNote`, `:useDeleteNote`, `:useReviewEntries`, `:useNoteEntries`, `:refreshPractice`; `practice/components/NotePanel.tsx`; `practice/components/ReviewPinButton.tsx`; `dictation/components/SentenceTools.tsx`; `mywords/components/ReviewTab.tsx`, `NotesTab.tsx`; `i18n/locales/{vi,en}/practice.json`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chọn hướng tách thành một feature có component dùng chung thay vì chép bản riêng cho Shadowing.
- **Commit:** 2a545aa
- **Lỗi liên quan:** NONE

### AI-LAM-063

- **Ngày:** 2026-11-06
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Thanh công cụ dưới câu đã đọc ở trang Shadowing (ghim Câu cần ôn, ghi chú với phím N, lịch sử các lượt đọc kèm từ tô màu và Nhận xét AI đã lưu), dấu ghim và ghi chú ở danh sách câu, mở thẳng câu qua `?sentence=<id>`, báo khi lượt dưới 60 điểm đưa câu vào Câu cần ôn
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/shadowing/components/ShadowingTools.tsx`; `components/HistoryPanel.tsx`; `components/ShadowingPractice.tsx` (khối `reviewQuery`, `toolState`, khởi tạo `index` theo `?sentence=`, `submit`); `components/SentenceList.tsx`; `hooks/useShadowing.ts:useAttemptHistory`, `:useHistoryAttempt`; `hooks/useShadowingHotkeys.ts` (phím N); `services/shadowingService.ts:getHistory`, `:getAttempt`; `shadowing/i18n.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chốt bố cục: thanh công cụ chỉ ở tab Luyện, ẩn khi đang trong phiên gia sư, tab Xem không có thanh này. Phím tắt Space, R, C đã có sẵn kiểm tra đang gõ chữ nên không phải sửa.
- **Commit:** c682f9c
- **Lỗi liên quan:** NONE

### AI-LAM-064

- **Ngày:** 2026-11-06
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Trang "Từ & câu đã lưu" gộp Câu cần ôn của nghe chép và Shadowing: nhãn chế độ trên mỗi dòng, bộ lọc Tất cả / Nghe chép / Shadowing, "Luyện lại" mở đúng chế độ tại đúng câu; sửa nhãn đọc màn hình cho dấu ghim và ghi chú ở danh sách câu
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/mywords/components/ReviewTab.tsx`; `mywords/links.ts:shadowingUrl`; `mywords/links.test.ts`; `mywords/pages/MyWordsPage.tsx`; `shadowing/components/SentenceList.tsx`, `dictation/components/SentenceList.tsx` (bọc dấu bằng `span role="img"`); `i18n/locales/{vi,en}/mywords.json`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chốt: danh sách gộp hai chế độ có bộ lọc, Shadowing không có chế độ làm lại.
- **Commit:** 8d2549d
- **Lỗi liên quan:** AI-ERR-LAM-005

### AI-LAM-065

- **Ngày:** 2026-11-07
- **Công cụ AI / model:** Claude Code (Opus 5.5, Sonnet 5.5)
- **Phạm vi (`Scope`):** DOCUMENTATION
- **Loại công việc (`Task Type`):** DOCUMENTATION
- **Prompt chính / yêu cầu:** Sửa đặc tả cho hai thay đổi do Lâm yêu cầu: (1) hệ thống hỏi trước khi lưu câu điểm thấp và trước khi bỏ câu từ 80 điểm khỏi Câu cần ôn thay vì tự đổi danh sách, (2) ghi chú tách riêng cho nghe chép và Shadowing; sửa thuật ngữ trong `GLOSSARY.md`
- **Vị trí code do AI sinh (`file:hàm`):** `docs/srs/business-rules.md` (BR-DICT-14, 15, 17; BR-SHADOW-15, 17, 19); `docs/srs/use-cases/DICT.md` (UC-DICT-10, AC-DICT-49, 54..56, 65..67); `docs/srs/use-cases/SHADOWING.md` (UC-SHADOW-11, 12; AC-SHADOW-43, 44, 46..48, 53..56); `GLOSSARY.md` (Câu cần ôn, Ghi chú)
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên đổi hướng giữa chừng và chốt: lượt từ 80 điểm cũng hỏi chứ không tự gỡ; đề xuất tách ghi chú theo chế độ thay vì thêm cột `source_mode` (AI chỉ phân tích ưu nhược); bỏ nút phụ "Mở ở chế độ kia" vì không còn cần; làm trực tiếp trên nhánh của PR #50.
- **Commit:** 2c17b31
- **Lỗi liên quan:** NONE

### AI-LAM-066

- **Ngày:** 2026-11-07
- **Công cụ AI / model:** Claude Code (Opus 5.5, Sonnet 5.5)
- **Phạm vi (`Scope`):** SHADOWING
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Backend: bỏ tự thêm và tự gỡ Câu cần ôn ở cả nghe chép lẫn Shadowing; ghim nhận lý do (`manual` hoặc `low_score`); migration thêm cột `mode` cho ghi chú (ghi chú cũ thành nghe chép) với khoá duy nhất theo chế độ; API ghi chú theo chế độ; viết lại test cho hành vi mới
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../practice/service/SentenceReviewServiceImpl.java:pin`; `practice/controller/SentenceReviewController.java:pin`; `practice/service/SentenceNoteServiceImpl.java:save`, `:find`, `:list`; `practice/repository/SentenceNoteRepository.java:findOne`, `:findEntries`; `practice/controller/SentenceNoteController.java`; `V20261107_0900__sentence_notes_per_mode.sql`; `shadowing/service/ShadowingAttemptRecorder.java:save`; `dictation/service/DictationServiceImpl.java:submitAttempt`; `SentenceReviewApiIntegrationTest.java`, `SentenceNoteApiIntegrationTest.java`, `ShadowingReviewHistoryNotesIntegrationTest.java` (thêm `notesOfTheTwoModes_areIndependent`)
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chốt thiết kế: lý do `low_score` cho lưu từ hộp hỏi, `manual` cho ghim tay; ghi chú cũ chuyển thành ghi chú nghe chép vì Shadowing chưa từng có ghi chú.
- **Commit:** 363c986
- **Lỗi liên quan:** NONE

### AI-LAM-067

- **Ngày:** 2026-11-07
- **Công cụ AI / model:** Claude Code (Opus 5.5, Sonnet 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Hộp hỏi dùng chung cho nghe chép và Shadowing: dưới 60 điểm mà câu chưa trong danh sách thì hỏi lưu, từ 80 điểm mà câu đang trong danh sách thì hỏi bỏ; Esc hoặc bấm ra ngoài không đổi gì; phím tắt của trang tạm ngưng khi hộp hỏi mở; không còn thông báo tự thêm
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/practice/reviewPrompt.ts:reviewPromptKind`; `reviewPrompt.test.ts` (5 test); `practice/components/ReviewPromptDialog.tsx`; `dictation/pages/DictationPage.tsx:onAttemptDone`; `dictation/useDictationShortcuts.ts` (tham số `suspended`); `shadowing/components/ShadowingPractice.tsx` (`submit`, `reviewPrompt`, `useShadowingHotkeys`); `practice/api.ts:pinReview`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chốt hành vi qua hỏi đáp: không nhớ lựa chọn "Không" (hỏi lại lần sau), đóng hộp coi như chọn nút thứ hai, lượt bỏ cuộc cũng hỏi, Enter khi hộp mở chỉ bấm nút của hộp.
- **Commit:** 686f85c
- **Lỗi liên quan:** NONE

### AI-LAM-068

- **Ngày:** 2026-11-07
- **Công cụ AI / model:** Claude Code (Opus 5.5, Sonnet 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Ghi chú theo chế độ ở frontend: API và hook nhận chế độ, Shadowing và nghe chép mỗi bên chỉ thấy ghi chú của mình, tab Ghi chú ở `mywords` có nhãn chế độ và bộ lọc, bấm ghi chú mở đúng chế độ; khung Ghi chú của tôi ở trang bài học hiện nhãn chế độ
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/practice/api.ts:saveNote`, `:deleteNote`, `:listNotes`; `practice/hooks.ts:useSaveNote`, `:useDeleteNote`, `:useNoteEntries`; `mywords/links.ts:modeUrl`; `mywords/components/NotesTab.tsx`; `lesson/components/detail/AsideCards.tsx:NotesCard`; `shadowing/components/ShadowingTools.tsx`; `mywords/links.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chốt: mỗi ghi chú thuộc đúng một chế độ nên bấm vào là mở chế độ đó; khung ở trang bài học chỉ có nhãn, không có bộ lọc.
- **Commit:** 4cabe27
- **Lỗi liên quan:** NONE

### AI-LAM-069

- **Ngày:** 2026-11-09
- **Công cụ AI / model:** Claude Code (Opus 5.5, Sonnet 5.5)
- **Phạm vi (`Scope`):** BACKEND
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Backend chức năng Từ vựng: bộ từ hệ thống nạp từ seed riêng không phụ thuộc từ điển, API danh sách và chi tiết bộ kèm khoá Pro ở server, API học một phần (phiên học, ghi câu trả lời, chấm SM-2 cho mọi cách học, không ghi trùng khi gửi lại), API ôn thẻ đến hạn (tối đa 50 thẻ, phiên ôn); sau đó chỉnh lại theo đặc tả module HT mới
- **Vị trí code do AI sinh (`file:hàm`):** `backend/seed/seed-vocabulary.sh`, `seed-vocabulary.ps1`; `vocab/service/Sm2.java:grade`, `:qualityOf`, `:statusOf`; `vocab/service/VocabDeckServiceImpl.java:list`, `:detail`, `:isLocked`; `vocab/service/VocabLearnServiceImpl.java:part`, `:openSession`, `:answer`; `vocab/service/VocabReviewServiceImpl.java:queue`, `:openSession`; `vocab/repository/VocabDeckRepository.java:findDecks`, `:findOverview`; `vocab/repository/VocabLearnRepository.java`; `vocab/repository/VocabReviewRepository.java:findDue`, `:countDue`, `:findNextDueAt`; migration `V20261107_1100__vocab_review_log_idempotency.sql`, `V20261109_1000__vocab_review_sessions.sql`; `Sm2Test`, `VocabDeckApiIntegrationTest`, `VocabLearnApiIntegrationTest`, `VocabReviewApiIntegrationTest`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chốt: bộ từ lấy từ file seed của mình chứ không sinh từ từ điển (AI ban đầu sinh bộ từ từ từ điển theo mức CEFR rồi bỏ); mỗi lượt học 10 thẻ; sửa mức CEFR trong seed; đặc tả chuẩn là các thư mục module (UC-HT, BR-HT) nên đổi mã tham chiếu và sửa cách chấm theo BR-HT-12; chọn cách bỏ cách học Lặp lại.
- **Commit:** 0e84112, a5bc7dd, be4ebdd, f4f6f37, 42a7510
- **Lỗi liên quan:** AI-ERR-LAM-006

### AI-LAM-070

- **Ngày:** 2026-11-09
- **Công cụ AI / model:** Claude Code (Opus 5.5, Sonnet 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Frontend chức năng Từ vựng: trang danh sách bộ có ảnh bìa, hiệu ứng nổi và quầng sáng như thẻ bài học, tìm kiếm không dấu và bộ lọc; trang chi tiết bộ; trang học một phần với bốn cách học (Đoán, Flashcard, Trắc nghiệm, Trắc nghiệm đảo) chia lượt 10 thẻ, hàng đợi chung để đổi cách học giữa chừng vẫn giữ tiến độ, thẻ sai xuống cuối lượt; tab Ôn thẻ đến hạn; hàng đợi gửi lại câu trả lời khi mất mạng
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/vocab/learn.ts:maskExample`, `:hintMask`, `:buildOptions`, `:startRound`, `:answerCard`, `:nextCard`, `:roundScore`; `vocab/utils.ts:filterDecks`, `:groupByCategory`; `vocab/answerQueue.ts`; `vocab/useAnswerSubmit.ts`; `vocab/components/DeckCard.tsx`; `vocab/components/learn/LearnSession.tsx`, `GuessView.tsx`, `ChoiceView.tsx`, `FlashView.tsx`, `RoundDone.tsx`; `vocab/components/review/ReviewPanel.tsx`, `ReviewSession.tsx`; `vocab/pages/VocabPage.tsx`, `DeckPage.tsx`, `PartPage.tsx`; `vocab/learn.test.ts`, `utils.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên yêu cầu thêm ảnh bìa, hiệu ứng spotlight, thanh tìm kiếm và bộ lọc cho trang danh sách; chọn tab Ôn thẻ trên trang Từ vựng; chốt bỏ cách học Lặp lại và đổi cách học giữa chừng không mất tiến độ theo đặc tả HT.
- **Commit:** 291ffd7, f93e986, 5a6411f, 2eb3233
- **Lỗi liên quan:** NONE

### AI-LAM-071

- **Ngày:** 2026-11-12
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** TESTING
- **Loại công việc (`Task Type`):** DOCUMENTATION
- **Prompt chính / yêu cầu:** Đối chiếu rubric kiểm thử với hiện trạng dự án; đo coverage backend và nâng cổng JaCoCo lên 70%; lập quy ước kiểm thử, kế hoạch kiểm thử (kèm bản ví dụ), bảng truy vết AC sang test cho 18 module (điền module TK), sổ lỗi, mẫu issue và PR, khung e2e/perf, script sinh báo cáo đối chiếu rubric
- **Vị trí code do AI sinh (`file:hàm`):** `tools/test-report/generate.py:cmd_sync`, `:cmd_report`; `docs/convention/TESTING-CONVENTION.md`; `docs/test/TEST-PLAN.md`, `TEST-PLAN-EXAMPLE.md`, `RUBRIC-CHECKLIST.md`, `BUG-REGISTER.md`, `TRACEABILITY-AC-TEST.md`, `traceability/*.md`; `.github/ISSUE_TEMPLATE/bug_report.yml`; `e2e/README.md`, `perf/README.md`, `frontend/src/test/README.md`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên cung cấp rubric và mẫu báo cáo, yêu cầu từng phần, chọn người phụ trách tài liệu là cả hai thành viên, yêu cầu bổ sung Priority và Assignee cho sổ lỗi theo danh sách chuẩn. Số liệu coverage 91,1% lấy từ chạy `./mvnw verify` thật; 41 dòng AC của module TK được đối chiếu với tên test hiện có bằng script kiểm tra mọi tham chiếu test tồn tại. Các module khác, tên người phụ trách theo module, ngưỡng frontend và hiệu năng trong bản ví dụ là đề xuất chưa xác nhận
- **Commit:** 589afbe, f02fa26, ae49e9e, 17a4802, fcb5bcb, 4125eda, df3708c
- **Lỗi liên quan:** NONE

### AI-LAM-072

- **Ngày:** 2026-11-13
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DOCUMENTATION
- **Loại công việc (`Task Type`):** DOCUMENTATION
- **Prompt chính / yêu cầu:** Rà soát điều kiện sau của các use case để viết thành kết quả đạt được thay cho "không thay đổi thông tin", rút gọn; bổ sung thống kê lỗi nghe chép theo nhóm từ vào đặc tả module Thống kê học tập
- **Vị trí code do AI sinh (`file:hàm`):** `docs/srs/TH-xem-thong-ke-hoc-tap/quy-tac-nghiep-vu.md` (BR-TH-05, BR-TH-12), `docs/srs/DI-dictation-cau-da-luu/quy-tac-nghiep-vu.md` (BR-DI-10), `docs/srs/TH-xem-thong-ke-hoc-tap/usecase.md` (UC-TH-01, AC-TH-04, AC-TH-21, AC-TH-22), điều kiện sau của UC-HT-01, UC-HT-07, UC-PR-01, UC-TC-01, UC-TC-02, UC-TC-03, UC-TH-01, UC-TH-02, UC-TH-03; `GLOSSARY.md` (Nhóm từ); `docs/test/traceability/TH-xem-thong-ke-hoc-tap.md`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên nêu tiêu chuẩn viết điều kiện sau theo các module quản lý của Kế, yêu cầu rút gọn, chọn thêm thống kê theo nhóm từ dựa trên khảo sát và cách phân loại đã có trong mã nguồn. Sáu nhóm từ và quy tắc xếp nhóm được đối chiếu với `WordClassifier`, `WordClass` và các danh sách từ trong `backend/src/main/resources/dictation/`; chưa kiểm tra trang thống kê ở frontend. Ví dụ AC-TH-21 và AC-TH-22 chưa chạy thử trên hệ thống
- **Commit:** 5c056a0, 3129c8e, c8200f8
- **Lỗi liên quan:** NONE

### AI-LAM-073

- **Ngày:** 2026-11-17
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Lập kế hoạch rồi triển khai UC-TK-08 (thiết lập hồ sơ học tập) và UC-HT-05 (Ôn tập hôm nay, kèm phiên Ôn câu của UC-HT-04 và trang Hôm nay) theo đặc tả module, phiên ôn chuyển liền mạch từ thẻ sang câu
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../user/service/UserAccountServiceImpl.java:saveLearningProfile`, `user/controller/UserController.java:saveLearningProfile`; `review/DailyReviewServiceImpl.java:plan`, `:sentencePlan`, `review/DailyQuota.java:of`; `practice/repository/SentenceReviewRepository.java:findReviewableToday`, `:markReviewed`, `practice/service/SentenceReviewServiceImpl.java:markReviewed`; `vocab/service/VocabReviewServiceImpl.java:queue`, `:dueSummary`; `frontend/src/features/user/components/LearningProfileForm.tsx`, `user/pages/OnboardingPage.tsx`, `auth/navigation.ts:onboardingRedirectFor`; `features/review/` (toàn thư mục: `flow.ts`, `pages/DailyReviewPage.tsx`, `pages/SentenceReviewPage.tsx`, `pages/TodayPage.tsx`, `components/SentenceReviewFlow.tsx`, `DictationReviewStep.tsx`, `ShadowingReviewStep.tsx`, `DailyCards.tsx`, `ReviewSummary.tsx`); `vocab/components/review/ReviewSession.tsx` (chế độ nhúng); test `UserAccountServiceTest`, `UserControllerIntegrationTest`, `DailyReviewApiIntegrationTest`, `VocabReviewApiIntegrationTest`, `navigation.test.ts`, `flow.test.ts`, `i18n.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên giao đề, trả lời từng vòng câu hỏi thiết kế và quyết định: chia hai PR (TK-08 cùng HT-05 là một, HT-08 là một), chỉ chặn học viên chưa thiết lập hồ sơ ở frontend, trang Hôm nay chỉ hiện khối có dữ liệu thật, không lưu phiên ôn ở máy chủ, làm màn ôn câu riêng thay vì dùng lại hai trang luyện, bỏ mockup và sẽ nhận xét giao diện sau, yêu cầu chuyển liền mạch từ thẻ sang câu, duyệt kế hoạch. AI đổi một chi tiết so với kế hoạch đã duyệt: đánh dấu "đã ôn hôm nay" bằng endpoint riêng `POST /review/{mode}/sentences/{id}/reviewed` (chỉ nhận khi vừa có lượt thật trong 1 giờ) thay vì tham số `source=review` trên hai API nộp lượt, để không sửa luồng chấm Azure; và dùng lại `usePlayer` thay vì `loadVideoById`. Sinh viên chưa xem giao diện và chưa góp ý; chưa tự chạy Shadowing với Azure thật (môi trường thử không có khoá Azure, chỉ thấy nhánh lỗi chấm).
- **Commit:** f50eda9, acd6ae8, a49fa37, 4ade25b, f46bc8e, 7330233
- **Lỗi liên quan:** AI-ERR-LAM-007

### AI-LAM-074

- **Ngày:** 2026-11-18
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Bổ sung ảnh minh họa thẻ ở Flashcard và Đoán; cho mức Dễ có ý nghĩa ngay từ lần nhớ đầu; khi không còn gì để ôn thì trang Hôm nay gợi ý phần từ mới kế tiếp và một bài nghe chép chưa làm
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../vocab/repository/VocabLearnRepository.java:CARD_COLUMNS`, `vocab/service/CardViews.java:of`, `vocab/dto/LearnView.java:Card`; `vocab/service/Sm2.java:grade`; `vocab/repository/VocabSuggestionRepository.java:findParts`, `vocab/service/VocabSuggestionServiceImpl.java:pick`; `lesson/repository/LessonRepository.java:findUnpracticedDictationLesson`, `lesson/service/LessonQueryServiceImpl.java:suggestDictationLesson`; `review/DailyReviewServiceImpl.java:suggestionsFor`; `frontend/src/features/vocab/components/learn/shared.tsx:CardImage`, `FlashView.tsx`, `GuessView.tsx`; `features/review/components/SuggestionCards.tsx`; test `Sm2Test`, `VocabLearnApiIntegrationTest`, `VocabSuggestionServiceTest`, `DailyReviewApiIntegrationTest`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chọn hướng A trong bốn hướng AI đề xuất cho người học chưa có gì để ôn, yêu cầu thêm ảnh ở Đoán dù đặc tả cũ ghi Đoán không hiện ảnh, và yêu cầu đổi quy tắc SM-2 để Dễ khác Được từ đầu. AI tự chọn các con số 4 và 10 ngày cho Dễ ở hai lần nhớ đầu, cách xếp ưu tiên bộ gợi ý (bộ vừa chấm thẻ gần nhất, rồi bộ hệ thống đầu tiên) và bài nghe chép gợi ý (mức CEFR thấp nhất, nhiều lượt xem nhất); sinh viên chưa xác nhận các con số và thứ tự này. Đã sửa BR-HT-11, BR-HT-17 và mô tả UC-HT-05 theo các thay đổi đó. Chạy thật trên trình duyệt thấy gợi ý hiện đúng, nút Dễ ghi 4 ngày với thẻ mới; chưa thử ảnh thẻ lưu trên S3 thật.
- **Commit:** 70c59b1, 0c53531, e131cbb, 62cfa42, ef9664f, afe3651 (gợi ý Shadowing: sinh viên chọn ưu tiên bài đã nghe chép; chưa chạy thử trên trình duyệt)
- **Lỗi liên quan:** NONE

### AI-LAM-075

- **Ngày:** 2026-11-18
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** FULLSTACK
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Sửa lỗi sau khi ôn hết "Ôn tập hôm nay" thì trang Hôm nay vẫn hiện lại phần ôn tập; lên kế hoạch qua vòng hỏi đáp thiết kế rồi triển khai, đồng thời viết lại ngắn gọn phần mô tả UC-HT-05
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../review/DailyReviewServiceImpl.java:plan`, `review/DailyPlanView.java`; `vocab/repository/VocabReviewRepository.java:countReviewedSince`; `practice/repository/SentenceReviewRepository.java:countReviewedSince`; `frontend/src/features/review/flow.ts:cardCount`, `pages/TodayPage.tsx:QuotaStat`, `pages/DailyReviewPage.tsx`, `components/ReviewSummary.tsx`; test `DailyReviewApiIntegrationTest`, `flow.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** AI chẩn đoán nguyên nhân: định mức mới chỉ giới hạn độ dài một phiên nên thẻ và câu tồn vẫn đưa phần ôn trở lại. Sinh viên duyệt các quyết định: định mức tính cho cả ngày, chỉ đếm thẻ trong lượt ôn (mỗi thẻ một lần, không tính học từ mới), phiên mở lại chỉ lấy phần còn lại, trang Hôm nay hiện tiến độ và nút "Ôn thêm", thuật ngữ "Định mức ôn ngày"; sinh viên tự yêu cầu viết lại phần mô tả UC-HT-05 ngắn hơn. Đã sửa BR-HT-24, UC-HT-05, AC-HT-37, AC-HT-39, thêm AC-HT-58 đến AC-HT-60 và mục từ trong GLOSSARY. Chạy thật trên trình duyệt với dữ liệu giả lập bằng SQL (chưa chấm tay một phiên ôn đầy đủ); thử lần đầu thấy nút "Ôn thêm" không hiện khi không có gợi ý nào và đã sửa. Câu đã gỡ khỏi danh sách sau khi ôn không được đếm vào tiến độ.
- **Commit:** 6ee48e6
- **Lỗi liên quan:** AI-ERR-LAM-008

### AI-LAM-076

- **Ngày:** 2026-11-18
- **Công cụ AI / model:** Claude Code (Sonnet 5.5, Opus 5.5 cho phần lên kế hoạch)
- **Phạm vi (`Scope`):** FULLSTACK
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Lập kế hoạch rồi triển khai UC-HT-08 "Bộ của tôi" (thêm, đổi tên, xóa bộ từ vựng cá nhân) theo đặc tả module HT, làm ở nhánh riêng tách từ nhánh onboarding và ôn tập hằng ngày
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../vocab/controller/MyDeckController.java`, `vocab/service/MyDeckServiceImpl.java:create`, `:rename`, `:delete`, `:validName`, `vocab/repository/MyDeckRepository.java:findAll`, `:existsName`, `:softDelete`; `frontend/src/features/vocab/myDecks.ts:myDeckFailure`, `myDecksApi.ts`, `myDecksHooks.ts`, `components/mine/MyDecksPanel.tsx`, `MyDeckDialog.tsx`, `MyDeckDeleteDialog.tsx`, `MyDeckCard.tsx`, `pages/VocabPage.tsx` (tab thứ ba); test `MyDeckApiIntegrationTest`, `myDecks.test.ts`, `myDecksI18n.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** AI đọc đặc tả và phát hiện spec chỉ quản lý tên bộ, không có use case nào thêm thẻ vào bộ cá nhân nên bộ mới tạo là bộ trống; sinh viên đồng ý làm đúng phạm vi UC-HT-08 và ghi rõ giới hạn đó trong tài liệu. Sinh viên duyệt các quyết định: tab thứ ba "Bộ của tôi" ở trang Từ vựng, xóa mềm giữ thẻ và tiến độ, tên 1 đến 100 ký tự không phân biệt hoa thường, không giới hạn số bộ, cho cả gói Free và Pro, chưa làm trang chi tiết bộ; sinh viên yêu cầu tách nhánh từ nhánh onboarding và ôn tập hằng ngày thay vì từ main (AI đề xuất main). AI tự chọn dùng lại `ConflictException` (409) cho tên trùng theo cách bộ của giáo viên đã làm và bắt thêm vi phạm chỉ mục duy nhất khi hai yêu cầu chạy cùng lúc. Chạy thật trên trình duyệt: trạng thái trống, tên trống, tên trùng khác hoa thường, tạo, đổi tên, xóa; thẻ của bộ đã xóa rời hàng đợi ôn. Chưa có test giao diện cho hộp thoại và tab nên các AC-HT-55 đến 57 ở mức "một phần".
- **Commit:** 593071c
- **Lỗi liên quan:** NONE

### AI-LAM-077

- **Ngày:** 2026-11-19
- **Công cụ AI / model:** Claude Code (Sonnet 5.5, Opus 5.5 cho phần lên kế hoạch)
- **Phạm vi (`Scope`):** FULLSTACK
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Bộ cá nhân tạo ra đang trống và không có CRUD thẻ; dựa trên tính năng quản lý nhóm thẻ và thẻ đã có của giáo viên để cài đặt cho học viên (UC-HT-09), kèm học bộ cá nhân
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../vocab/service/VocabDeckContentServiceImpl.java:Actor`, `:addGroup`, `:addCard`, `:learnerDeck`, `:rejectImage` (bản có `Actor`); `vocab/service/MyDeckContentServiceImpl.java`, `StudentGuard.java`; `vocab/controller/MyDeckContentController.java`; `vocab/repository/VocabDeckRepository.java:findDecks`; `vocab/service/VocabDeckManageServiceImpl.java:getForLearner`, `:listCardsForLearner`; `frontend/src/features/vocab/components/manage/DeckDetailView.tsx` (vai trò `learner`), `CardDialog.tsx`, `GroupDialog.tsx`, `deckContentApi.ts`, `deckContentHooks.ts`, `pages/MyDeckDetailPage.tsx`, `components/learn/LearnSession.tsx:canReport`; test `MyDeckContentApiIntegrationTest`, `deckManagePaths.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** AI phân tích phần dùng lại được và phải sửa; sinh viên chọn phạm vi (thẻ nhập tay cộng nhập Excel/CSV, không có ảnh, mở học bộ cá nhân, chưa làm tra từ điển riêng), chọn học viên **tự quản lý nhóm** như giáo viên (AI đề xuất nhóm ngầm) và duyệt kế hoạch. Sinh viên đồng ý để ô tra từ điển của hộp thẻ giáo viên đi kèm. AI tự chọn tách bước kiểm tra chủ bộ thành `Actor` trong lõi chung thay vì sao chép service, và dùng lại trang chi tiết bộ của giáo viên bằng vai trò `learner`. Đã viết UC-HT-09, BR-HT-26, BR-HT-27, AC-HT-62 đến 68. Chạy thật trên trình duyệt: tạo nhóm, thêm thẻ, nhập CSV (cả tệp trùng từ và tệp hợp lệ), mở trang học và vào phiên học. Phát hiện khi chạy: nút "Report" hiện trên thẻ bộ cá nhân dù báo cáo chỉ nhận bộ thư viện, đã ẩn bằng cờ `personal`. Chưa có test giao diện nên phần lớn AC ở mức "một phần".
- **Commit:** 8d601c3, 06d2c48 (AC-HT-69: sinh viên hỏi lại về điền sẵn từ từ điển; AI kiểm tra trên trình duyệt thật thấy tính năng đã có nhờ dùng lại hộp thẻ của giáo viên, chỉ bổ sung đặc tả và test)
- **Lỗi liên quan:** NONE

### AI-LAM-078

- **Ngày:** 2026-11-19
- **Công cụ AI / model:** Claude Code (Sonnet 5.5, Opus 5.5 cho phần lên kế hoạch)
- **Phạm vi (`Scope`):** FULLSTACK
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Thiết kế thêm thẻ nhanh vào Bộ của tôi từ từ điển hoặc từ bài học, nút "Thêm vào bộ" đặt ở vị trí tương tự nút "Lưu" (UC-HT-10)
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../vocab/service/DictionaryCardContent.java`, `VocabDeckContentServiceImpl.java:addFromDictionary`, `MyDeckContentServiceImpl.java:addFromDictionary`, `vocab/controller/MyDeckContentController.java:addFromDictionary`, `vocab/repository/VocabDeckContentRepository.java:setCardSourceSentence`, `SavedWordWriter.java` (dùng chung bộ chuyển đổi); `frontend/src/features/vocab/quickAdd.ts:runQuickAdd`, `quickAddFailure`, `components/quickAdd/QuickAddPanel.tsx`, `QuickAddToggle.tsx`, `features/dictionary/components/MeaningActions.tsx`, `WordCard.tsx`; test `MyDeckQuickAddApiIntegrationTest`, `quickAdd.test.ts`, `myDecksI18n.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên giao đề thiết kế và yêu cầu vị trí nút giống nút "Lưu". AI khảo sát mã nguồn (nút "Lưu" chỉ nằm ở một chỗ trong `WordCard`, dùng chung cho ô tra từ điển và chữ bấm trong câu bài học) và đưa ra 8 điểm thiết kế kèm đề xuất; sinh viên đồng ý cả 8 và duyệt kế hoạch: khung chọn bộ và nhóm mở ngay dưới dòng nghĩa thay vì hộp thoại lồng, nhớ bộ và nhóm gần nhất, tạo bộ hoặc nhóm "Từ mới" ngay trong khung, chặn từ trùng trong bộ, thẻ nhớ câu gốc khi thêm từ câu bài học, endpoint riêng để máy chủ chép nội dung từ từ điển, chỉ học viên thấy nút. AI tự chọn gỡ bộ hoặc nhóm vừa tạo trong lần thêm nếu thêm thẻ thất bại để không để lại bộ trống, và dùng lại `audioOf` để âm thanh giống khi nhập tay. Chạy thật trên trình duyệt với từ điển đầy đủ: thêm từ ô tra từ điển khi chưa có bộ nào, từ trùng, ghi nhớ lựa chọn, thêm từ câu bài học (thẻ lưu đúng câu gốc), thông báo kèm liên kết "Xem bộ". Chưa thử nút với tài khoản giáo viên và ở dạng chia nên AC-HT-75 ở mức "một phần".
- **Commit:** f2640c8
- **Lỗi liên quan:** NONE

### AI-LAM-079

- **Ngày:** 2026-11-19
- **Công cụ AI / model:** Claude Code (Sonnet 5.5, Opus 5.5 cho phần lên kế hoạch)
- **Phạm vi (`Scope`):** FULLSTACK
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Lên kế hoạch và triển khai tính năng Học thụ động (UC-TC-04) theo giao diện tham khảo từ trang Shorts của một ứng dụng học tiếng Anh khác
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../lesson/controller/WatchController.java`, `service/WatchServiceImpl.java:feed`, `repository/WatchRepository.java:findFeed`, `practice/service/SentenceReviewServiceImpl.java:pinWithoutAttempt`; `frontend/src/features/watch/` (`feed.ts:activeLineIndex`, `estimateWordEnds`, `buildEntries`, `prefs.ts:parsePrefs`, `useFeedPlayer.ts`, `pages/WatchPage.tsx`, `components/FeedVideo.tsx`, `CaptionBox.tsx`, `SettingsMenu.tsx`), `lib/youtube.ts:loadYouTubeApi`; test `WatchApiIntegrationTest`, `feed.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên giao đề, cung cấp trang tham khảo và duyệt kế hoạch gồm 12 điểm thiết kế (bài dài tối đa 3 phút, luồng xáo trộn theo phiên và ưu tiên bài chưa luyện, ẩn video Pro với gói Free kèm thẻ mời nâng cấp, trang toàn màn hình, tô sáng từ ước lượng, cài đặt phụ đề nhớ lại ở lần mở sau). AI xem trang tham khảo bằng trình duyệt rồi chỉnh kế hoạch theo bố cục đó, và phát hiện bảng `lesson_likes` đã có sẵn trong schema gốc nên migration chỉ thêm chỉ mục. Chạy thật trên trình duyệt với 1.068 bài mẫu: video phát đúng câu và từ đang nói, thích, lưu câu (có dòng `manual` ở Shadowing), bấm từ làm video dừng, đóng hộp thì phát tiếp, cài đặt, hộp báo cáo, thẻ mời Pro sau 10 video, bản điện thoại, hai điểm vào. Chưa kiểm chứng: lỗi nguồn phát YouTube (AC-TC-33) và cuộn bằng cảm ứng thật.
- **Commit:** 56e8896, 67a86e9, b5a1f8d
- **Lỗi liên quan:** NONE

### AI-LAM-080

- **Ngày:** 2026-11-19
- **Công cụ AI / model:** Claude Code (Sonnet 5.5, Opus 5.5 cho phần lên kế hoạch; dùng bộ skill frontend-design cho trang Bài đã lưu)
- **Phạm vi (`Scope`):** FULLSTACK
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Thêm tính năng lưu video trong Học thụ động kèm trang xem các bài đã lưu để luyện sau, và nút lưu bài ở trang chi tiết bài học (UC-TC-05)
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../lesson/service/LessonSaveServiceImpl.java:list`, `LessonProgress.java` (tách khỏi `LessonQueryServiceImpl`), `repository/LessonSaveRepository.java`, `controller/SavedLessonController.java`; `frontend/src/features/lesson/savedLessons.ts`, `savedUtils.ts:nextMode`, `components/saved/SavedLessonRow.tsx`, `SaveLessonButton.tsx`, `pages/SavedLessonsPage.tsx`; `features/watch/components/FeedVideo.tsx`, `CaptionBox.tsx`, `hooks.ts:useToggleVideoSaved`; test `SavedLessonApiIntegrationTest`, `savedLessons.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên đề xuất thay Lưu câu bằng Lưu video; AI đề xuất giữ cả hai (Lưu câu chuyển vào khung phụ đề, Lưu video vào cột nút). Sinh viên yêu cầu thêm nút ở trang chi tiết bài, đổi sang trang Bài đã lưu riêng thay vì thêm tab và chỉ định dùng bộ skill thiết kế. AI thiết kế danh sách một cột (ảnh bìa có hai dải tiến độ như thanh tua video, nút luyện gợi ý theo chế độ làm ít hơn), dùng lại bảng và quy ước hiện có, tách `LessonProgress` để dùng chung với thư viện bài và giữ bài đã gỡ trong danh sách. Chạy thật trên trình duyệt: danh sách, tìm, lọc, bỏ lưu và hoàn tác, bài Pro, trang chi tiết, Học thụ động, bản điện thoại và nền tối. Phát hiện khi thử và sửa: thông báo không hiện ở trang Học thụ động vì nằm ngoài khung chung (cả thông báo Lưu câu của lần trước), phụ đề YouTube đè lên phụ đề của LinguaLoop.
- **Commit:** ec89768, 2fe10ca
- **Lỗi liên quan:** NONE

### AI-LAM-081

- **Ngày:** 2026-11-20
- **Công cụ AI / model:** Claude Code (Opus 5.5, Sonnet 5.5)
- **Phạm vi (`Scope`):** FULLSTACK
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Lên kế hoạch qua vòng hỏi đáp thiết kế rồi triển khai Thực hành với AI theo bài (UC-AI-01). Bản đầu là chat theo lượt; sinh viên yêu cầu làm lại giống Trò chuyện với AI theo câu: gia sư nói chuyện trực tiếp qua Gemini Live, hỏi tối đa 5 câu trong 15 phút về nội dung bài, gợi ý miễn phí, nhận xét tổng quát, chat chữ chỉ để dự phòng
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../aichat/` (`LessonChatServiceImpl`, `LessonChatRepository`, `LessonChatLive`, `LessonChatPrompts`, `GeminiLessonChatAi`, `LessonChatController`); `tutor/LiveTokenIssuer.java:LiveSpec`; migration `V20261120_1000`; `frontend/src/features/aichat/` (`controller.ts`, `rules.ts`, `LiveChatPanel`, `TextChatPanel`, `AiChatPage`, `ChatThread`, `SummaryCard`, `HistoryDialog`); bản dịch `aichat.json`; `LessonChatStyle`, migration `V20261120_1200` (kiểu trò chuyện) và tool `play_clip`; test `LessonChatLiveApiIntegrationTest`, `LessonChatApiIntegrationTest`, `GeminiLessonChatAiTest`, `controller.test.ts`, `rules.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên duyệt 11 quyết định thiết kế đầu, sau đó chỉ ra bản chat theo lượt chưa đúng ý và duyệt 9 quyết định cho bản live (Gemini Live với micro mở liên tục, trừ credit cố định khi gia sư nói câu đầu, ba tool ghi từng lượt, gợi ý miễn phí, không tiếp tục lại phiên, chat chữ dự phòng). Sinh viên chọn ba hướng làm cuộc trò chuyện tự nhiên hơn (gia sư nói lại câu tự nhiên rồi hỏi tiếp, kiểu Phỏng vấn và Kể lại, phát lại đoạn video) và duyệt thêm nút "Nghe lại đoạn này" cho người học tự bấm khi bí, tra từ điển khi bấm vào chữ trong câu hỏi, và bố cục một cột (video lớn, khung chat, khung gia sư dính đáy). AI chạy thử trên trình duyệt với Gemini Live thật qua micro giả và ghi nhận kết quả, kể cả hai lỗi chạy đua tìm thấy khi thử.
- **Commit:** 85c3e3a, a7ab2e8, 0b8f569, 3625c8b, 4d6d527, ebcd7be, bb0ceb4, 2cc6ae7, 0b4a4d2, 61e637d, 32a912b, 7c600e5
- **Lỗi liên quan:** AI-ERR-LAM-009, AI-ERR-LAM-010, AI-ERR-LAM-011

### AI-LAM-082

- **Ngày:** 2026-11-21
- **Công cụ AI / model:** Claude Code (Opus 5.5, Sonnet 5.5)
- **Phạm vi (`Scope`):** FULLSTACK
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Cải thiện Nhận xét AI cho lượt đọc Shadowing (UC-AI-03) từ 4 câu văn xuôi thành nhận xét có cấu trúc: tổng quan có so sánh với lượt trước, điểm mạnh, tối đa 3 lỗi ưu tiên gom theo âm kèm mẹo khẩu hình, từ bị bỏ sót và một bước tiếp theo bấm được
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../ai/StructuredFeedback.java:normalize`, `FeedbackPromptBuilder.java` (bản v2), `FeedbackRequest.java`, `GeminiFeedbackGenerator.java:callGemini`, `shadowing/service/FeedbackRequestLoader.java:previousOf, tipsFor`; `frontend/src/features/shadowing/feedback.ts:parseFeedback`, `components/AiFeedbackCard.tsx:StructuredBody`; bản dịch `pages.json`; test `StructuredFeedbackTest`, `FeedbackPromptBuilderTest`, `AiFeedbackIntegrationTest`, `feedback.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên đưa ví dụ nhận xét mong muốn (tổng quan, điểm mạnh, cần cải thiện từng từ, bước tiếp theo), duyệt hướng ngắn gọn và chính xác hơn và yêu cầu làm trên nhánh `feat/ai-lesson-chat`. AI chỉ ra các điểm không nên chép theo ví dụ (quá dài, mẹo khẩu hình có thể sai, bắt sửa từ chức năng) và chọn: mẹo do hệ thống lấy từ kho thay vì AI viết, lọc từ và âm AI nêu ngoài dữ liệu, lưu JSON vào cột văn bản sẵn có nên không cần migration và nhận xét cũ vẫn hiện nguyên văn. AI chạy thử Gemini thật với một câu nhiều lỗi và xem nhận xét trên trình duyệt.
- **Commit:** 57ba584
- **Lỗi liên quan:** NONE

### AI-LAM-084

- **Ngày:** 2026-11-24
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** FULLSTACK
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Lên kế hoạch và triển khai Nâng cấp và thanh toán gói Pro qua VNPAY (UC-PR-01 đến 04) từ các biến môi trường VNPAY sẵn có
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../subscription/payment/VnpayGateway.java:paymentUrl, verify`, `subscription/service/ProPaymentServiceImpl.java:checkout, confirm, activate`, `subscription/repository/ProOrderPaymentRepository.java`, `subscription/controller/SubscriptionController.java`, `VnpayIpnController.java:ipn`, `ProOrderExpiryJob.java`, migration `V20261124_1100__pro_payment.sql`; `frontend/src/features/subscription/payment.ts`, `hooks/usePayment.ts`, `components/SubscriptionPanel.tsx`, `PlanPicker.tsx`, `OrderHistory.tsx`, `pages/SubscriptionPage.tsx`, `pages/PaymentReturnPage.tsx`, bản dịch `subscription.json`; test `VnpayGatewayTest`, `ProPaymentApiIntegrationTest`, `payment.test.ts`; đặc tả `docs/srs/PR-goi-pro/quy-trinh-nghiep-vu.md`, BR-PR-17, AC-PR-24
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sinh viên chốt 4 quyết định AI đề xuất: Return URL được kích hoạt gói như IPN (vì VNPAY không gọi được localhost), kết quả thành công đến muộn cho đơn đã hủy hoặc hết hạn vẫn được ghi nhận và nối tiếp thời hạn (thêm BR-PR-17), giữ công cụ dev bật/tắt Pro, chưa làm hoàn tiền và tra cứu giao dịch. AI dựa trên bảng `pro_orders` và ví credit có sẵn (ví tự nạp credit theo đơn đang hiệu lực nên kích hoạt chỉ cần ghi đúng thời hạn), khóa theo học viên để IPN và Return URL đến cùng lúc chỉ kích hoạt một lần, và tự ký kết quả VNPAY bằng khóa thử trong test. Chạy trên trình duyệt với database riêng: sandbox VNPAY từ chối mã merchant (lỗi 71 "Website chưa được phê duyệt") nên phần trả về được thử bằng kết quả tự ký bằng khóa thật trong `.env`.
- **Commit:** dff1f27, bbf37ba
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

### AI-ERR-LAM-005

- **Liên kết bản ghi AI:** AI-LAM-048
- **Loại lỗi (`Error Type`):** API_MISUSE
- **Ngày phát hiện:** 2026-11-06
- **Đầu ra sai/thiếu sót và bối cảnh:** Dấu ghim và dấu ghi chú trong danh sách câu của nghe chép được đặt `aria-label` trực tiếp lên component `Icon`, nhưng `Icon` không nhận prop này (luôn vẽ `aria-hidden`), nên người dùng đọc màn hình không nghe được ý nghĩa của hai dấu.
- **Vị trí (`file:hàm`):** `frontend/src/features/dictation/components/SentenceList.tsx` (dấu ghim, dấu ghi chú)
- **Nguyên nhân phân tích:** AI viết thuộc tính cho `Icon` theo thói quen của thư viện icon khác mà không đọc định nghĩa của component trong repo; TypeScript không báo vì thuộc tính có dấu gạch ngang không bị kiểm tra kiểu trong JSX.
- **Cách phát hiện / bằng chứng:** Khi kiểm tra danh sách câu của Shadowing trên trình duyệt thật theo yêu cầu của Lâm, truy vấn `[aria-label="Có ghi chú"]` không tìm thấy phần tử nào dù dấu đã hiện; đọc `Icon.tsx` xác nhận prop bị bỏ qua.
- **Cách sửa:** Bọc dấu trong `<span role="img" aria-label=...>` ở danh sách câu của nghe chép và của Shadowing.
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** 59e1692
- **Commit sửa (bắt buộc, khác commit trên):** 8d2549d
- **Kiểm chứng sau sửa:** Trên trình duyệt thật, truy vấn `[role="img"][aria-label="Có ghi chú"]` và `[role="img"][aria-label="Đang trong Câu cần ôn"]` trả về 1 và 3 phần tử.
- **Trạng thái (`Error Status`):** FIXED

### AI-ERR-LAM-006

- **Liên kết bản ghi AI:** AI-LAM-069
- **Loại lỗi (`Error Type`):** API_MISUSE
- **Ngày phát hiện:** 2026-11-09
- **Đầu ra sai/thiếu sót và bối cảnh:** Request ghi câu trả lời khai báo `correct` và `hintUsed` là `boolean` nguyên thủy. Giao diện không gửi `hintUsed` ở Trắc nghiệm và không gửi cờ nào ở Flashcard, nên Jackson từ chối thuộc tính thiếu, server trả 400 và câu trả lời bị bỏ mà người học không thấy lỗi.
- **Vị trí (`file:hàm`):** `backend/.../vocab/dto/request/AnswerRequest.java` (record `AnswerRequest`)
- **Nguyên nhân phân tích:** AI giả định thuộc tính boolean vắng mặt sẽ mặc định false như cấu hình Jackson thường gặp, nhưng dự án bật từ chối null cho kiểu nguyên thủy; test tích hợp của AI luôn gửi đủ hai trường nên không bắt được.
- **Cách phát hiện / bằng chứng:** Khi thử luồng học trên trình duyệt thật, console báo nhiều lỗi 400 ở `/vocab/sessions/{id}/answers` và nhật ký trong cơ sở dữ liệu chỉ có một dòng; log backend ghi `Cannot map null into type boolean`.
- **Cách sửa:** Đổi hai trường sang `Boolean`, vắng mặt hiểu là false; thêm test gửi thiếu cờ cho Trắc nghiệm, Flashcard và Đoán.
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** f4f6f37
- **Commit sửa (bắt buộc, khác commit trên):** e9d2697
- **Kiểm chứng sau sửa:** Test `flagsMayBeOmitted_asTheClientDoesForQuizAndFlashcard` qua; chạy lại luồng học trên trình duyệt không còn lỗi 400 và nhật ký ghi đủ 12 dòng.
- **Trạng thái (`Error Status`):** FIXED

### AI-ERR-LAM-007

- **Liên kết bản ghi AI:** AI-LAM-073
- **Loại lỗi (`Error Type`):** DATA_ERROR
- **Ngày phát hiện:** 2026-11-17
- **Đầu ra sai/thiếu sót và bối cảnh:** Trong `review.json` AI đặt hai khoá cùng tên `steps` ở cấp gốc: một chuỗi nhãn cho thanh tiến độ và một đối tượng chứa `cards`, `sentences`. JSON cho phép khoá trùng và bản sau đè bản trước, nên `t("steps")` trả về đối tượng, giao diện hiện nguyên câu "key 'steps (vi)' returned an object instead of string" ở nhãn trợ năng của thanh tiến độ.
- **Vị trí (`file:hàm`):** `frontend/src/i18n/locales/vi/review.json`, `en/review.json` (khoá `steps`); `frontend/src/features/review/components/ReviewShell.tsx`
- **Nguyên nhân phân tích:** AI viết hai nhóm chuỗi ở hai thời điểm và không kiểm tra khoá trùng; `tsc`, ESLint và 253 test hiện có đều không đọc các khoá này nên không báo gì.
- **Cách phát hiện / bằng chứng:** Chạy luồng Ôn tập hôm nay trên trình duyệt thật rồi đọc ảnh chụp cây trợ năng: nhãn danh sách bước là câu báo lỗi của i18next.
- **Cách sửa:** Đổi chuỗi nhãn thành `stepsLabel`; thêm `features/review/i18n.test.ts` kiểm tra hai ngôn ngữ cùng bộ khoá và mọi khoá tĩnh `t("...")` trong feature đều trỏ tới một chuỗi.
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** f46bc8e
- **Commit sửa (bắt buộc, khác commit trên):** 7330233
- **Kiểm chứng sau sửa:** Test mới qua (12 test của feature, 255 test frontend); chạy lại trên trình duyệt thì nhãn hiện đúng "Các phần của phiên ôn".
- **Trạng thái (`Error Status`):** FIXED

### AI-ERR-LAM-008

- **Liên kết bản ghi AI:** AI-LAM-075
- **Loại lỗi (`Error Type`):** EDGE_CASE_MISSED
- **Ngày phát hiện:** 2026-11-19
- **Đầu ra sai/thiếu sót và bối cảnh:** Các test của Định mức ôn ngày trong `DailyReviewApiIntegrationTest` dùng mốc "5 phút", "10 phút" trước đây cho lượt ôn thẻ và lần ôn câu, rồi kỳ vọng chúng thuộc "hôm nay" của học viên. Múi giờ mặc định của học viên là `Asia/Ho_Chi_Minh`, nên chạy trong những phút ngay sau 0 giờ thì các mốc đó rơi vào ngày hôm trước và 6 test thất bại. Lỗi cũng xảy ra trên CI chạy theo UTC từ khoảng 17:00 đến 17:20.
- **Vị trí (`file:hàm`):** `backend/src/test/java/com/lingualoop/backend/review/DailyReviewApiIntegrationTest.java` (`answered`, `reviewedSentence` và các test dùng chúng)
- **Nguyên nhân phân tích:** AI viết test phụ thuộc giờ trong ngày và không xét ranh giới ngày theo múi giờ của học viên; các lần chạy trước đó đều rơi ngoài cửa sổ này nên test qua.
- **Cách phát hiện / bằng chứng:** Chạy toàn bộ test backend lúc 00:04 giờ Việt Nam: 6 test thất bại với `cardsDoneToday` bằng 0 thay vì số thẻ đã ôn.
- **Cách sửa:** Đổi các mốc thành 1 đến 2 giây trước để luôn nằm trong ngày hiện tại, giữ riêng ca "30 giờ trước" cho ngày hôm qua.
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** 6ee48e6
- **Commit sửa (bắt buộc, khác commit trên):** 96c384a
- **Kiểm chứng sau sửa:** Chạy lại `DailyReviewApiIntegrationTest` đúng lúc 00:04: 33/33 qua, rồi toàn bộ 1304 test backend qua.
- **Trạng thái (`Error Status`):** FIXED

### AI-ERR-LAM-009

- **Liên kết bản ghi AI:** AI-LAM-081
- **Loại lỗi (`Error Type`):** EDGE_CASE_MISSED
- **Ngày phát hiện:** 2026-11-20
- **Đầu ra sai/thiếu sót và bối cảnh:** Gia sư giọng nói thường gọi tool `next_question` ngay trong lượt nói đầu, cùng lúc trình duyệt báo `started` để server trừ credit. Server chỉ nhận câu hỏi sau khi đã trừ credit nên yêu cầu câu hỏi đến trước bị trả 409; bộ điều khiển hiểu 409 là phiên đã đóng và kết thúc phiên, trong khi credit đã bị trừ. Phiên chết không có câu hỏi nào.
- **Vị trí (`file:hàm`):** `frontend/src/features/aichat/controller.ts` (`#onTutorOutput`, `#handleToolCall`)
- **Nguyên nhân phân tích:** AI coi hai lời gọi là tuần tự trong khi cả hai đều chạy bất đồng bộ; các lần thử đầu tình cờ thắng cuộc đua nên test giả lập không lộ.
- **Cách phát hiện / bằng chứng:** Chạy thật trên trình duyệt với Gemini Live: lần thử thứ ba phiên đóng sau 13 ms, ví mất 5 credit và lịch sử ghi "dừng giữa chừng"; nhật ký server cho thấy POST `questions` đến trước lúc `started` ghi nhận.
- **Cách sửa:** Giữ lời hứa của lời gọi `started` và cho mọi tool chờ nó xong trước khi gửi lên server; thêm test giữ lời báo `started` lại rồi kiểm tra câu hỏi chỉ được gửi sau đó.
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** 0b8f569
- **Commit sửa (bắt buộc, khác commit trên):** 3625c8b
- **Kiểm chứng sau sửa:** `controller.test.ts` (36 test của aichat qua); chạy lại trên trình duyệt: phiên sống, 5 câu trả lời được ghi đủ và gia sư tự gọi `end_session` kèm nhận xét tổng quát.
- **Trạng thái (`Error Status`):** VERIFIED

### AI-ERR-LAM-010

- **Liên kết bản ghi AI:** AI-LAM-081
- **Loại lỗi (`Error Type`):** EDGE_CASE_MISSED
- **Ngày phát hiện:** 2026-11-20
- **Đầu ra sai/thiếu sót và bối cảnh:** Bản sửa AI-ERR-LAM-009 chỉ gắn lời báo `started` vào lần gia sư phát âm thanh đầu tiên. Ở kiểu Kể lại, gia sư gọi `next_question` trước khi phát bất kỳ âm thanh nào, nên chưa có lời báo `started` nào để chờ: câu hỏi đến server trước lúc trừ credit, bị 409 và phiên bị đóng.
- **Vị trí (`file:hàm`):** `frontend/src/features/aichat/controller.ts` (`#onTutorOutput`, `#handleToolCall`)
- **Nguyên nhân phân tích:** AI giả định lượt đầu của gia sư luôn mở đầu bằng âm thanh; lời nhắc mới của kiểu Kể lại làm gia sư gọi tool trước khi nói.
- **Cách phát hiện / bằng chứng:** Chạy kiểu Kể lại trên trình duyệt: phiên đóng ngay với `charged=false`, nhật ký server có POST `questions` trả 409.
- **Cách sửa:** Tách `#markStarted` (bật đồng hồ và báo `started`) và gọi cả từ đường âm thanh lẫn đầu `#handleToolCall`; thêm test lời gọi tool đến trước mọi âm thanh.
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** 3625c8b
- **Commit sửa (bắt buộc, khác commit trên):** bb0ceb4
- **Kiểm chứng sau sửa:** `controller.test.ts` (41 test của aichat qua); chạy lại kiểu Kể lại trên trình duyệt: gia sư mời kể, phản ứng "Oh, I see" và hỏi tiếp.
- **Trạng thái (`Error Status`):** VERIFIED

### AI-ERR-LAM-011

- **Liên kết bản ghi AI:** AI-LAM-081
- **Loại lỗi (`Error Type`):** LOGIC_ERROR
- **Ngày phát hiện:** 2026-11-21
- **Đầu ra sai/thiếu sót và bối cảnh:** Gia sư giọng nói thỉnh thoảng nói lặp lại cả lượt: phụ đề hiện cùng một đoạn hai lần và âm thanh phát hai lần. Cùng hiện tượng ở gia sư theo câu của Shadowing.
- **Vị trí (`file:hàm`):** `backend/.../aichat/LessonChatPrompts.java:live` (thứ tự gọi tool), `frontend/src/features/aichat/controller.ts` (lời nhắc khi gia sư quên gọi tool), `frontend/src/features/tutor/controller.ts` (`NUDGE_TEXT`)
- **Nguyên nhân phân tích:** Lời nhắc bảo gia sư nói rồi mới gọi `next_question`. Gemini Live luôn sinh một lượt nói mới sau khi nhận kết quả tool, nên gia sư nói xong, gọi tool, rồi nói lại cả lời. Ở gia sư theo câu, lời nhắc "bạn chưa gọi tool" cũng làm gia sư nói lại lời trước khi gọi tool.
- **Cách phát hiện / bằng chứng:** Ghi lại các thông điệp WebSocket giữa trình duyệt và Gemini: lượt lặp có dạng `IN, TOOL give_feedback, OUT (nói), TOOL next_question, OUT (nói lại y nguyên)`.
- **Cách sửa:** `give_feedback` mang luôn câu hỏi tiếp theo và gọi một lần trước khi nói, kết quả tool bảo "nói MỘT lần duy nhất"; `next_question` chỉ còn dùng cho câu mở đầu; các lời nhắc quên gọi tool đổi thành "chỉ gọi tool, không nói lại". Gia sư theo câu chỉ sửa lời nhắc quên gọi tool, chưa chạy lại với Azure.
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** ebcd7be
- **Commit sửa (bắt buộc, khác commit trên):** 32a912b
- **Kiểm chứng sau sửa:** 5 test mới ở `controller.test.ts` và kiểm schema tool ở `LessonChatLiveApiIntegrationTest`; chạy lại trên trình duyệt với Gemini Live thật qua 3 lượt: mỗi lượt đúng `TOOL give_feedback, OUT một lần, TURNCOMPLETE`, không còn lặp.
- **Trạng thái (`Error Status`):** VERIFIED

## 3. Bằng chứng bổ sung (nếu cần)

Không lưu API key, mật khẩu, token, secret hoặc dữ liệu nhạy cảm trong file log.
