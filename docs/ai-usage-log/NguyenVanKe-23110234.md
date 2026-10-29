# AI Usage Log — Nguyễn Văn Kế

- **Dự án:** LinguaLoop
- **Thành viên:** Nguyễn Văn Kế
- **Mã thành viên (dùng trong ID):** KE

## 1. Nhật ký sử dụng AI

### AI-KE-001

- **Ngày:** 2026-09-11
- **Công cụ AI / model:** Claude Code (Sonnet 5)
- **Phạm vi (`Scope`):** DOCUMENTATION
- **Loại công việc (`Task Type`):** DOCUMENTATION
- **Prompt chính / yêu cầu:** Tạo mẫu AI Usage Log và coding convention
- **Vị trí code do AI sinh (`file:hàm`):** `docs/AI-USAGE-LOG.md` (toàn file), `docs/convention/CODING-CONVENTION.md` (toàn file)
- **Commit:** 458c6af
- **Lỗi liên quan:** NONE

### AI-KE-002

- **Ngày:** 2026-10-04
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** BACKEND_COMMON
- **Loại công việc (`Task Type`):** DESIGN
- **Prompt chính / yêu cầu:** Gợi ý định dạng response và xử lý lỗi chung cho backend để hỗ trợ đa ngôn ngữ
- **Vị trí code do AI sinh (`file:hàm`):** `common/response/ApiResponse.java:ok`, `common/response/PageResponse.java:from`, `common/exception/ErrorCode.java`, `common/exception/ErrorResponse.java:of`, `common/exception/BusinessException.java` (+ `NotFoundException`, `ConflictException`, `ForbiddenException`), `common/exception/ValidationErrors.java:from`, `common/exception/GlobalExceptionHandler.java`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Log cũ ghi vai trò AI là "gợi ý": sinh viên tự viết lại theo gợi ý.
- **Commit:** 993515e
- **Lỗi liên quan:** NONE

### AI-KE-003

- **Ngày:** 2026-10-04
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** AUTH
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Bảo mật: tự cấp JWT HS256, phân quyền theo URL, lỗi 401/403 trả JSON, lấy user hiện tại
- **Vị trí code do AI sinh (`file:hàm`):** `security/JwtConfig.java:jwtEncoder`, `:jwtDecoder`; `security/JwtTokenService.java:issueAccessToken`; `security/SecurityConfig.java:securityFilterChain`, `:roleAuthorities`; `security/RestAuthenticationEntryPoint.java:commence`; `security/RestAccessDeniedHandler.java:handle`; `security/SecurityErrorWriter.java:write`; `security/SecurityUtils.java:currentUserId`; `security/CurrentUserIdArgumentResolver.java`; `security/Role.java`; `security/JwtProperties.java`
- **Commit:** 993515e
- **Lỗi liên quan:** NONE

### AI-KE-004

- **Ngày:** 2026-10-04
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** BACKEND_COMMON
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Cấu hình CORS, Swagger, argument resolver, dependency và biến môi trường
- **Vị trí code do AI sinh (`file:hàm`):** `config/CorsConfig.java:corsConfigurationSource`, `config/CorsProperties.java`, `config/OpenApiConfig.java:lingualoopOpenApi`, `config/WebConfig.java:addArgumentResolvers`; `pom.xml` (resource-server, springdoc); `application.yml` (khối `app.*`, `flyway.out-of-order`, tắt Swagger ở prod); `.env.example`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Sửa trước khi commit: `application.yml` profile local đổi secret/CORS sang `${JWT_SECRET:...}`, `${CORS_ALLOWED_ORIGINS:...}` để override được bằng biến môi trường
- **Commit:** 993515e
- **Lỗi liên quan:** NONE

### AI-KE-005

- **Ngày:** 2026-10-04
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** TESTING
- **Loại công việc (`Task Type`):** TEST_GENERATION
- **Prompt chính / yêu cầu:** Viết test cho xử lý lỗi, filter, JWT và luồng bảo mật
- **Vị trí code do AI sinh (`file:hàm`):** `GlobalExceptionHandlerTest.java` (14 test), `RequestIdFilterTest.java` (4 test), `JwtTokenServiceTest.java` (5 test), `SecurityIntegrationTest.java` (8 test); `TestcontainersConfiguration.java` (đổi `postgres:17-alpine`, `public`)
- **Commit:** 993515e
- **Lỗi liên quan:** NONE

### AI-KE-006

- **Ngày:** 2026-10-04
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** DOCUMENTATION
- **Loại công việc (`Task Type`):** DOCUMENTATION
- **Prompt chính / yêu cầu:** Soạn quy ước API: định dạng response/lỗi, bảng ErrorCode, đa ngôn ngữ vi/en, xác thực
- **Vị trí code do AI sinh (`file:hàm`):** `docs/convention/API-CONVENTION.md` (toàn file), `docs/convention/CODING-CONVENTION.md` §2.4 (1 dòng link)
- **Commit:** bf5daf0
- **Lỗi liên quan:** NONE

### AI-KE-007

- **Ngày:** 2026-10-05
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DATABASE
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Migration auth + entity/repository `users` (đổi `username`→`display_name`, thêm 3 bảng auth)
- **Vị trí code do AI sinh (`file:hàm`):** `db/migration/V20261005_1400__auth_core.sql`; `user/entity/User.java:createLocal`, `:markEmailVerified`; `user/entity/RoleConverter.java`; `user/repository/UserRepository.java:findByEmail`, `:existsByEmail`; `UserRepositoryTest.java` (4 test)
- **Commit:** 13dbfb4
- **Lỗi liên quan:** NONE

### AI-KE-008

- **Ngày:** 2026-10-05
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** BACKEND_COMMON
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Hạ tầng lỗi `details`, 7 mã lỗi `AUTH_*`, bean `Clock`, `AuthProperties`
- **Vị trí code do AI sinh (`file:hàm`):** `common/exception/BusinessException.java` (constructor `details`), `ErrorResponse.java:of`, `ErrorCode.java`, `GlobalExceptionHandler.java:handleBusiness`; `config/ClockConfig.java:clock`, `config/AuthProperties.java`, `config/AuthConfig.java`; `application.yml` (`app.auth.*`); `GlobalExceptionHandlerTest.java`, `AuthPropertiesTest.java`
- **Commit:** dc8854e
- **Lỗi liên quan:** NONE

### AI-KE-009

- **Ngày:** 2026-10-05
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** USER
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** `UserAccountService` cho feature auth và `GET /users/me`
- **Vị trí code do AI sinh (`file:hàm`):** `user/service/UserAccountServiceImpl.java:findByEmail`, `:createLocal`, `:markEmailVerified`; `user/dto/UserAccount.java:toMe`; `user/controller/UserController.java:me`; `UserControllerIntegrationTest.java`, `UserAccountServiceTest.java`
- **Commit:** 845c7e1
- **Lỗi liên quan:** NONE

### AI-KE-010

- **Ngày:** 2026-10-05
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** AUTH
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Đăng ký (AC-01..05, 07), token xác thực email, validate mật khẩu theo byte
- **Vị trí code do AI sinh (`file:hàm`):** `auth/service/AuthService.java:register`; `auth/service/EmailVerificationService.java:issueToken`; `auth/service/SecureTokens.java:generate`, `:sha256`; `auth/entity/EmailToken.java:issue`; `common/validation/MaxBytesValidator.java:isValid`; `auth/dto/RegisterRequest.java`; `auth/controller/AuthController.java:register`; `RegisterIntegrationTest.java` (8 test), `SecureTokensTest.java`
- **Commit:** 0b492fc
- **Lỗi liên quan:** NONE

### AI-KE-011

- **Ngày:** 2026-10-05
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** AUTH
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Gửi thư xác thực qua SMTP, i18n vi/en, Mailpit trong compose
- **Vị trí code do AI sinh (`file:hàm`):** `auth/mail/SmtpAuthMailSender.java:sendVerifyEmail`; `config/MessageConfig.java:messageSource`; `messages_vi.properties`, `messages_en.properties`; `compose.yaml` (mailpit); `application.yml` (`spring.mail.*`, tắt `management.health.mail`); `pom.xml` (starter-mail); `SmtpAuthMailSenderTest.java`, `RegisterMailIntegrationTest.java`
- **Commit:** 70f811e
- **Lỗi liên quan:** NONE

### AI-KE-012

- **Ngày:** 2026-10-05
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** AUTH
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Xác thực email và gửi lại (AC-28..32)
- **Vị trí code do AI sinh (`file:hàm`):** `auth/service/EmailVerificationService.java:verify`, `:resend`, `:prepareResend`, `:trySendMail`; `auth/repository/EmailTokenRepository.java:markAllUsed`; `auth/controller/AuthController.java:verifyEmail`, `:resendVerification`; `support/MutableClock.java`; `EmailVerificationIntegrationTest.java` (13 test)
- **Commit:** e755eee
- **Lỗi liên quan:** NONE

### AI-KE-013

- **Ngày:** 2026-10-05
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** AUTH
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Đăng nhập, khoá 5 lần/15 phút theo email, chống dò tài khoản (AC-08, 10, 12..16)
- **Vị trí code do AI sinh (`file:hàm`):** `auth/service/AuthService.java:login`, `:passwordMatches`; `auth/service/LoginAttemptService.java:recordFailure`, `:assertNotLocked`; `auth/repository/LoginAttemptRepository.java:recordFailure` (upsert nguyên tử); `LoginAttemptServiceTest.java` (8 test), `LoginIntegrationTest.java` (15 test)
- **Commit:** 4bf3042
- **Lỗi liên quan:** NONE

### AI-KE-014

- **Ngày:** 2026-10-05
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** AUTH
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Refresh token xoay vòng + phát hiện dùng lại, cookie HttpOnly, `/refresh`, `/logout`, CORS credentials (AC-25..27)
- **Vị trí code do AI sinh (`file:hàm`):** `auth/service/RefreshTokenService.java:rotate`, `:doRotate`, `:revokeSession`; `auth/web/RefreshCookies.java:issue`, `:clear`; `auth/service/AuthService.java:refresh`, `:logout`; `auth/controller/AuthController.java:refresh`, `:logout`, `:handleRefreshInvalid`; `config/CorsConfig.java` (`allowCredentials=true`); `RefreshTokenServiceTest.java` (9 test), `SessionIntegrationTest.java` (15 test)
- **Commit:** b7c15af
- **Lỗi liên quan:** AI-ERR-KE-001

### AI-KE-015

- **Ngày:** 2026-10-05
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DOCUMENTATION
- **Loại công việc (`Task Type`):** DOCUMENTATION
- **Prompt chính / yêu cầu:** Cập nhật tài liệu: `details`, mã lỗi AUTH_*, cookie refresh + `X-Requested-With`, 3 bảng auth, biến môi trường mail
- **Vị trí code do AI sinh (`file:hàm`):** `docs/convention/API-CONVENTION.md` §4, §6; `planning/README.md` §3; `backend/.env.example`
- **Commit:** 6983813
- **Lỗi liên quan:** NONE

### AI-KE-016

- **Ngày:** 2026-10-07
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** TESTING
- **Loại công việc (`Task Type`):** TEST_GENERATION
- **Prompt chính / yêu cầu:** Bổ sung test cho AC còn thiếu sau khi đối chiếu đặc tả: role instructor/admin (AC-08), cờ onboarded (AC-11), sau đăng xuất (AC-26), đăng ký→xác thực→đăng nhập (AC-28)
- **Vị trí code do AI sinh (`file:hàm`):** `LoginIntegrationTest.java:login_nonStudentRole_isReturnedInBodyAndAccessTokenClaim_AC08`, `:login_studentWithoutOnboarding_…_AC11`, `:login_studentWhoCompletedOnboarding_…_AC11`; `SessionIntegrationTest.java:afterLogout_sessionCannotBeRestoredAndProtectedDataNeedsLogin_AC26`, `:afterLogout_alreadyIssuedAccessTokenStaysValidUntilItExpires_AC26`; `EmailVerificationIntegrationTest.java:registerThenVerifyThenLogin_loginOnlyWorksAfterVerification_AC28`
- **Commit:** 0ac2e0d
- **Lỗi liên quan:** NONE

### AI-KE-017

- **Ngày:** 2026-10-07
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** USER
- **Loại công việc (`Task Type`):** CODE_REVIEW
- **Prompt chính / yêu cầu:** Review và sửa phần chuyển entity→DTO sang MapStruct do sinh viên viết (mapper, đổi service dùng mapper); thêm test mapper và mục MapStruct trong tài liệu cấu trúc
- **Vị trí code do AI sinh (`file:hàm`):** `backend/pom.xml` (annotationProcessorPaths: `lombok-mapstruct-binding`, `mapstruct-processor`); `user/mapper/UserMapper.java:toUserAccount` (`@Mapping googleLinked`, `unmappedTargetPolicy=ERROR`); `user/service/UserAccountServiceImpl.java:findByEmail`, `:findById` (trả lại `Optional.empty()`); `UserMapperTest.java` (3 test); `planning/cau-truc-du-an.md` (mục Mapper dùng MapStruct), `docs/convention/CODING-CONVENTION.md`
- **Commit:** b7bdbf5
- **Lỗi liên quan:** NONE

### AI-KE-018

- **Ngày:** 2026-10-07
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** AUTH
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Bỏ yêu cầu header `X-Requested-With` ở `/auth/refresh`, `/auth/logout` theo quyết định của sinh viên sau khi sinh viên chỉ ra header không có tác dụng riêng; thay bằng test CORS chặn origin lạ
- **Vị trí code do AI sinh (`file:hàm`):** `auth/controller/AuthController.java:refresh`, `:logout`; `SessionIntegrationTest.java:refresh_fromUnknownOrigin_isRejectedByCors_AC27`, `:logout_fromUnknownOrigin_isRejectedByCorsAndSessionSurvives_AC25` (thay hai test `…withoutRequestedWithHeader…`); `docs/convention/API-CONVENTION.md` §6
- **Commit:** 264726a
- **Lỗi liên quan:** AI-ERR-KE-001

### AI-KE-019

- **Ngày:** 2026-10-08
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** AUTH
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Nút "Tiếp tục với Google" ở trang đăng nhập theo authorization code flow: chuyển sang Google kèm `state`, trang `/authenticate` đổi `code` lấy phiên (AC-09, 17, 18, 21, 22, 23)
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/auth/googleOAuth.ts:startGoogleLogin`, `:consumeGoogleState`; `components/GoogleSignInButton.tsx`; `pages/GoogleCallback.tsx`; `stores/authStore.ts:googleLogin`; `services/authService.ts:googleLogin`; `errors.ts:errorMessage` (4 mã lỗi mới); `pages/Login.tsx`; `i18n/locales/{vi,en}/auth.json` (`google`, `errors.*`)
- **Commit:** 6657cbf, c107906, cb9b768
- **Lỗi liên quan:** NONE

### AI-KE-020

- **Ngày:** 2026-10-08
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** USER
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Trang Cài đặt, tab Bảo mật: form tạo/đổi mật khẩu, trạng thái Google (AC-41..45)
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/user/pages/Settings.tsx`, `components/SecuritySection.tsx`, `components/PasswordForm.tsx:onSubmit`, `validations.ts:buildPasswordSchema`, `api.ts:changePassword`; `features/auth/passwordStrength.ts` (tách từ `Register.tsx`); `errors.ts:fieldErrorMessage` (thêm `MaxBytes`); `app/routes.tsx` (3 route settings)
- **Commit:** d58e1f0
- **Lỗi liên quan:** NONE

### AI-KE-021

- **Ngày:** 2026-10-09
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** AUTH
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Quên và đặt lại mật khẩu (UC-AUTH-06, AC-33..40): endpoint `forgot-password`, `reset-password/validate`, `reset-password` (204, không cấp phiên); gửi thư bất đồng bộ để thời gian phản hồi không lộ email có tài khoản (BR-AUTH-04), áp dụng luôn cho `verify-email/resend`
- **Vị trí code do AI sinh (`file:hàm`):** `backend/.../auth/service/PasswordResetService.java:request`, `:validate`, `:reset`, `:applyReset`; `auth/mail/AuthMailDispatcher.java:sendVerifyEmail`, `:sendResetPassword`; `auth/mail/SmtpAuthMailSender.java:sendResetPassword`; `auth/controller/AuthController.java:forgotPassword`, `:validateResetToken`, `:resetPassword`; `auth/service/EmailVerificationService.java:resend`; `config/AsyncConfig.java`; `config/AuthProperties.java` (`resetTtl`); `messages_{vi,en}.properties` (`auth.mail.reset.*`); test `ForgotPasswordIntegrationTest`, `ResetPasswordIntegrationTest`, `PasswordResetServiceTest`, `SmtpAuthMailSenderTest`
- **Commit:** a0f0cb4, 52f9c3d
- **Lỗi liên quan:** NONE

### AI-KE-022

- **Ngày:** 2026-10-09
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** AUTH
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Trang đặt lại mật khẩu `/reset-password?token=` (kiểm tra link khi mở, form mật khẩu mới + nhập lại, thành công thì về đăng nhập kèm thông báo), bắt lỗi field ở trang quên mật khẩu (AC-33..40)
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/auth/pages/ResetPassword.tsx:ResetPassword`, `:onSubmit`; `validations/authSchemas.ts:resetPasswordSchema`; `services/authService.ts:validateResetToken`, `:resetPassword`; `pages/Login.tsx` (thông báo `passwordReset`); `pages/ForgotPassword.tsx:onSubmit`; `app/routes.tsx` (route `reset-password`); `i18n/locales/{vi,en}/auth.json` (`reset`, `login.passwordResetNotice`)
- **Commit:** 4c99bc6
- **Lỗi liên quan:** NONE

### AI-KE-023

- **Ngày:** 2026-10-17
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DICTATION
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** G0: lưu lượt nghe chép kèm kết quả từng từ, view thống kê điểm yếu, migration, enum, mapper, service ở feature practice
- **Vị trí code do AI sinh (`file:hàm`):** `db/migration/V20261017_1400__dictation_attempt_fields.sql`; `practice/service/PracticeAttemptServiceImpl.java:recordDictationAttempt`, `:findLatestDictationAttempts`, `:findRecentBlankPositions`; `practice/service/DictationStatsQueryServiceImpl.java:countsByWordClass`; `practice/mapper/SentenceAttemptMapper.java:toBlankPositions`; `practice/enums/*`; `PracticeAttemptServiceIntegrationTest.java`, `DictationStatsQueryServiceIntegrationTest.java`, `DictationAttemptSchemaIntegrationTest.java`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế chỉnh sau khi đọc lại bản AI sinh: (1) thông báo lỗi chuyển sang tiếng Anh, ví dụ `IllegalArgumentException` trong `PracticeAttemptServiceImpl.java:validate`; (2) dùng enum `practice/enums/AttemptOutcome`, `AttemptWordClass` cho kết quả từng từ và nhóm từ; (3) chuyển đổi request/entity/view qua `practice/mapper/SentenceAttemptMapper` (`toEntity`, `toView`, `toViews`, `toBlankPositions`). Sửa trước khi đẩy lên, gộp vào `c5b0496` bằng fixup nên không có commit riêng.
- **Commit:** c5b0496
- **Lỗi liên quan:** NONE

### AI-KE-024

- **Ngày:** 2026-10-17
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DICTATION
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** G1: tách từ, phân loại từ, căn chỉnh Levenshtein theo từ và chấm điểm (tương đương, đồng âm, từ biến đổi, gần đúng chính tả)
- **Vị trí code do AI sinh (`file:hàm`):** `dictation/service/token/SentenceTokenServiceImpl.java:tokenize`, `token/WordClassifier.java:classify`; `grading/WordAligner.java:align`, `grading/OutcomeResolver.java:resolve`, `grading/DictationGrader.java:gradeFull`, `:gradeBlanks`, `grading/Normalizer.java`, `grading/EquivalenceTable.java`, `grading/HomophoneTable.java`, `grading/EditDistance.java`; `util/WordListLoader.java`; `resources/dictation/*.txt`; test trong `dictation/service/**`
- **Commit:** ee2e459
- **Lỗi liên quan:** NONE

### AI-KE-025

- **Ngày:** 2026-10-19
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DICTATION
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** G2: chọn ô trống cho mức Easy theo điểm yếu của học viên (k = 40% số từ, 1 đến 3, không kề nhau, tránh ô cũ)
- **Vị trí code do AI sinh (`file:hàm`):** `dictation/service/exercise/BlankPicker.java:pick`, `:blankCount`, `:isBlankable`; `BlankPickerTest.java`
- **Commit:** 2124c2e
- **Lỗi liên quan:** NONE

### AI-KE-026

- **Ngày:** 2026-10-19
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DICTATION
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** G3: API lấy bài, lấy đề, nộp lượt nghe chép; chấm và lưu; mã lỗi `DICTATION_EASY_UNAVAILABLE`
- **Vị trí code do AI sinh (`file:hàm`):** `dictation/controller/DictationController.java`; `dictation/service/DictationServiceImpl.java:getLesson`, `:getPrompt`, `:submitAttempt`; `dictation/dto/**`; `dictation/mapper/DictationMapper.java`; `config/RandomConfig.java`; `common/exception/ErrorCode.java`; `docs/convention/API-CONVENTION.md`; `DictationApiIntegrationTest.java`, `DictationAttemptForwardingTest.java`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế chỉnh sau khi đọc lại bản AI sinh: (1) đặt tên DTO theo convention `*Request`/`*Response`: `dto/request/SubmitAttemptRequest`, `dto/response/AttemptResultResponse`, `DictationLessonResponse`, `PromptResponse`; (2) chuyển đổi trong `DictationServiceImpl` đi qua `dictation/mapper/DictationMapper` (`toResponse`, `toAttemptWord`, `toOutcome`, `toWordClass`). Sửa trước khi đẩy lên, gộp vào `608be7b` bằng fixup nên không có commit riêng.
- **Commit:** 608be7b
- **Lỗi liên quan:** NONE

### AI-KE-027

- **Ngày:** 2026-10-19
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DICTATION
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** G4: trang `/student/dictation/:slug` cho Normal và Hard (phát YouTube theo mốc câu, ô gõ, kết quả tô màu, phím tắt, cài đặt, trạng thái mất mạng/lỗi)
- **Vị trí code do AI sinh (`file:hàm`):** `frontend/src/features/dictation/usePlayer.ts:usePlayer`, `hooks.ts`, `api.ts`, `utils.ts`, `useDictationShortcuts.ts`, `pages/DictationPage.tsx:DictationWorkspace`, `components/*`; `app/routes.tsx`; `components/common/Icon.tsx` (+7 icon); `i18n/locales/{vi,en}/dictation.json`
- **Commit:** ec29e40
- **Lỗi liên quan:** NONE

### AI-KE-028

- **Ngày:** 2026-10-20
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DICTATION
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** G5: mức Easy, con mắt lộ từ, gợi ý Hard hiện bên dưới ô gõ, "Hiện cả câu", nhãn từ đồng âm, màn hoàn thành; endpoint lộ từ; gọn thư mục `service/` thành token, grading, exercise
- **Vị trí code do AI sinh (`file:hàm`):** `dictation/service/DictationServiceImpl.java:revealWord`; `dictation/service/exercise/NextWordFinder.java:firstUnmatchedIndex`; `dictation/dto/request/RevealWordRequest.java`; `frontend/.../components/ClozeInput.tsx`, `WordSlots.tsx`, `HintLine.tsx`, `InputActions.tsx`, `CompletionScreen.tsx`, `ResultDiff.tsx`; `utils.ts:mergeRevealed`, `:averageScore`, `:dominantLevel`; `NextWordFinderTest.java`, `DictationApiIntegrationTest.java` (nhóm `reveal_*`)
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế chỉnh sau khi chạy thử giao diện: (1) nút con mắt lộ từ đặt trên ô trống, trong `components/WordSlots.tsx` và `ClozeInput.tsx`; (2) gợi ý mức Hard hiện bên dưới ô gõ, `components/HintLine.tsx` được render dưới ô trong `FullInput.tsx`. Sửa trước khi đẩy lên, gộp vào `31a5618` nên không có commit riêng.
- **Commit:** 31a5618
- **Lỗi liên quan:** NONE

### AI-KE-029

- **Ngày:** 2026-10-20
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** LESSON
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Tiến độ nghe chép của bài (số câu có kết quả / tổng số câu), ghi `user_lesson_progress` và `user_lesson_mode_progress`, điểm cao nhất từng câu
- **Vị trí code do AI sinh (`file:hàm`):** `practice/service/PracticeProgressQueryServiceImpl.java:countDictationSentencesDone`, `:bestScores`; `lesson/service/LessonProgressServiceImpl.java:recordActivity`; `lesson/service/LessonQueryServiceImpl.java:progress`, `:withBestScore`; `lesson/repository/LessonModeProgressRepository.java`; `LessonProgressServiceIntegrationTest.java`, `PracticeProgressQueryServiceIntegrationTest.java`, `DictationLessonProgressIntegrationTest.java`
- **Commit:** ef21779
- **Lỗi liên quan:** NONE

### AI-KE-030

- **Ngày:** 2026-10-20
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DICTATION
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Mở lại câu đã làm hiện kết quả từng từ: endpoint `attempts/latest`, dựng lại chữ gốc và nhãn đồng âm khi đọc
- **Vị trí code do AI sinh (`file:hàm`):** `dictation/service/DictationServiceImpl.java:getLatestAttempt`, `:toGradedWord`; `practice/service/PracticeAttemptServiceImpl.java:findLatestDictationAttempt`; `practice/mapper/SentenceAttemptMapper.java:toDetailView`; `frontend/.../hooks.ts:useLatestAttempt`, `utils.ts:resultContext`; `DictationLatestAttemptIntegrationTest.java`, `LatestDictationAttemptIntegrationTest.java`
- **Commit:** 92730bb
- **Lỗi liên quan:** NONE

### AI-KE-031

- **Ngày:** 2026-10-20
- **Công cụ AI / model:** Claude Code (Sonnet 5.5)
- **Phạm vi (`Scope`):** DOCUMENTATION
- **Loại công việc (`Task Type`):** DOCUMENTATION
- **Prompt chính / yêu cầu:** Đặc tả use case và quy tắc nghiệp vụ module nghe chép (UC-DICT-01..07, AC-DICT-01..45, BR-DICT-01..13), danh mục UC; UC-LESSON-07
- **Vị trí code do AI sinh (`file:hàm`):** `docs/srs/use-cases/DICT.md`, `docs/srs/use-cases/README.md`, `docs/srs/business-rules.md` (mục DICT), `docs/srs/use-cases/LESSON.md` (UC-LESSON-07)
- **Commit:** 31a5618, ef21779, 92730bb
- **Lỗi liên quan:** NONE

### AI-KE-032

- **Ngày:** 2026-10-28
- **Công cụ AI / model:** Claude Code (Sonnet 5.5, Opus 5.5)
- **Phạm vi (`Scope`):** DOCUMENTATION
- **Loại công việc (`Task Type`):** DOCUMENTATION
- **Prompt chính / yêu cầu:** Đánh giá AI Usage Log theo rubric; tách log theo từng thành viên vào `docs/ai-usage-log/` theo kit quy ước Kế cung cấp; chuyển toàn bộ log cũ trên `main` sang format mới; thêm PR template có checklist kiểm soát đầu ra AI
- **Vị trí code do AI sinh (`file:hàm`):** `docs/ai-usage-log/README.md`; `docs/ai-usage-log/member-log-template.md`; `docs/ai-usage-log/NguyenVanKe-23110234.md`, `NguyenTriLam-23110250.md`; `.github/pull_request_template.md`.
- **Commit:** 5804a8a
- **Lỗi liên quan:** NONE

## 2. Lỗi, đề xuất sai hoặc thiếu sót của AI đã được xác minh

Lỗi trong file này do chủ file tự phát hiện. Mỗi lỗi cần commit sửa thật (xem `README.md` §4.5).

### AI-ERR-KE-001

- **Liên kết bản ghi AI:** AI-KE-014
- **Loại lỗi (`Error Type`):** HALLUCINATED_REFERENCE
- **Ngày phát hiện:** 2026-10-07
- **Đầu ra sai/thiếu sót và bối cảnh:** AI thiết kế header bắt buộc `X-Requested-With` làm lớp chống CSRF cho `/auth/refresh` và `/auth/logout`, rồi giải thích sai hai lần: (1) nói CORS chỉ chặn qua preflight, trong khi Spring Security từ chối (403) mọi request mang `Origin` lạ, kể cả request thật; (2) nói header vẫn buộc request phải do JS của trang được phép tạo ra dù CORS cấu hình nới, trong khi JavaScript phía trình duyệt tự đặt được header. Header chỉ có tác dụng khi đi cùng CORS allow-list, nên là code thừa.
- **Vị trí (`file:hàm`):** `auth/controller/AuthController.java:refresh`, `:logout`; `docs/convention/API-CONVENTION.md` §6
- **Nguyên nhân phân tích:** AI sao chép mẫu "custom header chống CSRF" quen thuộc vào plan mà không phân tích mô hình đe doạ, và lập luận về hành vi CORS từ trí nhớ thay vì kiểm chứng với Spring Security đang dùng.
- **Cách phát hiện / bằng chứng:** Kế đặt câu hỏi về tác dụng riêng của header; đo lại bằng test tạm với request mang `Origin` lạ thì thấy Spring Security trả 403 ngay cả request thật.
- **Cách sửa:** Bỏ yêu cầu header ở `refresh` và `logout`; thay hai test `…withoutRequestedWithHeader…` bằng test CORS chặn origin lạ (AI-KE-018).
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** b7c15af
- **Commit sửa (bắt buộc, khác commit trên):** 264726a
- **Kiểm chứng sau sửa:** `SessionIntegrationTest.java:refresh_fromUnknownOrigin_isRejectedByCors_AC27`, `:logout_fromUnknownOrigin_isRejectedByCorsAndSessionSurvives_AC25`; `./mvnw clean verify` (132/132 xanh).
- **Trạng thái (`Error Status`):** VERIFIED

## 3. Bằng chứng bổ sung (nếu cần)

Không lưu API key, mật khẩu, token, secret hoặc dữ liệu nhạy cảm trong file log.
