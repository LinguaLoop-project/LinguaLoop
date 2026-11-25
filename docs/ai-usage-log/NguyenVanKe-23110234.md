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

### AI-KE-033

- **Ngày:** 2026-11-10
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** DATABASE
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Gộp migration cũ thành baseline theo schema MVP Kế thiết kế; seed phoneme, tài khoản dev, bài học, từ điển; thêm `created_at` cho `topics`, `deck_categories`
- **Vị trí code do AI sinh (`file:hàm`):** `db/migration/V1__init_schema.sql`, `V2__seed_reference_data.sql`; `docs/design/schema-mvp-migration-plan.md`; `backend/seed/seed-dictionary.{sh,ps1}`, `backend/seed/README.md`; `docs/adr/0011-baseline-schema-mvp.md`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế thiết kế schema MVP (`docs/design/schema-mvp.sql`) và quyết định gộp về một baseline
- **Commit:** 4398e5c, 2a4931f, 284d597, fa99d69, 89805b7
- **Lỗi liên quan:** NONE

### AI-KE-034

- **Ngày:** 2026-11-10
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** BACKEND_COMMON
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Sửa entity, repository, service các feature cho khớp schema MVP; thay quota năng lượng AI bằng ví credit; gộp nhật ký về `audit_logs`; phạm vi phụ: AUTH, LESSON, SUBSCRIPTION, AUDIT, DICTIONARY
- **Vị trí code do AI sinh (`file:hàm`):** `user/entity/User.java`, xoá `ConsentService`; `lesson/entity/Lesson.java`, `LessonStatusConverter.java`; `practice/repository/SentenceReviewRepository.java`, `practice/service/PracticeAttemptServiceImpl.java:recordDictationAttempt`; `credit/service/CreditServiceImpl.java` (`refill`, `nextMonthly`), `subscription/entity/ProOrder.java`; `shadowing/entity/AiFeedback.java`; `tutor/TutorSessionService.java`; `audit/entity/AuditLog.java`; `dictionary/entity/DictionaryWord.java`, `dictionary/mapper/WordViewMapper.java`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế quyết định bỏ `ConsentService` và bảng tiến độ bài, tiến độ tính từ `sentence_attempts`, mô hình credit (Free nạp mỗi ngày, Pro theo tháng của gói, trừ theo token), một bảng `audit_logs` chung
- **Commit:** b56cf1b, 951d371, d78829e, 05da4fd, 798580b, e2fd865, 933b81c, edb4f0e, 7fcc075
- **Lỗi liên quan:** AI-ERR-KE-002

### AI-KE-035

- **Ngày:** 2026-11-10
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** BACKEND_COMMON
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Tổ chức lại feature backend và frontend theo domain, viết tài liệu cấu trúc dự án; phạm vi phụ: FRONTEND, DOCUMENTATION
- **Vị trí code do AI sinh (`file:hàm`):** `docs/convention/CAU-TRUC-DU-AN.md`; `frontend/src/features/practice/` (chuyển từ `mywords/`); khung thư mục `credit`, `stats`, `weakness`, `plan`, `phoneme`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế chọn danh sách feature theo domain và cách chia actor trong feature
- **Commit:** 9b19344
- **Lỗi liên quan:** NONE

### AI-KE-036

- **Ngày:** 2026-11-11
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_MODIFICATION
- **Prompt chính / yêu cầu:** Sửa frontend theo API mới: id thay slug, ví credit thay quota, vai trò Giáo viên
- **Vị trí code do AI sinh (`file:hàm`):** `features/lesson/services/lessonService.ts`; `features/subscription/hooks/useCredit.ts`; `features/shadowing/components/ShadowingPractice.tsx`; `features/practice/hooks.ts`; `app/routes.tsx`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế xác định các thay đổi API mà frontend phải theo
- **Commit:** 1b43d95
- **Lỗi liên quan:** NONE

### AI-KE-037

- **Ngày:** 2026-11-12
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** DICTIONARY
- **Loại công việc (`Task Type`):** DEBUGGING
- **Prompt chính / yêu cầu:** Khôi phục phát âm riêng theo loại từ (`pos_pronunciations`) cho từ đồng tự khác âm bị bỏ nhầm khi refactor; seed dữ liệu
- **Vị trí code do AI sinh (`file:hàm`):** `db/migration/V20261112_1600__dictionary_pos_pronunciations.sql`; `dictionary/entity/PosPronunciation.java`; `dictionary/mapper/WordViewMapper.java:rawPronunciationFor`, `:toSnapshot`; `DictionaryApiIntegrationTest.java:lookup_usesPosOverrideOnlyForThatPos`, `:findMeaning_usesPosOverrideOfThatMeaning`; `backend/seed/dictionary-pos-pronunciations.sql.gz`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế phát hiện lỗi; loại bỏ bản IPA đầu tiên AI tự soạn không có nguồn, yêu cầu lấy dữ liệu từ FluentDict (Wiktionary); AI chỉ giữ 44 từ đồng tự khác âm kinh điển vì dữ liệu tự động có nhiều ghi đè sai; chưa có audio theo loại từ
- **Commit:** c9e4aa2
- **Lỗi liên quan:** AI-ERR-KE-002

### AI-KE-038

- **Ngày:** 2026-11-14
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** DOCUMENTATION
- **Loại công việc (`Task Type`):** DOCUMENTATION
- **Prompt chính / yêu cầu:** Rà đặc tả use case NT bằng skill `lingualoop-usecase-spec` và sửa theo kết quả rà; thêm UC-NT-08 (gắn ảnh hàng loạt), BR-NT-09; sau khi có code, rà lại BT và NT cho khớp code (điều kiện tiên quyết, UC-BT-03/04 sửa ngay trên trang bộ, bộ chưa gán chủ, báo cáo theo thẻ), viết quy trình nghiệp vụ NT; cập nhật bảng truy vết
- **Vị trí code do AI sinh (`file:hàm`):** `docs/srs/NT-quan-ly-nhom-the-the/usecase.md`, `quy-tac-nghiep-vu.md`, `quy-trinh-nghiep-vu.md`; `docs/srs/BT-quan-ly-bo-the/usecase.md` (UC-BT-01 đến 08, AC-BT-70 đến 73), `quy-tac-nghiep-vu.md`, `quy-trinh-nghiep-vu.md`; `docs/test/traceability/BT-quan-ly-bo-the.md`, `NT-quan-ly-nhom-the-the.md`, `docs/test/TRACEABILITY-AC-TEST.md`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế chốt các câu hỏi của bản rà: mỗi bộ đều có giáo viên chủ, bộ chưa có chủ chỉ là dữ liệu thu thập chưa làm sạch (giữ trong code, spec ghi "bộ chưa gán chủ"); thêm cột ảnh cho thẻ, tệp nhập không có cột ảnh. Kế sửa đề xuất sai của AI: AI định thêm UC-BT-09 "giao lại quyền sở hữu bộ", Kế chỉ ra chức năng này đã có ở UC-QT-06/07 nên BR-NT-01, BR-BT-01 tham chiếu UC-QT thay vì tạo UC mới. Kế xác nhận báo cáo chỉ áp dụng cho câu và thẻ, nên BR-BT-09 đổi "báo cáo về bộ" thành "báo cáo về thẻ của bộ".
- **Commit:** 55a5b74, dafa657
- **Lỗi liên quan:** NONE

### AI-KE-039

- **Ngày:** 2026-11-14
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** OTHER
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Viết backend quản lý nhóm thẻ và thẻ cho giáo viên (UC-NT-01 đến 08): thêm, sửa, xóa nhóm và thẻ, nhập thẻ từ Excel/CSV kèm tệp mẫu, ảnh thẻ (tải từng thẻ và gắn hàng loạt theo tên tệp), lấy âm thanh từ từ điển theo loại từ khi lưu thẻ. Phạm vi chính: module vocab (BT/NT), phạm vi phụ DATABASE, DICTIONARY
- **Vị trí code do AI sinh (`file:hàm`):** `vocab/controller/TeacherVocabContentController.java`; `vocab/service/VocabDeckContentServiceImpl.java:addGroup`, `:renameGroup`, `:deleteGroup`, `:addCard`, `:updateCard`, `:deleteCard`, `:previewImport`, `:importCards`, `:attachImages`; `vocab/service/CardSheetReader.java`, `CardImportTemplate.java`, `CardPos.java`, `CardImages.java`; `vocab/repository/VocabDeckContentRepository.java`; `vocab/dto/request/CardRequest.java`, `GroupRequest.java`, `AttachCardImagesRequest.java`; `dictionary/service/DictionaryQueryServiceImpl.java:findAudio`; `storage/service/UploadPurpose.java` (`CARD_IMAGE`); migration `V20261114_1000__vocab_cards_image.sql`; `TeacherVocabContentApiIntegrationTest`, `CardSheetReaderTest`. Commit cũng gộp phần backend quản lý bộ thẻ (BT) làm ở phiên trước
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế chọn phạm vi (backend + test trước, frontend sau), giữ hai cột phiên âm UK/US, chọn cách lấy âm thanh (chép từ từ điển khi lưu, không có thì dùng giọng đọc trình duyệt) và cách gắn ảnh (từng thẻ và hàng loạt theo tên tệp). Kế kiểm tra quy tắc trùng tên bộ theo chủ bộ và cách xóa ảnh cũ trên S3 khi thay ảnh. Kiểm chứng: `./mvnw verify` 1151 test xanh, JaCoCo đạt ngưỡng (chạy trước khi thêm audio vào màn quản lý); sau thay đổi đó chạy lại các lớp test vocab liên quan, đều xanh.
- **Commit:** 302abff
- **Lỗi liên quan:** NONE

### AI-KE-040

- **Ngày:** 2026-11-14
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Làm giao diện quản lý nhóm thẻ và thẻ trên trang bộ, tham khảo Parroto: danh sách nhóm có thanh cuộn, hộp thoại thẻ có tra từ điển và chọn ảnh, nhập Excel/CSV, gắn ảnh hàng loạt; sau đó làm lại hiển thị thẻ có nhãn từng trường và nút nghe UK/US, thêm dấu `*` cho trường bắt buộc, làm lại danh sách bộ và đầu trang bộ có icon
- **Vị trí code do AI sinh (`file:hàm`):** `features/vocab/components/manage/GroupList.tsx`, `CardDialog.tsx`, `CardRow.tsx`, `CardImportDialog.tsx`, `CardImagesDialog.tsx`, `GroupDialog.tsx`, `ContentDeleteDialog.tsx`, `DeckBits.tsx`, `DeckDetailView.tsx`, `DeckInfoEditor.tsx`, `ManageDeckList.tsx`; `features/vocab/deckContentApi.ts`, `deckContentHooks.ts`, `deckContentForm.ts:validateCard`, `:attachImagesInBatches`, `:formatIpa`, `:splitByWord`; `components/common/TextField.tsx` (`requiredMark`); `deckContentForm.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế duyệt giao diện qua ảnh chụp màn hình và yêu cầu sửa nhiều lần: dùng một icon chung cho mọi nhóm thay vì icon theo chủ đề, chọn icon `gallery-vertical-end`, hiển thị rõ tên từng trường, thêm dấu `*`, thêm icon cho danh sách bộ và đầu trang bộ. Kế phát hiện phiên âm hiện hai cặp dấu gạch (`//səˈsteɪn//`) do AI bọc thêm `/` quanh dữ liệu đã có sẵn; AI sửa bằng `formatIpa` trước khi commit. Kiểm chứng: `tsc`, `eslint` không lỗi, Vitest 239 test xanh, `npm run build`.
- **Commit:** 55a5b74
- **Lỗi liên quan:** NONE

### AI-KE-041

- **Ngày:** 2026-11-14
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** TESTING
- **Loại công việc (`Task Type`):** TEST_GENERATION
- **Prompt chính / yêu cầu:** Viết test cho các AC của BT, NT còn thiếu và cập nhật bảng truy vết theo test thực có
- **Vị trí code do AI sinh (`file:hàm`):** `VocabDeckLifecycleApiIntegrationTest.java:publish_otherTeachersDeck_returns403AndStaysDraft_AC_BT_71`, `:publish_deletedDeck_returns404_AC_BT_72`; `TeacherVocabContentApiIntegrationTest.java` lớp `GoneTargets` (AC-NT-11, 18, 26, 35, 43, 51, 70, 71), `:updateCard_blankWordOrMeaning_rejectedAndCardKept_AC_NT_38`, `:updateCard_newImageNotJpgOrPng_keepsOldImage_AC_NT_76`, `:attachImages_groupWithoutCards_attachesNothing_AC_NT_72`; `docs/test/traceability/BT-quan-ly-bo-the.md`, `NT-quan-ly-nhom-the-the.md`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế quyết định chưa làm xóa thẻ hàng loạt để ưu tiên test. Script truy vết của AI bỏ sót các AC ghi dạng danh sách trong một tên test (`AC-BT-31, 38, 44, 49`), AI tự phát hiện và sửa AC-BT-38, 44, 49 thành "Một phần" trước khi commit. Các AC "Hủy", "Mất kết nối" trên giao diện vẫn chưa có test vì frontend chưa có thư viện test component. Kiểm chứng: hai lớp test 104/104 xanh; BT 59/73 AC có test, NT 54/76.
- **Commit:** dafa657
- **Lỗi liên quan:** NONE

### AI-KE-042

- **Ngày:** 2026-11-16
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** OTHER — báo cáo nội dung (feature `report`), README §4.2 chưa có giá trị riêng; phạm vi phụ DATABASE, LESSON
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Viết backend xử lý báo cáo hai luồng (UC-BC, UC-XL): học viên gửi báo cáo câu/thẻ, giáo viên chủ sửa theo báo cáo hoặc từ chối, quản trị viên xử lý báo cáo Phản cảm và gỡ nội dung, giáo viên gửi yêu cầu xuất bản lại, quản trị viên duyệt; tự đánh dấu quá hạn và tự đóng báo cáo khi nội dung bị xóa. Sau đó thêm áp dụng bản sửa đề xuất, xem ảnh thẻ bị báo, bộ lọc theo giáo viên chủ, cho quản trị viên xem bộ Nháp bị gỡ do báo cáo, và siết kiểm tra "đã sửa" theo trường học viên chọn
- **Vị trí code do AI sinh (`file:hàm`):** `db/migration/V20261115_1400__report_two_track.sql`; `report/service/ReportSubmitServiceImpl.java:submit`; `report/service/ReportReviewServiceImpl.java:resolve`, `:columnsToCheck`, `:reject`, `:applyFix`, `:detail`, `:listOwners`; `report/service/ReportModerationServiceImpl.java:takeDown`, `:requestRepublish`, `:approve`, `:rejectRepublish`, `:status`; `report/service/ReportMaintenanceService.java:runOnce`; `report/service/ReportCleanupService.java`; `report/service/TakedownQueryServiceImpl.java`; `report/repository/ReportRepository.java:findOwners`, `CARD_FIELDS`; `report/repository/ModerationRepository.java:findUnchanged`, `:takedownItems`; `report/enums/ReportReason.java:changedColumns`; `report/enums/ReportTargetType.java`; `report/controller/TeacherReportController.java:applyFix`; `AdminReportController.java:owners`; `AdminRepublishController.java`, `TeacherRepublishController.java`; `lesson/service/LessonModerationServiceImpl.java:applyReportFix`; `vocab/service/VocabDeckContentServiceImpl.java:applyReportFix`, `:cardImageUrl`; `vocab/service/CardFix.java`; `vocab/service/DeckModerationServiceImpl.java`; `vocab/service/VocabDeckManageServiceImpl.java:adminViewableDeck`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế chốt các quyết định nghiệp vụ: tách hai luồng theo lý do, lý do hiển thị dạng "Sai …" và gom nhóm (chọn phương án 1 khi phân biệt lỗi IPA với lỗi phiên âm), báo cáo ảnh thì sửa bất kỳ trường nào cũng tính là đã sửa, nhưng có trường học viên chọn (`fix_field`) thì chỉ trường đó được tính. Kế chạy thử thủ công và phát hiện: quản trị viên không mở được bộ Nháp bị gỡ để xem trước khi duyệt, gửi xuất bản lại bị chặn vì thay ảnh không được tính là đã sửa và giao diện không nói mục nào chưa sửa; AI sửa cả hai trước khi commit. Đối chiếu đặc tả (design-sync): Kế chọn thêm bộ lọc giáo viên chủ vào code, còn hai chỗ lệch khác sửa đặc tả.
- **Commit:** 62758de
- **Lỗi liên quan:** AI-ERR-KE-003

### AI-KE-043

- **Ngày:** 2026-11-16
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Làm giao diện báo cáo cho học viên, giáo viên, quản trị viên: nút báo cáo, danh sách và chi tiết báo cáo, áp dụng bản sửa đề xuất, xem nội dung bị báo (kèm ảnh thẻ), thông báo nội dung bị gỡ và gửi xuất bản lại, danh sách và chi tiết yêu cầu xuất bản lại; đếm số thật trên menu; gom cụm nút thanh trên cùng
- **Vị trí code do AI sinh (`file:hàm`):** `features/report/components/ReportButton.tsx`, `ReportDialog.tsx`, `ReportListView.tsx`, `ReportListScreen.tsx`, `ReportDetailScreen.tsx`, `HandleReportDialog.tsx`, `ApplyFixDialog.tsx`, `ContentPreviewDialog.tsx`, `TakedownNotice.tsx`, `RepublishListScreen.tsx`, `RepublishDetailScreen.tsx`, `reportBits.tsx`; `features/report/pages/admin/*`, `pages/teacher/*`; `features/report/api.ts`, `hooks.ts:useReportBadge`, `:useApplyFix`, `:useReportOwners`, `:useIsTakenDown`; `reportForm.ts:reasonFilterGroups`, `:reasonFitsType`, `:listParams`; `reportFormat.ts:statusKey`, `:cellText`, `:compareRows`; `paths.ts:adminContentPath`; `features/vocab/components/manage/DeckDetailView.tsx` (`back`, `hideUnpublishReason`); `vocab/pages/admin/AdminDeckDetailPage.tsx:backOf`; `vocab/pages/teacher/TeacherDeckDetailPage.tsx`; `components/layouts/shell/Sidebar.tsx`, `TopBar.tsx`, `shellConfigs.ts`, `AccountMenu.tsx` (`compact`); `components/common/LanguageSwitcher.tsx` (variant `bare`); `app/routes.tsx` (guard `/teacher`); `i18n/locales/{vi,en}/report.json`, `layout.json`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế duyệt qua ảnh chụp màn hình và yêu cầu sửa: đổi tên trạng thái "Chờ giáo viên/Chờ quản trị viên" cho tự nhiên, bỏ số "5" giả trên menu và nhãn "Duyệt bộ từ công…" bị cắt chữ, đổi tên menu cho khớp đặc tả, gom ba khối rời ở thanh trên cùng thành một cụm. Kế phát hiện qua chạy thử: trang xem toàn bộ bộ thẻ của quản trị viên không có nút quay về yêu cầu xuất bản lại, giáo viên phải tải lại trang mới thấy nút gửi xuất bản lại, quản trị viên vào được trang giáo viên; AI sửa cả ba trước khi commit.
- **Commit:** 62758de
- **Lỗi liên quan:** NONE

### AI-KE-044

- **Ngày:** 2026-11-16
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** USER
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Thêm chuông thông báo trên thanh trên cùng cho mọi vai trò: xem 20 thông báo mới nhất, số chưa đọc, đánh dấu một hoặc tất cả đã đọc, tự tải lại định kỳ
- **Vị trí code do AI sinh (`file:hàm`):** `user/repository/NotificationRepository.java:insert`, `:findLatest`, `:countUnread`, `:markRead`, `:markAllRead`; `user/service/NotificationServiceImpl.java:send`, `:latest`, `:markRead`, `:markAllRead`; `user/controller/NotificationController.java`; `user/dto/response/NotificationsResponse.java`; `features/user/notifications.ts:useNotifications`, `:relativeTime`; `features/user/components/NotificationBell.tsx:NotificationBell`, `:PanelBody`; `components/common/Icon.tsx` (`bell`, `check-check`)
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế hỏi vì sao chưa có biểu tượng thông báo, rồi quyết định đặt chuông chung trong cụm nút thanh trên cùng. Các giá trị 20 thông báo, "99+", 60 giây, 7 ngày do AI đề xuất, Kế duyệt khi duyệt UC-TK-09.
- **Commit:** 62758de
- **Lỗi liên quan:** NONE

### AI-KE-045

- **Ngày:** 2026-11-16
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** TESTING
- **Loại công việc (`Task Type`):** TEST_GENERATION
- **Prompt chính / yêu cầu:** Viết test cho AC của BC, XL, phần BT liên quan báo cáo và UC-TK-09; soạn kịch bản kiểm thử thủ công đi qua mọi trạng thái báo cáo
- **Vị trí code do AI sinh (`file:hàm`):** `report/ReportTestData.java:setFix`, `:field`, `:countContentUpdates`; `ReportSubmitApiIntegrationTest.java`; `ReportReviewApiIntegrationTest.java:applyFix_*` (AC-XL-19, 20, 21), `:detail_cardIncludesImageForPreview_sentenceHasNone_AC_XL_14`, `:resolve_onlyChosenFixFieldCounts_AC_XL_27`, `:list_adminFiltersByOwner_andListsOwners_AC_XL_09`; `ReportModerationApiIntegrationTest.java:adminDeckDetail_takenDownDraftIsViewable_plainDraftIsNot_AC_BT_76`, `:republish_replacingReportedImageCountsAsFixed_UC_BT_05_2c`; `user/controller/NotificationApiIntegrationTest.java:latest_newestFirstWithUnreadCount_onlyOwn_AC_TK_53`, `:markRead_oneThenAll_andNotOthers_AC_TK_53_AC_TK_55`, `:latest_withoutToken_returns401`; `vocab/service/VocabDeckManageServiceImplTest.java`; `features/report/reportForm.test.ts`; `features/user/notifications.test.ts`; `features/vocab/deckLifecycle.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế đi theo kịch bản thủ công trên giao diện thật; các lỗi Kế tìm được ghi ở AI-KE-042 và AI-KE-043. Các AC chỉ quan sát được trên giao diện (AC-TK-54, 56, 57, 58 và nhiều AC XL) vẫn để "Thiếu" hoặc "Một phần" vì chưa có Playwright.
- **Commit:** 62758de
- **Lỗi liên quan:** NONE

### AI-KE-046

- **Ngày:** 2026-11-16
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** DOCUMENTATION
- **Loại công việc (`Task Type`):** DOCUMENTATION
- **Prompt chính / yêu cầu:** Đối chiếu đặc tả với code báo cáo và sửa đặc tả theo quyết định; viết UC-TK-09 "Xem thông báo"; review UC-TK-09; cập nhật bảng truy vết AC → test
- **Vị trí code do AI sinh (`file:hàm`):** `docs/srs/XL-xu-ly-bao-cao/usecase.md` (UC-XL-01 bước 5, UC-XL-02 bước 3, 5, 4a, AC-XL-22, UC-XL-05 bước 4), `quy-tac-nghiep-vu.md` (BR-XL-02, 03, 05, 11); `docs/srs/BC-bao-cao-noi-dung/quy-tac-nghiep-vu.md` (BR-BC-05, 10, 11); `docs/srs/BT-quan-ly-bo-the/usecase.md` (UC-BT-04 1c, AC-BT-76, UC-BT-05 2b), `quy-tac-nghiep-vu.md` (BR-BT-01); `docs/srs/TK-tai-khoan-xac-thuc/usecase.md` (UC-TK-09, AC-TK-53 đến 58), `quy-tac-nghiep-vu.md` (BR-TK-16, 17); `docs/srs/NK-nhat-ky-thong-ke-he-thong/usecase.md`, `TN-xem-thong-ke-noi-dung/usecase.md` (tên menu); `docs/test/traceability/XL-xu-ly-bao-cao.md`, `BC-bao-cao-noi-dung.md`, `BT-quan-ly-bo-the.md`, `TK-tai-khoan-xac-thuc.md`; `docs/design/sync-report.md`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế quyết định từng chỗ lệch khi đối chiếu: bỏ "các báo cáo dẫn tới việc gỡ" khỏi đặc tả, sửa đặc tả để giáo viên tự quay lại chi tiết báo cáo, để sau thông báo AC-XL-53 nêu tên câu bị thiếu. Kế phát hiện luồng "3a. Chưa có thông báo nào" của UC-TK-09 bị đặt nhầm vào luồng ngoại lệ; review lại tìm thêm BR-TK-17 nêu sai các sự kiện gửi thông báo và AC-TK-54 dùng học viên trong khi chưa có sự kiện nào gửi thông báo cho học viên; Kế chọn sửa BR-XL-11 theo code (một thông báo gộp mỗi giáo viên) rồi duyệt UC-TK-09. Ở f444d1a, bản ghi này chỉ gồm phần AI sửa tên 6 test cũ trong `BT-quan-ly-bo-the.md` (AC-BT-12, 13, 69, 73); phần còn lại của commit đó không thuộc bản ghi này.
- **Commit:** d7d6101, f444d1a
- **Lỗi liên quan:** NONE

### AI-KE-047

- **Ngày:** 2026-11-18
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** LESSON
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Quản lý bài học của giáo viên và quản trị viên theo UC-BH-01, 02, 04 đến 10: danh sách, chi tiết, sửa thông tin và câu, xuất bản, gỡ, xóa, khôi phục
- **Vị trí code do AI sinh (`file:hàm`):** `lesson/service/LessonManageServiceImpl.java:listForTeacher`, `:listForAdmin`, `:getForTeacher`, `:getForAdmin`, `:updateInfo`, `:updateSentences`, `:fillMissingIpa`, `:validateSentences`, `:publish`, `:unpublishByTeacher`, `:unpublishByAdmin`, `:delete`, `:restore`; `lesson/controller/TeacherLessonController.java`; `lesson/controller/AdminLessonController.java`; `lesson/repository/LessonManageRepository.java`; `LessonManageApiIntegrationTest.java`
- **Commit:** dcb98f8
- **Lỗi liên quan:** AI-ERR-KE-004

### AI-KE-048

- **Ngày:** 2026-11-19
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** USER
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Backend quản trị tài khoản và giao lại nội dung theo UC-QT-01 đến UC-QT-07 (danh sách, chi tiết, khóa, mở khóa, đổi vai trò, nội dung cần giao, giao đã chọn, giao toàn bộ), kèm test API theo AC-QT; phạm vi phụ: AUTH (chặn token, thu hồi phiên), LESSON và vocab (đổi chủ), SUBSCRIPTION (credit khi đổi vai trò)
- **Vị trí code do AI sinh (`file:hàm`):** `user/service/UserAdminServiceImpl.java:list`, `:detail`, `:lock`, `:unlock`, `:changeRole`, `:assertManageable`, `:toDetail`; `user/service/ContentTransferServiceImpl.java:listItems`, `:recipients`, `:summary`, `:transferSelected`, `:transferAll`, `:transfer`, `:lockRecipient`, `:nameConflicts`, `:stillNeedsTransfer`; `user/service/AdminAuditor.java:record`; `user/repository/AdminUserRepository.java:findUsers`, `:countUsers`, `:contentCounts`, `:recentActivities`, `:findTransferItems`, `:findRecipients`, `:containsPattern`; `user/controller/AdminUserController.java`; `user/controller/AdminContentTransferController.java`; `user/dto/request/LockUserRequest.java`, `ChangeRoleRequest.java`, `TransferSelectedRequest.java`, `TransferAllRequest.java`; `security/AccountStatusJwtConverter.java:convert`; `auth/service/AccountLockListener.java:onUserLocked`; `lesson/service/LessonOwnershipServiceImpl.java`; `lesson/repository/LessonOwnershipRepository.java`; `vocab/service/DeckOwnershipServiceImpl.java`; `vocab/repository/DeckOwnershipRepository.java`; `credit/service/CreditServiceImpl.java:resetForRoleChange`; `config/CaseInsensitiveEnumConverterFactory.java`; `AdminUserApiIntegrationTest.java`; `AdminContentTransferApiIntegrationTest.java`; `AdminUserTestData.java`
- **Commit:** ef22ae9
- **Lỗi liên quan:** NONE

### AI-KE-049

- **Ngày:** 2026-11-19
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Màn quản trị tài khoản và giao lại nội dung cho UC-QT-01 đến UC-QT-07: danh sách, chi tiết, các hộp khóa, mở khóa, đổi vai trò, giao nội dung; nút giao nội dung từ chi tiết báo cáo (AC-QT-46); i18n vi/en
- **Vị trí code do AI sinh (`file:hàm`):** `src/features/user/pages/admin/AdminUserListPage.tsx:AdminUserListPage`; `src/features/user/pages/admin/AdminUserDetailPage.tsx:AdminUserDetailPage`; `src/features/user/pages/admin/AdminContentTransferPage.tsx:AdminContentTransferPage`; `src/features/user/components/admin/LockUserDialog.tsx:LockUserDialog`; `src/features/user/components/admin/UnlockUserDialog.tsx:UnlockUserDialog`; `src/features/user/components/admin/ChangeRoleDialog.tsx:ChangeRoleDialog`; `src/features/user/components/admin/TransferDialog.tsx:TransferDialog`; `src/features/user/adminUsers.ts:validateLockReason`, `:listState`, `:errorMessageKey`, `:parsePreselect`; `src/features/user/hooks.ts`; `src/features/user/api.ts:adminUserApi`; `src/features/user/adminUsers.test.ts`; `src/features/report/components/ReportDetailScreen.tsx:ReportDetailScreen`
- **Commit:** ef22ae9
- **Lỗi liên quan:** NONE

### AI-KE-050

- **Ngày:** 2026-11-22
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** SUBSCRIPTION
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Trừ credit cố định theo đơn vị nghiệp vụ (ADR 0013): tặng credit dùng thử một lần thay credit miễn phí mỗi ngày, ghi chi phí thật của mỗi lần dùng (token, chi phí cố định, phiên giọng nói do trình duyệt báo token hoặc ước tính theo thời lượng), nối vào 5 tính năng tính credit, trả credit đã trừ và số dư khi tạo bài và gợi ý dịch; phạm vi phụ: DATABASE (migration), LESSON, SHADOWING
- **Vị trí code do AI sinh (`file:hàm`):** `db/migration/V20261121_1000__fixed_credit_pricing.sql`; `credit/service/CreditServiceImpl.java:requireCanStart`, `:charge`, `:recordCost`, `:logFailedCost`, `:logFailure`, `:recordLiveUsage`, `:estimateUnreportedLiveCosts`, `:fillEstimate`, `:fill`, `:maxLiveDuration`, `:costOf`, `:refresh`, `:grant`; `credit/service/LiveCostEstimateJob.java:run`; `credit/AiUsage.java`; `credit/entity/AiWallet.java:grantTrial`, `:closeTrial`, `:add`; `credit/entity/AiUsageLog.java:forSession`, `:liveCostPending`, `:fillLiveCost`; `credit/entity/AiSettings.java:update`; `credit/entity/AiFeaturePrice.java:update`; `credit/repository/AiUsageLogRepository.java:findLivePendingForUpdate`, `:lockStaleLivePending`; `credit/repository/AiWalletRepository.java:resetBalance`; `credit/dto/LiveUsageRequest.java`; `config/CreditProperties.java`; `aichat/LessonChatServiceImpl.java:liveStarted`, `:liveUsage`; `aichat/LessonChatController.java:liveUsage`; `tutor/TutorSessionService.java:started`, `:reportUsage`; `tutor/controller/TutorController.java:usage`; `lesson/service/TeacherLessonImportServiceImpl.java:create`, `:saveDraft`; `lesson/service/LessonSuggestionServiceImpl.java:suggest`, `:translate`; `lesson/transcript/Transcript.java`; `lesson/transcriptapi/TranscriptApiTranscriber.java:transcribe`; `shadowing/service/AiFeedbackServiceImpl.java`; `CreditServiceIntegrationTest.java`; `LiveCostIntegrationTest.java`; `TutorSessionLifecycleIntegrationTest.java:usage_fillsTheCostOfTheChargedSessionOnce_andHidesOthersSessions`; `LessonChatLiveApiIntegrationTest.java:liveUsage_fillsTheCostOfTheChargedConversationOnce`; `TeacherLessonImportApiIntegrationTest.java:create_transcriptInAnotherLanguage_logsTheBilledCostWithoutCharging`, `:create_videoWithoutCaptions_logsNoCost`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế chốt các quyết định nghiệp vụ và thiết kế, AI viết code theo: tặng 100 credit dùng thử một lần thay credit miễn phí mỗi ngày, bỏ credit dùng thử còn lại khi mua Pro, số dư về 0 khi Pro hết hạn, không cấp bù cho tài khoản cũ; tạo bài từ YouTube 10 credit; thực hành theo bài giữ đơn giá Live; gộp hai migration chưa chạy trên prod thành một file; chi phí phiên giọng nói lấy token do trình duyệt báo kèm ước tính theo thời lượng; điền chi phí vào dòng trừ credit qua cột `session_id` thay cho cột `cost_recorded_at` AI đề xuất; ghi chi phí khi tạo bài lỗi sau lúc đã lấy phụ đề; ở MVP chấp nhận tính theo giá model chính, bỏ qua model dự phòng
- **Commit:** b28a11e
- **Lỗi liên quan:** NONE

### AI-KE-051

- **Ngày:** 2026-11-22
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** SUBSCRIPTION
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** API quản trị theo UC-GA-01 đến UC-GA-07: xem và sửa cấu hình credit (kiểm tra người khác vừa sửa, ghi audit), danh sách, thêm, sửa, mở bán và ngừng bán gói Pro, cấp credit cho giáo viên kèm thông báo; phạm vi phụ: USER, AUDIT
- **Vị trí code do AI sinh (`file:hàm`):** `credit/service/AdminCreditConfigServiceImpl.java:get`, `:update`; `credit/controller/AdminCreditConfigController.java`; `credit/dto/CreditConfigView.java`; `credit/dto/UpdateCreditConfigRequest.java`; `subscription/service/AdminProPlanServiceImpl.java:list`, `:create`, `:update`, `:setOnSale`; `subscription/controller/AdminProPlanController.java`; `subscription/entity/ProPlan.java:create`, `:edit`, `:setOnSale`; `subscription/repository/ProPlanRepository.java:nameTaken`, `:purchaseCounts`, `:findForUpdate`; `subscription/dto/ProPlanView.java`; `subscription/dto/request/ProPlanRequest.java`; `subscription/dto/request/SetOnSaleRequest.java`; `user/service/UserAdminServiceImpl.java:grantCredit`; `user/controller/AdminUserController.java:grantCredit`; `user/dto/request/GrantCreditRequest.java`; `common/exception/ErrorCode.java` (các mã `CREDIT_CONFIG_*`, `PRO_PLAN_*`, `CREDIT_GRANT_NOT_ALLOWED`); `audit/enums/AuditAction.java:GRANT_CREDIT`; `audit/enums/AuditEntityType.java:SETTINGS`, `:PLAN`; `AdminCreditConfigApiIntegrationTest.java`; `AdminProPlanApiIntegrationTest.java`; `AdminTeacherCreditApiIntegrationTest.java`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế quyết định làm các API quản trị trong cùng nhánh với phần trừ credit và cho quản trị viên sửa số credit dùng thử
- **Commit:** a542af7
- **Lỗi liên quan:** NONE

### AI-KE-052

- **Ngày:** 2026-11-22
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Giao diện cho credit cố định: giá trên từng nút dùng AI, thanh số dư của học viên và giáo viên, thông báo credit đã trừ và số dư sau khi tạo bài và gợi ý dịch, đếm và báo token của phiên giọng nói, trang quản trị cấu hình credit, gói Pro và hộp cấp credit cho giáo viên; bỏ menu "Đăng ký Pro" và "Danh mục lỗi"; i18n vi/en
- **Vị trí code do AI sinh (`file:hàm`):** `src/features/credit/pages/admin/AdminCreditConfigPage.tsx:AdminCreditConfigPage`; `src/features/credit/margin.ts:planMargin`, `:parseIntIn`, `:parsePercent`; `src/features/credit/api.ts`; `src/features/credit/hooks.ts:useCreditConfig`, `:useUpdateCreditConfig`; `src/features/subscription/pages/admin/AdminProPlanPage.tsx:AdminProPlanPage`; `src/features/subscription/components/admin/PlanFormDialog.tsx:PlanFormDialog`; `src/features/subscription/components/admin/PlanOnSaleDialog.tsx:PlanOnSaleDialog`; `src/features/subscription/services/adminPlanService.ts`; `src/features/subscription/hooks/useAdminPlans.ts`; `src/features/subscription/components/CreditCost.tsx:CreditCost`; `src/features/user/components/admin/GrantCreditDialog.tsx:GrantCreditDialog`; `src/features/user/pages/admin/AdminUserDetailPage.tsx:AdminUserDetailPage`; `src/lib/liveUsage.ts:LiveUsageMeter`; `src/features/aichat/controller.ts:#reportUsage`; `src/features/tutor/controller.ts:#reportUsage`; `src/hooks/aiEnergyMath.ts:deriveEnergy`; `src/hooks/useAiEnergy.ts:useAiEnergy`; `src/components/layouts/shell/TopBar.tsx:TopBar`; `src/features/lesson/manage/useCreateCallbacks.ts:useCreateCallbacks`; `src/features/lesson/manage/components/LessonWorkspace.tsx:applySuggestions`; `src/app/routes.tsx`; `src/features/credit/margin.test.ts`; `src/lib/liveUsage.test.ts`; `src/hooks/aiEnergyMath.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế yêu cầu bỏ hai mục menu quản trị không dùng và hiện thanh số dư cho cả giáo viên
- **Commit:** 479ddde
- **Lỗi liên quan:** NONE

### AI-KE-053

- **Ngày:** 2026-11-22
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** DOCUMENTATION
- **Loại công việc (`Task Type`):** DESIGN
- **Prompt chính / yêu cầu:** Ghi quyết định trừ credit cố định theo đơn vị nghiệp vụ (ADR 0013) và cập nhật đặc tả cho thống nhất giữa các module: credit dùng thử, chi phí thật và chi phí phiên giọng nói (BR-GA-03, 04, 06, 12), các UC và AC liên quan của AI, BH, PR, QT, NK; điền bảng truy vết GA, AI, BH
- **Vị trí code do AI sinh (`file:hàm`):** `docs/adr/0013-tru-credit-co-dinh-theo-don-vi-nghiep-vu.md`; `docs/adr/0012-loi-thoai-bai-hoc-lay-tu-phu-de-qua-transcriptapi.md`; `docs/srs/GA-quan-ly-goi-han-muc-ai/quy-tac-nghiep-vu.md`, `usecase.md`; `docs/srs/AI-thuc-hanh-voi-ai/quy-tac-nghiep-vu.md`, `usecase.md`; `docs/srs/BH-quan-ly-bai-hoc/quy-tac-nghiep-vu.md`, `usecase.md`; `docs/srs/PR-goi-pro/quy-tac-nghiep-vu.md`, `usecase.md`; `docs/srs/QT-quan-tri-tai-khoan/quy-tac-nghiep-vu.md`, `usecase.md`; `docs/srs/NK-nhat-ky-thong-ke-he-thong/quy-tac-nghiep-vu.md`, `usecase.md`; `docs/test/traceability/GA-quan-ly-goi-han-muc-ai.md`, `AI-thuc-hanh-voi-ai.md`, `BH-quan-ly-bai-hoc.md`; `docs/test/TRACEABILITY-AC-TEST.md`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế chốt chính sách credit dùng thử và cách ghi chi phí phiên giọng nói (xem AI-KE-050), AI ghi lại vào ADR và đặc tả
- **Commit:** 5800230
- **Lỗi liên quan:** NONE

### AI-KE-054

- **Ngày:** 2026-11-25
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** DATABASE
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Thêm cột đối tượng chứa cho nhật ký, chặn xóa tài khoản ở cơ sở dữ liệu và thêm chỉ mục theo thời gian cho các truy vấn thống kê hệ thống
- **Vị trí code do AI sinh (`file:hàm`):** `db/migration/V20261123_1000__audit_logs_parent.sql`; `db/migration/V20261123_1100__users_no_delete.sql:forbid_user_delete`; `db/migration/V20261123_1200__stats_time_indexes.sql`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế chốt không xóa tài khoản mà chỉ khóa (BR-NK-16)
- **Commit:** 6883f5f
- **Lỗi liên quan:** NONE

### AI-KE-055

- **Ngày:** 2026-11-25
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** AUDIT
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** API nhật ký hoạt động và thống kê hệ thống cho quản trị viên (UC-NK-01 đến 04); thu gọn phạm vi ghi nhật ký theo mức rủi ro và thống nhất cột `changes` theo dạng `{"trường":{"old","new"}}`; rút gọn thống kê AI còn doanh thu thuần, chi phí, lãi gộp và lãi lỗ từng tính năng theo đơn vị tính tiền
- **Vị trí code do AI sinh (`file:hàm`):** `audit/controller/AdminAuditLogController.java`; `audit/service/AuditAdminServiceImpl.java:list`, `:detail`, `:open`; `audit/repository/AuditLogQueryRepository.java:find`, `:count`, `:findDisplayName`; `audit/dto/AuditChanges.java:field`, `:build`; `audit/service/AuditTargetLookup.java`; `lesson/service/LessonAuditTargetLookup.java`; `vocab/service/VocabAuditTargetLookup.java`; `vocab/service/VocabAuditor.java:deck`; `auth/service/SecurityAuditor.java:loginLocked`, `:passwordReset`, `:passwordChanged`; `report/service/ReportAuditor.java:submitted`, `:closed`; `report/repository/ReportRepository.java:findAuditSubjects`, `:rejectOpenByReporter`; `report/repository/ModerationRepository.java:closeForPermanentlyDeleted`, `:closeForDeletedItems`, `:closeForSentence`, `:closeForCard`, `:closeForGroup`; `report/service/TakedownMarker.java:mark`; `lesson/service/LessonDraftWriter.java`; `lesson/service/LessonManageServiceImpl.java:updateInfo`, `:sameAs`; `vocab/service/VocabDeckManageServiceImpl.java`; `user/service/UserAdminServiceImpl.java`; `user/service/ContentTransferServiceImpl.java`; `stats/controller/AdminStatsController.java`; `stats/service/SystemStatsAdminServiceImpl.java:overview`, `:practice`, `:aiUsage`, `:feature`; `stats/service/RevenueCalculator.java:revenue`, `:grossProfit`, `:grossMarginPct`; `stats/service/AiEconomicsCalculator.java:pricePerUnit`, `:costPerUnit`, `:isLoss`, `:sharePct`; `stats/service/StatsWindow.java`; `stats/repository/OverviewStatsRepository.java`, `PracticeStatsRepository.java`, `AiUsageStatsRepository.java`, `RevenueStatsRepository.java`; `config/CacheConfig.java:cacheManager`; test `AdminAuditLogApiIntegrationTest`, `AuditCoverageIntegrationTest`, `AuditChangesTest`, `SystemStatsAdminServiceIntegrationTest`, `AdminStatsApiIntegrationTest`, `AiEconomicsCalculatorTest`, `RevenueCalculatorTest`, `StatsWindowTest`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế yêu cầu rút gọn trang thống kê AI, chỉ giữ số liệu lãi lỗ cùng biểu đồ credit theo ngày và top tài khoản; tính giá bán và chi phí theo đơn vị tính tiền thay vì theo lượt gọi. Kế chọn thu gọn nhật ký: bỏ ghi sửa câu, nhóm thẻ, thẻ, thông tin bài học và bộ thẻ, nhắc báo cáo quá hạn; bỏ trang lịch sử đối tượng (UC-NK-02 cũ). Kế bảo rollback phần gom nhiều lần sửa câu thành một mục nhật ký mà AI đã viết
- **Commit:** 77d3e05
- **Lỗi liên quan:** NONE

### AI-KE-056

- **Ngày:** 2026-11-25
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** FRONTEND
- **Loại công việc (`Task Type`):** CODE_GENERATION
- **Prompt chính / yêu cầu:** Trang nhật ký hoạt động (lọc, chi tiết Trước / Sau, "Thông tin lúc tạo", "Mở đối tượng") và ba trang thống kê quản trị: tổng quan, luyện tập, AI và chi phí; i18n vi/en
- **Vị trí code do AI sinh (`file:hàm`):** `src/features/audit/pages/admin/AdminAuditLogPage.tsx:AdminAuditLogPage`; `src/features/audit/components/AuditDetailDialog.tsx:AuditDetailDialog`; `src/features/audit/components/AuditBits.tsx:ChangeList`, `:Value`, `:ActionBadge`, `:ActorCell`; `src/features/audit/components/AuditTable.tsx:AuditTable`; `src/features/audit/auditFormat.ts:auditObjectPath`, `:formatAuditTime`, `:changeLines`, `:changeMode`, `:valueText`, `:widerPeriod`; `src/features/audit/api.ts`; `src/features/audit/hooks.ts`; `src/features/stats/pages/admin/AdminOverviewPage.tsx:AdminOverviewPage`; `src/features/stats/pages/admin/AdminPracticeStatsPage.tsx:AdminPracticeStatsPage`; `src/features/stats/pages/admin/AdminAiStatsPage.tsx:AdminAiStatsPage`; `src/features/stats/components/AiStatsBits.tsx:ProfitSummary`, `:FeatureProfitTable`; `src/features/stats/components/LineChart.tsx:LineChart`; `src/features/stats/components/StatsBits.tsx`; `src/features/stats/statsFormat.ts`; `src/components/common/FilterSelect.tsx:FilterSelect`; `src/app/routes.tsx`; `src/i18n/locales/vi/auditAdmin.json`, `statsAdmin.json` (và bản `en`); `src/features/audit/auditFormat.test.ts`; `src/features/stats/statsFormat.test.ts`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế góp ý giao diện chi tiết nhật ký: không hiện "trống → giá trị" khi tạo, hiện tên câu hoặc từ cho báo cáo thay vì "(không tên)", dịch mã trạng thái thay vì hiện JSON
- **Commit:** 74b25ec
- **Lỗi liên quan:** NONE

### AI-KE-057

- **Ngày:** 2026-11-25
- **Công cụ AI / model:** Claude Code (Opus 5.5)
- **Phạm vi (`Scope`):** DOCUMENTATION
- **Loại công việc (`Task Type`):** DOCUMENTATION
- **Prompt chính / yêu cầu:** Cập nhật đặc tả NK theo phạm vi nhật ký đã thu gọn (bỏ UC-NK-02 cũ, BR-NK-05, BR-NK-11; viết lại BR-NK-03, 17, 18 và ma trận ghi nhật ký), rút gọn UC thống kê AI (BR-NK-09, 14), đánh số lại UC-NK-01 đến 04 và AC-NK-01 đến 27 cho liên tục; sửa các module BH, BT, NT, XL cho khớp; đồng bộ bảng truy vết NK
- **Vị trí code do AI sinh (`file:hàm`):** `docs/srs/NK-nhat-ky-thong-ke-he-thong/usecase.md`, `quy-tac-nghiep-vu.md`; `docs/srs/BH-quan-ly-bai-hoc/usecase.md`; `docs/srs/BT-quan-ly-bo-the/quy-tac-nghiep-vu.md`; `docs/srs/NT-quan-ly-nhom-the-the/quy-tac-nghiep-vu.md`; `docs/srs/XL-xu-ly-bao-cao/usecase.md`, `quy-tac-nghiep-vu.md`; `docs/test/traceability/NK-nhat-ky-thong-ke-he-thong.md`; `docs/test/TRACEABILITY-AC-TEST.md`
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** Kế chọn phạm vi ghi nhật ký và yêu cầu đánh số lại cho liên tục.
- **Commit:** 097c746
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

### AI-ERR-KE-002

- **Liên kết bản ghi AI:** AI-KE-034
- **Loại lỗi (`Error Type`):** LOGIC_ERROR
- **Ngày phát hiện:** 2026-11-12
- **Đầu ra sai/thiếu sót và bối cảnh:** Khi đưa từ điển về schema MVP, AI xếp cột `pos_pronunciations` vào nhóm "chỉ để chờ tính năng chưa làm" (ADR 0011) rồi xoá cột, `PosPronunciation` và hàm `pronunciationFor`. Thực tế tính năng đang chạy: mỗi nhóm loại từ hiện phát âm riêng cho từ đồng tự khác âm (present danh từ /ˈprez.ənt/, động từ /prɪˈzent/). Sau refactor mọi loại từ dùng chung một phát âm.
- **Vị trí (`file:hàm`):** `dictionary/mapper/WordViewMapper.java:groupByPos`, `:toSnapshot`; `dictionary/entity/DictionaryWord.java`
- **Nguyên nhân phân tích:** AI gộp cột này chung với `cefr_level`, `source` (thật sự không dùng) mà không kiểm tra code đang đọc cột; test có dùng cột cũng bị sửa theo thay vì giữ làm bằng chứng.
- **Cách phát hiện / bằng chứng:** Kế hỏi lý do bỏ cột; `git show edb4f0e` cho thấy xoá `pronunciationFor` và test `lookup_usesPosOverrideOnlyForThatPos`.
- **Cách sửa:** Migration thêm lại cột; khôi phục `PosPronunciation`, ghi đè theo loại từ trong `WordViewMapper` (cả `toSnapshot` khi lưu thẻ); seed 44 từ (IPA từ Wiktionary); sửa ADR 0011.
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** edb4f0e
- **Commit sửa (bắt buộc, khác commit trên):** c9e4aa2
- **Kiểm chứng sau sửa:** `DictionaryApiIntegrationTest` 16/16 qua (thêm `lookup_usesPosOverrideOnlyForThatPos`, `findMeaning_usesPosOverrideOfThatMeaning`); `SavedWordApiIntegrationTest` 16/16; seed chạy hai lần liên tiếp trên Postgres 17.
- **Trạng thái (`Error Status`):** VERIFIED

### AI-ERR-KE-003

- **Liên kết bản ghi AI:** AI-KE-042
- **Loại lỗi (`Error Type`):** SECURITY_ISSUE
- **Ngày phát hiện:** 2026-11-17
- **Đầu ra sai/thiếu sót và bối cảnh:** AI viết SQL bằng cách ghép chuỗi lúc chạy và để service gọi thẳng `JdbcClient`. (1) `LessonModerationServiceImpl` gọi SQL trực tiếp trong service, bỏ qua `LessonRepository`/`SentenceRepository` và entity JPA của feature `lesson`, vi phạm quy tắc `controller -> service -> repository`; `applyReportFix` ghép tên cột vào câu `SELECT`/`UPDATE` (chỉ an toàn nhờ whitelist). (2) `ModerationRepository` và `ReportRepository` ghép tên cột, mệnh đề `WHERE` và danh sách cột vào câu lệnh lúc chạy (`containerColumn(type)`, `targetColumn(type)`, `Filter.where()`, `closeWhere(where, …)`, `hasChanged(columns)`). SonarCloud báo 14 lỗ hổng `java:S2077` và quality gate của PR #62 thất bại (security rating 3, ngưỡng 1).
- **Vị trí (`file:hàm`):** `lesson/service/LessonModerationServiceImpl.java:unpublishForReport`, `:publishApproved`, `:applyReportFix`; `report/repository/ModerationRepository.java:isTakenDown`, `:closeOpenOffensive`, `:markTakenDown`, `:findActiveTakedown`, `:snapshotItems`, `:closeWhere`; `report/repository/ReportRepository.java:existsOpen`, `:insert`, `:findGroups`, `:countGroups`, `:hasChanged`
- **Nguyên nhân phân tích:** AI chọn ghép chuỗi cho gọn thay vì tách câu lệnh hằng theo từng loại nội dung, và tự đặt lý do sai "tránh đụng repository/entity của feature Lâm" (nhóm đã bỏ chia feature theo người) nên không dùng lớp repository của `lesson`. AI không chạy phân tích tĩnh trước khi commit, chỉ dựa vào whitelist trong code để coi là an toàn.
- **Cách phát hiện / bằng chứng:** Kế hỏi vì sao service gọi thẳng SQL; SonarCloud PR #62 (`api/issues/search?pullRequest=62`) liệt kê 14 vấn đề `java:S2077` ở ba file trên, quality gate `new_security_rating` = 3 (ERROR).
- **Cách sửa:** `LessonModerationServiceImpl` dùng `LessonRepository.findLibraryForUpdate` và `SentenceRepository.findActiveForUpdate` (JPA, khóa `PESSIMISTIC_WRITE`), đổi trạng thái và trường qua entity. Các repository của `report` chuyển sang câu lệnh hằng chọn theo loại nội dung; danh sách cột và điều kiện lọc truyền bằng tham số.
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** 62758de
- **Commit sửa (bắt buộc, khác commit trên):** 08814d9, f05f474 (08814d9 gồm `ModerationRepository` và `ReportMaintenanceService` vì hai file này lẫn với phần gỡ tay; f05f474 gồm `LessonRepository`, `SentenceRepository`, `LessonModerationServiceImpl`, `ReportRepository`)
- **Kiểm chứng sau sửa:** `./mvnw verify` trên f05f474: 1226 test, 0 lỗi, 3 bỏ qua, BUILD SUCCESS.
- **Trạng thái (`Error Status`):** VERIFIED

### AI-ERR-KE-004

- **Liên kết bản ghi AI:** AI-KE-047
- **Loại lỗi (`Error Type`):** LOGIC_ERROR
- **Ngày phát hiện:** 2026-11-18
- **Đầu ra sai/thiếu sót và bối cảnh:** AI viết các thao tác xuất bản, gỡ, xóa và xem bài học mà không nối với dấu "Bị quản trị viên gỡ" (BR-XL-13), dù `TakedownQueryService` và `TakedownCommandService` đã có sẵn và bộ thẻ đã dùng. Hậu quả: (1) `publish` không kiểm dấu nên giáo viên xuất bản lại thẳng được bài bị quản trị viên gỡ, bỏ qua bước duyệt; (2) `unpublishByAdmin` chỉ đổi về Nháp và lưu lý do, không gắn dấu, không đóng báo cáo Phản cảm, không báo giáo viên; (3) `delete` không hủy yêu cầu xuất bản lại đang chờ; (4) `getForAdmin` không cho quản trị viên xem bài Nháp đang chờ duyệt. Vi phạm AC-BH-51, 76, 77, 78, 79, 80 và BR-BH-02, 04, 06. Test `adminUnpublish_reasonShownToTeacher_AC_BH_51` do AI viết chỉ kiểm lý do gỡ nên lỗi lọt qua.
- **Vị trí (`file:hàm`):** `lesson/service/LessonManageServiceImpl.java:publish`, `:unpublishByAdmin`, `:delete`, `:getForAdmin`
- **Nguyên nhân phân tích:** Thiếu ngữ cảnh repo: AI sinh service theo các UC của BH mà không đối chiếu quy tắc chéo module BR-XL-13 và contract `Takedown*Service` có từ 62758de, cũng không so với `VocabDeckManageServiceImpl` đã nối sẵn. AI viết test theo hành vi vừa sinh thay vì đủ các mệnh đề trong AC-BH-51, và để AC-BH-76 đến 80 ở trạng thái "Thiếu" trong bảng truy vết mà không coi đó là chức năng còn thiếu.
- **Cách phát hiện / bằng chứng:** Rà soát trước khi mở PR cho thấy `isLessonTakenDown`, `markLessonByAdmin`, `cancelPendingForDeletedLesson` không được gọi ngoài feature `report`. Ghi BUG-001 (#64). Năm test hồi quy fail trước khi sửa, ví dụ `publish_lessonTakenDownByReport_requiresReview_AC_BH_76`: `Status expected:<409> but was:<204>`.
- **Cách sửa:** `publish` trả `REPORT_REVIEW_REQUIRED` khi bài mang dấu; `unpublishByAdmin` gọi `markLessonByAdmin`; `delete` gọi `cancelPendingForDeletedLesson`; `getForAdmin` cho xem bài Nháp đang mang dấu. Trang bài học của giáo viên hiện khung "Bị quản trị viên gỡ" kèm nút gửi yêu cầu duyệt (`LessonWorkspace.tsx`); hộp xác nhận nêu số báo cáo Phản cảm sẽ đóng và yêu cầu đang chờ (`LessonActionDialog.tsx`).
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** dcb98f8
- **Commit sửa (bắt buộc, khác commit trên):** 061b15f
- **Kiểm chứng sau sửa:** `ReportModerationApiIntegrationTest.publish_lessonTakenDownByReport_requiresReview_AC_BH_76`, `:adminUnpublishLesson_marksNotifiesAndClosesOffensive_AC_BH_51_AC_BH_80`, `:deleteLesson_cancelsPendingRequest_AC_BH_78`, `:restoreLesson_keepsTakedownMark_AC_BH_79`, `:adminLessonDetail_takenDownDraftIsViewable_plainDraftIsNot_AC_BH_10` pass; `./mvnw verify`: 1427 test, 0 lỗi, BUILD SUCCESS.
- **Trạng thái (`Error Status`):** VERIFIED

## 3. Bằng chứng bổ sung (nếu cần)

Không lưu API key, mật khẩu, token, secret hoặc dữ liệu nhạy cảm trong file log.
