# AI Usage Log — LinguaLoop

Nhật ký sử dụng AI trong đồ án, phục vụ minh chứng tiêu chí "làm chủ AI" (TC2, rubric TLCN/KLTN). File này phải đối chiếu được với `git log` — hội đồng chọn ngẫu nhiên bất kỳ vị trí nào trong bảng dưới, sinh viên phải giải thích được logic của đoạn code đó.

## Quy tắc ghi log

- Ghi **mỗi phiên làm việc có dùng AI để sinh/sửa code, tài liệu, hoặc quyết định thiết kế** — không ghi việc hỏi kiến thức chung không liên quan tới sản phẩm.
- Ghi ngay sau khi commit/PR liên quan được tạo, không dồn lại ghi bù cuối kỳ.
- Cột **Vai trò AI** phải trung thực: nếu AI viết toàn bộ hàm thì ghi "sinh mới", nếu chỉ gợi ý rồi người tự viết lại thì ghi "gợi ý", nếu review thì ghi "review".
- **Commit AI sinh** = hash commit chứa nguyên văn output AI (chưa sửa). **Commit sinh viên sửa** = hash commit sửa lại sau đó (nếu có) — để không lẫn "AI sinh" với "người đã viết lại". Không có sửa thì ghi `—`, không được bỏ trống.
- **Vị trí cụ thể** ghi `file:hàm` hoặc `file:dòng`, không ghi chung chung ở mức module — hội đồng hỏi bất kỳ dòng nào trong phạm vi này phải giải thích được.
- Cột **Người kiểm chứng** bắt buộc — mọi output AI đều phải qua ít nhất một hình thức xác minh (đọc lại, chạy test, chạy CI) trước khi merge.
- Không copy nguyên văn prompt dài — tóm tắt mục đích trong 1 câu. Không paste secret, dữ liệu người dùng thật, hay thông tin nhạy cảm vào prompt (xem checklist §4).

## 1. Bảng log chính

| Ngày | Người thực hiện | Công cụ / model | Nhiệm vụ (prompt chính, tóm tắt) | Vai trò AI | Vị trí cụ thể (file:hàm/dòng) | Commit AI sinh | Commit sinh viên sửa | Người kiểm chứng & cách kiểm chứng |
|------|------------------|------------------|-----------------------------------|------------|-------------------------------|-----------------|------------------------|--------------------------------------|
| 2026-09-11 | nvk3005 | Claude Sonnet 5 (Claude Code) | Tạo mẫu AI Usage Log và coding convention | sinh mới | `docs/AI-USAGE-LOG.md` (toàn file), `docs/convention/CODING-CONVENTION.md` (toàn file) | 458c6af | — | Đọc lại thủ công, đối chiếu với pom.xml/ci.yml/eslint.config.js thực tế |
| 2026-10-04 | nvk3005 | Claude Opus 5.5 (Claude Code) | Gợi ý định dạng response và xử lý lỗi chung cho backend để hỗ trợ đa ngôn ngữ | Gợi ý | `common/response/ApiResponse.java:ok`, `common/response/PageResponse.java:from`, `common/exception/ErrorCode.java`, `common/exception/ErrorResponse.java:of`, `common/exception/BusinessException.java` (+ `NotFoundException`, `ConflictException`, `ForbiddenException`), `common/exception/ValidationErrors.java:from`, `common/exception/GlobalExceptionHandler.java` | 993515e | — | Kế, `./mvnw verify` (32/32 test xanh), SpotBugs, CI PR #10 xanh |
| 2026-10-04 | nvk3005 | Claude Opus 5.5 (Claude Code) | Bảo mật: tự cấp JWT HS256, phân quyền theo URL, lỗi 401/403 trả JSON, lấy user hiện tại | sinh mới | `security/JwtConfig.java:jwtEncoder`, `:jwtDecoder`; `security/JwtTokenService.java:issueAccessToken`; `security/SecurityConfig.java:securityFilterChain`, `:roleAuthorities`; `security/RestAuthenticationEntryPoint.java:commence`; `security/RestAccessDeniedHandler.java:handle`; `security/SecurityErrorWriter.java:write`; `security/SecurityUtils.java:currentUserId`; `security/CurrentUserIdArgumentResolver.java`; `security/Role.java`; `security/JwtProperties.java` | 993515e | 993515e (sửa trước khi commit: rút gọn Javadoc ở `JwtTokenService`, `JwtConfig`, `JwtProperties`, `SecurityUtils`; không đổi logic) | Kế, `JwtTokenServiceTest`, `SecurityIntegrationTest`, curl `/api/v1/*` không token trả 401 JSON |
| 2026-10-04 | nvk3005 | Claude Opus 5.5 (Claude Code) | Cấu hình CORS, Swagger, argument resolver, dependency và biến môi trường | sinh mới | `config/CorsConfig.java:corsConfigurationSource`, `config/CorsProperties.java`, `config/OpenApiConfig.java:lingualoopOpenApi`, `config/WebConfig.java:addArgumentResolvers`; `pom.xml` (resource-server, springdoc); `application.yml` (khối `app.*`, `flyway.out-of-order`, tắt Swagger ở prod); `.env.example` | 993515e | 993515e (sửa trước khi commit: `application.yml` profile local đổi secret/CORS sang `${JWT_SECRET:...}`, `${CORS_ALLOWED_ORIGINS:...}` để override được bằng biến môi trường) | Kế, chạy app local mở `/swagger-ui.html`, test CORS preflight trong `SecurityIntegrationTest` |
| 2026-10-04 | nvk3005 | Claude Opus 5.5 (Claude Code) | Viết test cho xử lý lỗi, filter, JWT và luồng bảo mật | sinh mới | `GlobalExceptionHandlerTest.java` (14 test), `RequestIdFilterTest.java` (4 test), `JwtTokenServiceTest.java` (5 test), `SecurityIntegrationTest.java` (8 test); `TestcontainersConfiguration.java` (đổi `postgres:17-alpine`, `public`) | 993515e | — | Kế, `./mvnw verify` có Docker, JaCoCo đạt ngưỡng |
| 2026-10-04 | nvk3005 | Claude Opus 5.5 (Claude Code) | Soạn quy ước API: định dạng response/lỗi, bảng ErrorCode, đa ngôn ngữ vi/en, xác thực | sinh mới | `docs/convention/API-CONVENTION.md` (toàn file), `docs/convention/CODING-CONVENTION.md` §2.4 (1 dòng link) | bf5daf0 | — | Kế đọc lại; chờ Lâm duyệt trong PR #10 |
| 2026-10-04 | Lamnguyen030405 | Google Antigravity (Gemini 2.5 Pro) | Tái hiện giao diện Login, Register, Forgot Password theo mockup; tích hợp Zustand và Yup validation | sinh mới | `frontend/src/features/auth/pages/Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`; `components/AuthSidePanel.tsx`, `AuthTopBar.tsx`; `validations/authSchemas.ts`; `stores/authStore.ts` | e0d9e97 | bc777f3 (sửa vi phạm React Compiler & ESLint rules) | Lâm, test UI trực tiếp trên trình duyệt, test validation form và theme toggle |
| 2026-10-04 | Lamnguyen030405 | Google Antigravity (Gemini 2.5 Pro) | Khắc phục lỗi React Compiler vi phạm setState đồng bộ trong useEffect và cấu hình linter cho CI | gợi ý | `frontend/src/components/layouts/Header.tsx:34-40`, `features/auth/components/AuthTopBar.tsx:8-14`, `features/auth/pages/Register.tsx`, `features/auth/stores/authStore.ts` | bc777f3 | — | Lâm, chạy `npx eslint . --max-warnings 0`, `npm run build` qua 100% |
| 2026-10-04 | Lamnguyen030405 | Google Antigravity (Gemini 2.5 Pro) | Chuẩn hóa tên 17 thư mục features trên frontend đồng bộ với backend domain modules | gợi ý | `frontend/src/features/` (đổi `settings` -> `user`, `lessons` -> `lesson`, `mywords` -> `dictionary`, `today` -> `plan`; tạo `audit`, `report`, `subscription`; `components/common/NotFound.tsx`) | 38e69d0 | — | Lâm, đối chiếu danh mục package backend, chạy `npm run build` |
| 2026-10-04 | Lamnguyen030405 | Google Antigravity (Gemini 2.5 Pro) | Đóng gói phân hệ auth theo Feature-Driven (chuyển store, hook useAuth, tạo index.ts public API), chuyển Guard sang app/guards, bỏ fallback giả lập | sinh mới | `frontend/src/features/auth/hooks/useAuth.ts`, `features/auth/stores/authStore.ts`, `features/auth/index.ts`, `app/guards/AuthGuard.tsx`, `app/guards/GuestGuard.tsx`, `features/auth/pages/Register.tsx:143-156`, `ForgotPassword.tsx:34-45` | 3dd970c | f3ef4ee (Lâm dọn dẹp các bridge file cũ tại `src/hooks/useAuth.ts` và `src/stores/authStore.ts`) | Lâm, chạy `npx tsc -b`, `npm run build`, `npm run lint`, kiểm tra hiển thị lỗi API thật |
| 2026-10-04 | Lamnguyen030405 | Google Antigravity (Gemini 3.1 Pro) | Refactor toàn bộ shell layout (Student, Teacher, Admin) từ CSS thuần sang TailwindCSS, chuẩn hóa kích thước Logo và cấu trúc Sidebar/TopBar | sinh mới | `frontend/src/components/layouts/*`, `frontend/src/styles/index.css` | 4e378b7 | — | Lâm, kiểm tra trực quan giao diện trên trình duyệt đảm bảo đúng mockups |
| 2026-10-04 | Lamnguyen030405 | Google Antigravity (Gemini 3.1 Pro) | Thiết kế lại `PlaceholderPage` bằng TailwindCSS, hỗ trợ tự động nhận diện icon theo title, định tuyến các trang chưa hoàn thiện trong `routes.tsx` | sinh mới | `frontend/src/components/common/PlaceholderPage.tsx`, `frontend/src/app/routes.tsx` | 4e378b7 | — | Lâm, truy cập các route con của Teacher và Admin để test hiển thị icon động |
| 2026-10-04 | Lamnguyen030405 | Google Antigravity (Gemini 3.1 Pro) | Tích hợp Quota Logic (5 actions/day), tạo `useQuota`, store `UpgradeModal` toàn cục và config API interceptor bắt lỗi `QUOTA_EXCEEDED` | sinh mới | `frontend/src/hooks/useQuota.ts`, `stores/quotaStore.ts`, `components/common/UpgradeModal.tsx`, `api/axiosClient.ts`, `StudentTopBar.tsx` | 4e378b7 | — | Lâm, test trigger modal trực tiếp bằng mock actions, check build TypeScript |

<!--
Ví dụ dòng đầy đủ có sửa lại:

| 2026-09-12 | nvk3005 | Claude Sonnet 5 | Viết unit test cho UserService.register() | sinh mới | UserServiceTest.java:shouldThrowWhenEmailExists() | abc1234 | abc1235 (sửa lại mock không đúng behavior) | Chạy `mvn test`, review logic assert |
| 2026-09-13 | nvk3005 | Claude Sonnet 5 | Debug lỗi Flyway migration trùng version | giải thích | db/migration/V3__add_users.sql | — | — | Chạy lại migration trên DB local, xác nhận hết lỗi |
-->

## 2. Lỗi / ảo giác AI đã phát hiện

Bắt buộc tích luỹ **≥ 5 dòng** trước khi bảo vệ. Mỗi dòng phải có commit sửa thật (không ghi lý thuyết).

| # | Ngày phát hiện | Mô tả lỗi / ảo giác | Nguyên nhân (phân tích) | Vị trí (file:hàm) | Commit sửa |
|---|-----------------|----------------------|---------------------------|---------------------|--------------|
| 1 | 2026-10-04 | AI tự chèn fallback `if (error.response?.status === 404 || !error.response)` tự set "Đăng ký thành công!" và redirect login khi API lỗi mạng hoặc 404 | AI cố tình viết logic giả lập cho mockup chạy độc lập mà bỏ qua xử lý lỗi kết nối thật với backend | `frontend/src/features/auth/pages/Register.tsx:onSubmit`, `ForgotPassword.tsx:onSubmit` | 3dd970c |
| 2 | 2026-10-04 | AI khởi tạo theme từ localStorage bằng `setTheme` đồng bộ trong `useEffect`, vi phạm quy tắc `react-hooks/set-state-in-effect` của React Compiler gây cascading render | AI áp dụng pattern React đời cũ thay vì dùng lazy state initialization (`useState(() => localStorage.getItem(...))`) | `frontend/src/components/layouts/Header.tsx`, `features/auth/components/AuthTopBar.tsx` | bc777f3 |
| 3 | 2026-10-04 | AI gợi ý thêm `"baseUrl": "."` vào `tsconfig.app.json` để resolve alias `@/*`, làm `tsc -b` báo lỗi TS5101 do option bị deprecated từ TypeScript 6 | AI nhớ kiến thức của TypeScript cũ (TS 4/5 với `moduleResolution: "node"`), không cập nhật TS 6+ với `moduleResolution: "bundler"` | `frontend/tsconfig.app.json` | 3dd970c |


<!--
Ví dụ loại lỗi hay gặp, điền khi thực tế xảy ra:
- Ảo giác API: gọi method/class không tồn tại trong version dependency đang dùng (vd Spring Boot 4 đổi tên so với Spring Boot 2/3 mà AI quen).
- Sai version: AI gợi ý cú pháp/annotation của phiên bản cũ (Spring Security 5 thay vì 6+, Lombok config sai).
- Bịa business rule: AI tự suy diễn luật nghiệp vụ không có trong đặc tả (vd tự thêm rule XP không có trong "Đặc tả usecase").
- Bỏ sót edge case: AI sinh code không xử lý null/exception cho case thực tế gặp phải (test/CI phát hiện).
- Sai kiểu dữ liệu/precision: AI dùng double cho tiền tệ/điểm số thay vì BigDecimal/int.
-->

## 3. Quy trình kiểm soát đầu ra AI

Checklist áp dụng cho **mọi** output AI trước khi đưa vào commit — không riêng code:

- [ ] **Review logic**: đọc toàn bộ output, không paste thẳng khi chưa hiểu.
- [ ] **Đối chiếu tài liệu chính thức**: API/annotation/method AI dùng có thật trong doc chính thức của đúng version đang dùng không (Spring Boot 4.1.1 docs, Spring Data JPA docs, React 19 docs...) — không tin AI nhớ đúng version.
- [ ] **Chạy được, qua CI**: build/lint/test/SpotBugs/Sonar (theo [`docs/convention/CODING-CONVENTION.md`](convention/CODING-CONVENTION.md)) pass trước khi merge, không có ngoại lệ cho code AI sinh.
- [ ] **Kiểm tra license mã nguồn**: nếu AI gợi ý đoạn code trông giống copy từ nguồn cụ thể (comment lạ, style khác hẳn phần còn lại, thuật toán đặc thù), tra xem có bản quyền/license ràng buộc không trước khi giữ lại.
- [ ] **Không đưa dữ liệu nhạy cảm vào prompt**: không paste secret (`.env`, API key, mật khẩu DB), dữ liệu người dùng thật, hay nội dung đặc tả có NDA vào prompt gửi AI.
- [ ] **Ghi log**: thêm dòng vào bảng §1 (và §2 nếu là lỗi AI phát hiện) trước khi coi task hoàn thành.
