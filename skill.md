# 🎯 SKILL CHUẨN — Team LinguaLoop

> **Stack:** Spring Boot 3.3 (Java 21) + React 18 + TypeScript (Vite)
> **Deploy:** Render (backend, Docker/GHCR) · Vercel (frontend, CLI)
> **Repo layout:** Monorepo (`backend/` + `frontend/` + `.github/workflows/`)
>
> **Mục đích:** Thống nhất cách code, review, deploy giữa các thành viên khi vibe code với AI.
> Mọi prompt, mọi PR, mọi commit phải tuân theo file này. AI sinh code lệch chuẩn → **từ chối merge**.
>
> **Cập nhật lần cuối:** 30/09/2026 · **Version:** 2.0 (đồng bộ với `backend-ci.yml` v1 và `frontend-ci.yml` v1)

---

## Mục lục

- [0. Nguyên tắc vàng](#0-nguyên-tắc-vàng)
- [1. Skill chung](#1-skill-chung)
- [2. Skill Backend — Spring Boot](#2-skill-backend--spring-boot)
- [3. Skill Frontend — ReactJS](#3-skill-frontend--reactjs)
- [4. API Contract](#4-api-contract)
- [5. Design System Token](#5-design-system-token)
- [6. CI/CD Pipeline](#6-cicd-pipeline)
- [7. Deployment](#7-deployment)
- [8. Checklist Review PR](#8-checklist-review-pr)
- [9. Prompt Template cho AI](#9-prompt-template-cho-ai)
- [10. Tài liệu tham chiếu](#10-tài-liệu-tham-chiếu)

---

## 0. NGUYÊN TẮC VÀNG (Bắt buộc đọc trước khi code)

| #   | Nguyên tắc                                                                                                                               | Hệ quả nếu vi phạm |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 1   | **Một nguồn sự thật duy nhất** cho mỗi khái niệm (giới hạn lượt, mức CEFR, trạng thái Pro) — không copy logic sang nhiều nơi             | PR bị reject       |
| 2   | **Backend không trả entity thô** — luôn trả DTO                                                                                          | PR bị reject       |
| 3   | **Frontend không hardcode business rule** — mọi con số (5 lượt, 200 lượt, ngưỡng 60/80) đọc từ API hoặc constants dùng chung             | PR bị reject       |
| 4   | **Mọi prompt AI phải ghi vào `AI_USAGE_LOG.md`** (theo Rubric TC2.3)                                                                     | Mất điểm đồ án     |
| 5   | **Không commit secret** — dùng biến môi trường Render/Vercel. Gitleaks sẽ chặn CI                                                        | Mất điểm + bảo mật |
| 6   | **Mọi thao tác ghi dữ liệu nhạy cảm → ghi audit log** (nâng Pro, khoá user, sửa nội dung)                                                | PR bị reject       |
| 7   | **Monorepo layout cố định** — mọi PR nằm trong `backend/**`, `frontend/**` hoặc `.github/workflows/**`. Không tạo thư mục code lạ ở root | PR bị reject       |

### Cây thư mục chính thức

```
lingualoop/
├── backend/                       # Spring Boot, Maven, Java 21
│   ├── mvnw, mvnw.cmd
│   ├── pom.xml                    # BẮT BUỘC: surefire, jacoco, spotbugs, sonar
│   ├── Dockerfile                 # multi-stage, temurin:21-jre-alpine
│   ├── src/main/java/...
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   ├── application-staging.yml
│   │   └── application-prod.yml   # đọc env, KHÔNG hardcode
│   └── src/test/java/...
├── frontend/                      # React + Vite + TS
│   ├── package.json
│   ├── .nvmrc                     # "20"
│   └── src/...
├── .github/workflows/
│   ├── backend-ci.yml
│   └── frontend-ci.yml
├── docs/
│   ├── SKILL.md                   # file này
│   ├── SRS_TLCN_01.docx
│   ├── dac-ta-chuc-nang-theo-vai-tro.md
│   └── Rubric_TLCN_KLTN_v2.pdf
├── AI_USAGE_LOG.md                # bắt buộc theo Rubric TC2.3
├── CONTRIBUTING.md
└── README.md
```

---

## 1. SKILL CHUNG

### 1.1. Naming convention

| Đối tượng               | Quy ước                | Ví dụ                       |
| ----------------------- | ---------------------- | --------------------------- |
| Biến, hàm (Java)        | `camelCase`            | `calculateWeaknessScore()`  |
| Class, Interface (Java) | `PascalCase`           | `ShadowingAttemptService`   |
| Constant                | `UPPER_SNAKE_CASE`     | `MAX_DAILY_SHADOWING_FREE`  |
| Bảng DB                 | `snake_case` số nhiều  | `sentence_attempts`         |
| Cột DB                  | `snake_case`           | `accuracy_score`            |
| API path                | `kebab-case`, số nhiều | `/api/v1/sentence-attempts` |
| Component React         | `PascalCase`           | `ShadowingResultCard.tsx`   |
| Hook React              | `use` + `camelCase`    | `useShadowingAttempt()`     |
| File CSS/Tailwind token | `kebab-case`           | `text-primary-soft`         |
| Biến môi trường         | `UPPER_SNAKE_CASE`     | `VITE_API_URL`              |

### 1.2. Git workflow bắt buộc

**Nhánh:**

```
main          ← production (auto deploy Render + Vercel --prod)
develop       ← integration (deploy staging + Vercel Preview)
feature/<mã>  ← ví dụ: feature/S-15-shadowing-result
fix/<mã>      ← ví dụ: fix/SHAD-012-quota-error
hotfix/<mã>   ← chỉ dùng khi main lỗi
```

**Bảng hành vi CI theo nhánh:**

| Nhánh                   | Backend CI                                          | Frontend CI                                            |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| `feature/*`, `fix/*`    | Build + Lint + Test + Security (qua PR)             | Build + Lint + Test (qua PR)                           |
| `develop`               | Deploy **staging** (webhook + health check)         | Deploy **Preview** Vercel                              |
| `main`                  | Deploy **staging** + Docker push `:main`, `:latest` | Deploy **Production** Vercel (`--prod`)                |
| PR vào `main`/`develop` | Build + Lint + Test + Security, KHÔNG deploy        | Build + Lint + Test + **Preview + comment URL vào PR** |

**Quy tắc CI bổ sung:**

- **Path filter:** PR sửa `backend/**` không trigger CI frontend và ngược lại (đã cấu hình sẵn trong workflow).
- **Concurrency:** push liên tiếp cùng nhánh → CI cũ tự cancel (`cancel-in-progress: true`).
- **Tag image Docker:** `:main`, `:develop`, `:pr-<N>`, `:sha-<7 ký tự>`, `:latest` (chỉ `main`). Rollback = kéo lại `:sha-<sha7>` cũ.

**Commit message (Conventional Commits):**

```
feat(S-15): hiển thị 4 vòng điểm shadowing
fix(SHAD-012): không trừ quota khi Azure lỗi
refactor(deck): tách DeckService thành interface + impl
docs(srs): cập nhật BR-03 ngưỡng Free 50 lượt
test(dictation): thêm test case bỏ sót từ chức năng
```

**Quy tắc PR:**

- Tiêu đề PR ghi rõ mã màn hình: `[S-15] Shadowing result page`
- Bắt buộc ít nhất 1 reviewer
- Phải pass CI (xem [§6](#6-cicd-pipeline)) trước khi merge
- PR > 400 dòng diff → tách nhỏ

### 1.3. File `AI_USAGE_LOG.md` — Bắt buộc mỗi người

Đây là minh chứng **làm chủ AI**, không phải đạo văn (theo Rubric TC2.3 và Mục 6).

```markdown
| Ngày  | Công cụ | Prompt chính                                      | Phần AI sinh            | Phần tự sửa                                           | Commit |
| ----- | ------- | ------------------------------------------------- | ----------------------- | ----------------------------------------------------- | ------ |
| 28/09 | Claude  | "Sinh service chấm dictation theo BR-06"          | DictationScoringService | Sửa thuật toán align từ, thêm edge case dấu câu       | a1b2c3 |
| 29/09 | ChatGPT | "Sinh component React hiển thị kết quả shadowing" | ShadowingResult.tsx     | Đổi màu theo design token, thêm state locked cho Free | d4e5f6 |
```

**Bắt buộc ghi:** công cụ, prompt chính, phần AI sinh, phần tự sửa, commit hash. Nếu AI sinh code không dùng → ghi rõ "AI sai, tự viết lại từ đầu" cũng là minh chứng tốt.

### 1.4. Ánh xạ Business Rules (BR-01 → BR-20)

Toàn bộ 20 BR từ đặc tả chức năng phải được thực thi ở tầng tương ứng:

| BR | Tên / Mô tả | Tầng triển khai | Ghi chú |
|---|---|---|---|
| BR-01 | Email/username unique | **DB** | `UNIQUE` constraint, `citext` |
| BR-02 | Disabled không đăng nhập | **BE** (`AuthService`) | Chặn ở luồng tạo JWT |
| BR-03 | Pro = sub còn hạn | **DB/BE** (`v_user_plan`) | View sinh ra trạng thái gói, BE đọc |
| BR-04 | Hạn mức `plan_limits` | **BE** (`QuotaService`) | Dùng cache/DB tính trong timezone user |
| BR-05 | Chỉ trừ lượt khi thành công | **BE** (`ShadowingService`) | Trừ sau khi API Azure trả kết quả |
| BR-06 | Consent system | **BE + FE** (`ConsentGate`) | Check trước khi gọi Azure/lưu Audio |
| BR-07 | audio expires at | **BE** (CronJob/Event) | Xoá audio cũ quá 90 ngày (trừ mốc) |
| BR-08 | 1 phiên học/user | **DB** | Ràng buộc duy nhất phiên mở |
| BR-09 | max daily reviews | **BE** (`PlanService`) | Giới hạn thẻ lấy ra ôn mỗi ngày |
| BR-10 | 1 kế hoạch/ngày | **DB** | `UNIQUE` trên `daily_plans` |
| BR-11 | Retest sau 28 ngày | **BE** | Trả cờ `canRetest` cho frontend |
| BR-12 | Câu yếu tự động ôn | **BE** (`ReviewQueue`) | Tự trigger khi điểm < 60 hoặc số lần nghe > 5 |
| BR-13 | Teacher duyệt luôn | **BE** | Phân nhánh logic theo role khi publish |
| BR-14 | Audit log bất biến | **BE** (`AuditInterceptor`) | Ghi log mọi thao tác nội dung |
| BR-15 | Xử lý báo lỗi có note | **BE** | Bắt buộc field `resolutionNote` |
| BR-16→18 | Ràng buộc content | **DB/BE** | Ràng buộc khi Teacher/Admin thao tác |
| BR-19 | UI Lock Pro | **FE** (`QuotaGate`) | Hiện component mờ/khoá |
| BR-20 | Ngưỡng phoneme | **BE** | Tính toán view có đếm > 5 cơ hội |

### 1.5. Xử lý Khoảng trống Schema (Schema Gaps)

Đặc tả đề cập 12 khoảng trống schema. Các tính năng **MUST** và **SHOULD** cần được bổ sung vào schema (qua `V3__add_missing_schema.sql`):
- **MUST**: `users.learning_goals`, `daily_time_budget_min`, `preferred_accent`, `onboarded_at`, auth tokens table.
- **SHOULD**: `vocab_decks.review_note`, `payments` table.

---

## 2. SKILL BACKEND — Spring Boot

### 2.1. Cấu trúc thư mục (Package by Feature)

```
backend/src/main/java/com/lingualoop/
├── LinguaLoopApplication.java
├── common/                        # Dùng chung toàn hệ thống
│   ├── config/                    # SecurityConfig, OpenApiConfig, CorsConfig
│   ├── exception/                 # GlobalExceptionHandler, BusinessException
│   ├── dto/                       # ApiResponse<T>, PageResponse<T>, ErrorResponse
│   ├── security/                  # JwtProvider, CurrentUser, PermissionEvaluator
│   ├── util/                      # TextNormalizer, TimeZoneUtil
│   └── audit/                     # AuditableEntity, AuditLogger
├── auth/                          # Feature: xác thực
│   ├── AuthController.java
│   ├── AuthService.java
│   ├── dto/
│   └── token/                     # AuthTokenService, EmailVerificationService
├── user/
├── lesson/
├── dictation/
├── shadowing/
├── vocabulary/                    # Deck, Card, SRS
├── assessment/                    # CEFR placement test
├── weakness/                      # Hồ sơ điểm yếu
├── plan/                          # Daily plan
├── subscription/                  # Gói Pro, hạn mức
├── admin/
└── integration/                   # Azure Speech, LLM client
    ├── azure/                     # AzureSpeechClient
    └── llm/                       # LlmFeedbackClient
```

> ❌ **KHÔNG** dùng cấu trúc `controller/`, `service/`, `repository/` phẳng.

**Cấu trúc file CI bắt buộc:**

```
backend/
├── mvnw, mvnw.cmd
├── pom.xml                        # BẮT BUỘC plugins dưới đây
├── Dockerfile                     # multi-stage
└── src/
    ├── main/java/com/lingualoop/...
    ├── main/resources/
    │   ├── application.yml
    │   ├── application-dev.yml
    │   ├── application-staging.yml
    │   └── application-prod.yml   # đọc env, KHÔNG hardcode
    └── test/java/...
```

### 2.2. Design Patterns **BẮT BUỘC** áp dụng

#### (A) Layered Architecture — Controller → Service → Repository

```java
// Controller: CHỈ nhận request, validate, gọi service, trả response
@RestController
@RequestMapping("/api/v1/shadowing")
@RequiredArgsConstructor
public class ShadowingController {
    private final ShadowingService shadowingService;

    @PostMapping("/attempts")
    @Operation(summary = "Submit shadowing attempt và nhận kết quả chấm")
    public ApiResponse<ShadowingAttemptResponse> submit(
            @Valid @RequestBody SubmitShadowingRequest req,
            @AuthenticationPrincipal UserPrincipal user) {
        return ApiResponse.ok(shadowingService.submit(user.id(), req));
    }
}
```

#### (B) Strategy Pattern — Cho thuật toán có nhiều biến thể

Áp dụng ở:

- **Chấm Dictation** (`DictationScoringStrategy` — normal / strict)
- **Chấm âm vị** (`PhonemeScoringStrategy` — ngưỡng Free vs Pro)
- **SRS** (`SrsAlgorithm` — SM-2 hiện tại, có thể thêm FSRS)
- **AI Feedback** (`LlmProvider` — OpenAI / Claude / Gemini)
- **Payment** (`PaymentGateway` — MoMo / VNPay / Sandbox)

```java
public interface DictationScoringStrategy {
    SentenceAttemptResult score(String expected, String actual);
    ScoringMode mode();
}

@Service
@RequiredArgsConstructor
public class DictationScoringService {
    private final Map<ScoringMode, DictationScoringStrategy> strategies;

    public DictationScoringService(List<DictationScoringStrategy> list) {
        this.strategies = list.stream()
            .collect(Collectors.toMap(DictationScoringStrategy::mode, Function.identity()));
    }
    public SentenceAttemptResult score(ScoringMode mode, String expected, String actual) {
        return strategies.get(mode).score(expected, actual);
    }
}
```

#### (C) Factory Pattern — Tạo đối tượng phức tạp

- Tạo `DailyPlanItem` theo loại (`srs_review`, `weakness_drill`, `lesson_task`, `retest`)
- Tạo `AssessmentItem` theo loại (`vocab_yes_no`, `dictation_sentence`, `shadowing_sentence`)

#### (C2) State Pattern — Cho vòng đời thực thể

Áp dụng cho thẻ SRS (SM-2):
- Trạng thái thẻ: `NEW`, `LEARNING`, `REVIEWING`, `MASTERED`. Chuyển đổi trạng thái và logic tính `next_review` đặt trong State object.

#### (D) Builder Pattern

Dùng **Lombok `@Builder`** thay vì tự viết builder.

#### (E) Repository Pattern + Specification — Query động

```java
public interface LessonRepository extends JpaRepository<Lesson, Long>,
                                          JpaSpecificationExecutor<Lesson> {}

Specification<Lesson> spec = Specification.where(null);
if (cefr != null) spec = spec.and(LessonSpecs.hasCefr(cefr));
if (isPro != null) spec = spec.and(LessonSpecs.isPro(isPro));
Page<Lesson> page = lessonRepository.findAll(spec, pageable);
```

#### (F) Observer / Event Pattern — Decouple side effects

```java
// Publisher
@Service
@RequiredArgsConstructor
public class ShadowingService {
    private final ApplicationEventPublisher events;
    public ShadowingAttemptResponse submit(...) {
        events.publishEvent(new ShadowingAttemptCompletedEvent(attempt));
        return mapper.toResponse(attempt);
    }
}

// Listener — mỗi listener 1 @Component riêng
@Component
@RequiredArgsConstructor
public class WeaknessUpdateListener {
    @Async
    @EventListener
    public void on(ShadowingAttemptCompletedEvent e) { /* cập nhật weakness */ }
}
```

#### (G) Mapper Pattern — MapStruct

```java
@Mapper(componentModel = "spring")
public interface SentenceAttemptMapper {
    @Mapping(source = "expectedText", target = "expected")
    SentenceAttemptResponse toResponse(SentenceAttempt entity);
}
```

#### (H) Result Pattern — Cho luồng có lỗi "có thể dự đoán"

```java
public sealed interface ScoringResult permits ScoringResult.Success, ScoringResult.Failure {
    record Success(SentenceAttemptResult data) implements ScoringResult {}
    record Failure(String code, String message) implements ScoringResult {}
}
```

Áp dụng cho: shadowing (SHAD_010/011/012), auth (email chưa xác thực), quota (hết lượt).

#### (I) Template Method — Cho API gọi bên thứ 3

```java
public abstract class ExternalApiTemplate {
    public final <T> T call(Supplier<T> action, String errorCode) {
        try {
            return action.get();
        } catch (TimeoutException e) {
            retryOnce();  // BR-12: retry tối đa 1 lần
            return action.get();
        } catch (Exception e) {
            log.warn("[{}] External API failed", errorCode, e);
            throw new ExternalServiceException(errorCode);  // KHÔNG trừ quota
        }
    }
}
```

### 2.3. Quy tắc code bắt buộc

| Rule        | Chi tiết                                                                                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-BE-01** | Mọi API trả `ApiResponse<T>` gồm `{ code, message, data }`                                                                                                                         |
| **R-BE-02** | `@Transactional` chỉ trên Service. Query dùng `readOnly = true`                                                                                                                    |
| **R-BE-03** | Không `findById().get()` — dùng `.orElseThrow(() -> new ResourceNotFoundException(...))`                                                                                           |
| **R-BE-04** | Business rule (BR-01 → BR-15) đặt trong `BusinessRulesConfig` (đọc từ DB), **không hardcode**                                                                                      |
| **R-BE-05** | Response có field enum → `@JsonValue` trả string cố định                                                                                                                           |
| **R-BE-06** | Không catch `Exception` chung. Catch cụ thể: `ResourceNotFoundException`, `QuotaExceededException`                                                                                 |
| **R-BE-07** | Config (URL Azure, key, ngưỡng) đọc từ `@ConfigurationProperties`, không `@Value` rải rác                                                                                          |
| **R-BE-08** | Test tối thiểu 1 test cho mỗi public method của Service                                                                                                                            |
| **R-BE-09** | Mọi entity có `createdAt`, `updatedAt` (dùng `AuditingEntityListener`)                                                                                                             |
| **R-BE-10** | API path versioned: `/api/v1/...`                                                                                                                                                  |
| **R-BE-11** | `pom.xml` **bắt buộc** có: `maven-surefire-plugin`, `jacoco-maven-plugin` (LINE ≥ 0.30 trong CI, target 0.50), `spotbugs-maven-plugin` (`failOnError=false`), `sonar-maven-plugin` |
| **R-BE-12** | `Dockerfile` multi-stage: builder `maven:3.9-eclipse-temurin-21`, runtime `eclipse-temurin:21-jre-alpine`. Không mang Maven source vào image cuối                                  |
| **R-BE-13** | Bắt buộc expose `/actuator/health` — CI poll endpoint này sau deploy, timeout 5 phút. Bật `management.endpoint.health.probes.enabled=true`                                         |
| **R-BE-14** | Profile `prod` **tắt** springdoc (`springdoc.api-docs.enabled=false`), chỉ bật ở `dev`/`staging`                                                                                   |
| **R-BE-15** | Không có dependency `-SNAPSHOT` trong `pom.xml` (CI sẽ check)                                                                                                                      |
| **R-BE-16** | Mọi exception nghiệp vụ kế thừa `BusinessException` với `errorCode`, xử lý tại `GlobalExceptionHandler` — không catch chung `Exception` ở Service                                  |
| **R-BE-17** | **DB Migration (Flyway)**: Chỉ thêm file mới `V{version}__{description}.sql`. **Tuyệt đối không sửa** migration đã chạy.                                                           |

### 2.4. Error codes chuẩn (map với SRS)

```java
public final class ErrorCodes {
    // Auth
    public static final String AUTH_EMAIL_EXISTS = "AUTH_001";
    public static final String AUTH_EMAIL_NOT_VERIFIED = "AUTH_002";
    public static final String AUTH_ACCOUNT_LOCKED = "AUTH_003";
    // Shadowing (theo SRS)
    public static final String SHAD_AUDIO_SNR_LOW = "SHAD_010";
    public static final String SHAD_ASR_FAILED = "SHAD_011";
    public static final String SHAD_QUOTA_EXCEEDED = "SHAD_012";
    // Admin
    public static final String ADM_DELETE_IN_USE_ITEM = "ADM_010";
    public static final String ADM_CEFR_THRESHOLD_INVALID = "ADM_020";
}
```

**Format log lỗi** — luôn prefix `[<code>]` để grep trong Render log:

```java
log.warn("[SHAD_012] user={} used={} limit={}", userId, used, limit);
```

---

## 3. SKILL FRONTEND — ReactJS

### 3.1. Stack cố định (KHÔNG tự đổi)

| Concern      | Lựa chọn                                 | Ghi chú                                           |
| ------------ | ---------------------------------------- | ------------------------------------------------- |
| Node         | **20**                                   | Pin trong `.nvmrc` và CI env `NODE_VERSION: "20"` |
| Build tool   | **Vite**                                 | Deploy Vercel 1 click                             |
| Ngôn ngữ     | **TypeScript strict mode**               | Bắt lỗi type khi vibe code                        |
| Routing      | **React Router v6**                      | Chuẩn                                             |
| State server | **TanStack Query**                       | Cache, retry, loading/error tự động               |
| State client | **Zustand**                              | Nhẹ, đủ dùng                                      |
| Form         | **React Hook Form + Zod**                | Validate share schema với BE                      |
| UI           | **Tailwind CSS + shadcn/ui**             | Khớp design system                                |
| HTTP         | **Axios** (có interceptor)               | Tự động attach JWT, xử lý 401                     |
| Icons        | **lucide-react**                         | Nhất quán                                         |
| i18n         | **react-i18next** (vi/en)                | Theo spec S-25                                    |
| Test         | **Vitest + Testing Library**             | Chạy nhanh                                        |
| E2E          | **Playwright** (tối thiểu 3 luồng chính) | Rubric TC2.5                                      |

**Scripts bắt buộc trong `package.json`:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --max-warnings 0",
    "type-check": "tsc -b --noEmit",
    "test": "vitest",
    "test:cov": "vitest run --coverage",
    "gen:api": "openapi-typescript http://localhost:8080/v3/api-docs -o src/shared/types/api.d.ts"
  }
}
```

### 3.2. Cấu trúc thư mục (Feature-based)

```
frontend/src/
├── main.tsx
├── App.tsx
├── router/                        # Route theo vai trò
│   ├── index.tsx
│   ├── StudentRoutes.tsx
│   ├── TeacherRoutes.tsx
│   └── AdminRoutes.tsx
├── shared/
│   ├── api/                       # axios instance, interceptors
│   │   ├── client.ts
│   │   └── endpoints/
│   ├── components/                # Button, Modal, QuotaMeter, PaywallModal...
│   ├── hooks/                     # useAuth, useDebounce, useMediaQuery
│   ├── types/                     # Global types, API envelope
│   ├── constants/                 # ErrorCodes, RoutePaths, CefrLevels
│   └── utils/                     # formatScore, scoreColor (5.2 spec)
├── features/
│   ├── auth/
│   ├── lesson/
│   ├── dictation/
│   ├── shadowing/
│   │   ├── api/                   # useShadowingAttempt, useSubmitAttempt
│   │   ├── components/            # ShadowingRecorder, WordScoreList, PhonemePanel
│   │   ├── pages/                 # ShadowingPracticePage, ShadowingResultPage
│   │   ├── adapters/              # snake_case → camelCase
│   │   ├── schemas/               # zod schemas
│   │   └── types/                 # TypeScript types cho feature
│   ├── vocabulary/
│   ├── assessment/
│   ├── weakness/
│   ├── plan/
│   ├── subscription/
│   ├── teacher/
│   └── admin/
└── layouts/
    ├── StudentLayout.tsx
    ├── TeacherLayout.tsx
    └── AdminLayout.tsx
```

**Alias `@/` → `src/`.** Import vượt quá 2 cấp `../../` là dấu hiệu code sai cấu trúc.

### 3.3. Design Patterns **BẮT BUỘC** áp dụng

#### (A) Container / Presentational Pattern

- **Page** (`*Page.tsx`) → gọi hook, xử lý loading/error, truyền props
- **Component** (`*Card.tsx`, `*Panel.tsx`) → chỉ render, không gọi API

```tsx
// ✅ ĐÚNG
export function ShadowingResultPage() {
  const { attemptId } = useParams();
  const { data, isLoading, error, refetch } = useShadowingAttempt(attemptId!);
  if (isLoading) return <ResultSkeleton />;
  if (error) return <ErrorState onRetry={refetch} />;
  return <ShadowingResultView attempt={data} />;
}

// ❌ SAI — component vừa gọi API vừa render
export function ShadowingResultView() {
  const [data, setData] = useState(null);
  useEffect(() => { axios.get(...) }, []);
}
```

#### (B) Compound Component

```tsx
<ScoreCard>
  <ScoreCard.Ring label="Chính xác" value={68} />
  <ScoreCard.Ring label="Trôi chảy" value={81} />
  <ScoreCard.Ring label="Đầy đủ" value={100} />
  <ScoreCard.Ring label="Ngữ điệu" value={64} />
</ScoreCard>
```

#### (C) Render Props / Children as Function

```tsx
<QuotaGate feature="shadowing_assess">
  {({ remaining, isLocked, onUpgrade }) =>
    isLocked ? (
      <UpgradeBanner onUpgrade={onUpgrade} />
    ) : (
      <RecorderButton remaining={remaining} />
    )
  }
</QuotaGate>

// Cổng kiểm tra Consent dữ liệu (BR-06)
<ConsentGate consentType="ai_processing" fallback={<RequestConsentModal />}>
  <ShadowingRecorder />
</ConsentGate>
```

#### (D) Custom Hooks — BẮT BUỘC cho mọi API

```tsx
// features/shadowing/api/useShadowingAttempt.ts
export function useShadowingAttempt(attemptId: string) {
  return useQuery({
    queryKey: ["shadowing-attempt", attemptId],
    queryFn: () => shadowingApi.getAttempt(attemptId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitShadowing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shadowingApi.submit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quota", "shadowing_assess"] });
      qc.invalidateQueries({ queryKey: ["weakness"] });
    },
    onError: (err) => {
      if (err.code === "SHAD_012") toast.error("Hết lượt hôm nay");
    },
  });
}
```

#### (E) Adapter Pattern — Cho API response

```ts
// features/shadowing/adapters/shadowingAdapter.ts
export const toShadowingAttempt = (
  raw: RawShadowingAttempt,
): ShadowingAttempt => ({
  id: raw.id,
  overallScore: raw.overall_score,
  accuracyScore: raw.accuracy_score,
  words: raw.words.map(toWordScore),
  aiFeedbackLocked: raw.ai_feedback_locked,
});
```

#### (F) Strategy Pattern — Cho hành vi UI có nhiều biến thể

VD: hiển thị từ theo outcome (spec 5.2):

```ts
const wordRenderers: Record<WordOutcome, (w: WordScore) => ReactNode> = {
  correct: (w) => <span className="text-success">{w.text}</span>,
  omitted: (w) => <span className="border-dashed border-danger text-neutral-400">{w.expected}</span>,
  substituted: (w) => <span className="line-through text-danger">{w.actual}</span>,
  misspelled: (w) => <span className="bg-warning-soft font-bold">{highlightWrongChars(w)}</span>,
  inserted: (w) => <span className="line-through text-purple-500">{w.actual}</span>,
  mispronounced: (w) => <span className="text-danger underline decoration-wavy">{w.text}</span>,
};
```

#### (G) Provider Pattern

- `AuthProvider` — user, token, logout
- `ThemeProvider` — light/dark/system
- `ToastProvider` — toast queue
- **Không** dùng Redux. State phức tạp → Zustand store theo feature.

#### (H) Protected Route / RBAC Pattern

```tsx
<Route element={<RequireRole role="instructor" />}>
  <Route path="/teacher/*" element={<TeacherLayout />} />
</Route>

<Route element={<RequirePro />}>
  <Route path="/app/weakness/full" element={<WeaknessFullPage />} />
</Route>
```

#### (I) Error Boundary + Suspense

```tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <Suspense fallback={<PageSkeleton />}>
    <Outlet />
  </Suspense>
</ErrorBoundary>
```

### 3.4. Quy tắc code bắt buộc

| Rule        | Chi tiết                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| **R-FE-01** | Không gọi `axios` trực tiếp trong component. Chỉ qua hook React Query                                               |
| **R-FE-02** | Mọi form dùng `react-hook-form` + `zod`. Không `useState` từng field                                                |
| **R-FE-03** | Mọi màu/space/font đọc từ Tailwind token (đã cấu hình theo §5). Không `#4F46E5` rải rác                             |
| **R-FE-04** | Mọi màn hình có data phải xử lý **4 trạng thái**: `loading`, `empty`, `error`, `success`. Pro feature thêm `locked` |
| **R-FE-05** | Component < 200 dòng. Nếu dài hơn → tách                                                                            |
| **R-FE-06** | Không `any`. Dùng `unknown` + zod parse khi nhận từ API                                                             |
| **R-FE-07** | Mọi chuỗi UI tiếng Việt đặt trong `i18n/vi.json`. Quy tắc key: `feature.component.key` (vd: `shadowing.result.accuracy`) |
| **R-FE-08** | Không `useEffect` để fetch data — dùng React Query                                                                  |
| **R-FE-09** | Ảnh/video có `loading="lazy"` + kích thước cố định (tránh layout shift)                                             |
| **R-FE-10** | Nút ghi âm dùng hook `useAudioRecorder()` chung                                                                     |
| **R-FE-11** | Không `// @ts-ignore`. Nếu cần suppress → `// @ts-expect-error <lý do>`                                             |
| **R-FE-12** | ESLint phải **0 warning** (CI dùng `--max-warnings 0`)                                                              |
| **R-FE-13** | Mọi biến môi trường prefix `VITE_`, đọc qua `import.meta.env.VITE_*`. **Không** `process.env`                       |
| **R-FE-14** | Alias `@/` → `src/`. Import vượt quá 2 cấp `../../` là dấu hiệu code sai cấu trúc                                   |
| **R-FE-15** | Mọi feature có ít nhất 1 file `.test.tsx` khi merge vào `develop`                                                   |

---

## 4. API Contract — Điểm giao thoa BE ↔ FE

### 4.1. Envelope thống nhất

```json
// Success
{
  "code": "OK",
  "message": "Success",
  "data": { ... },
  "meta": { "page": 1, "size": 20, "total": 145 }
}

// Error
{
  "code": "SHAD_012",
  "message": "Bạn đã dùng hết 5 lượt chấm hôm nay",
  "details": { "limit": 5, "used": 5, "resetAt": "2026-09-29T00:00:00+07:00" }
}
```

### 4.2. Quy tắc đặt tên field

| BE (Java)      | JSON            | FE (TS)                         |
| -------------- | --------------- | ------------------------------- |
| `overallScore` | `overall_score` | `overallScore` (adapter chuyển) |
| `createdAt`    | `created_at`    | `createdAt`                     |
| `isPro`        | `is_pro`        | `isPro`                         |

> **Chốt:** BE dùng `@JsonProperty("snake_case")` và FE dùng adapter. **Không** đổi BE sang camelCase.

### 4.3. OpenAPI & generate types

- Backend dùng `springdoc-openapi-starter-webmvc-ui` (thêm vào `pom.xml`).
- Endpoint `/v3/api-docs` và `/swagger-ui.html` bật ở `dev`/`staging`, tắt ở `prod`.
- FE chạy `npm run gen:api` khi BE có thay đổi contract — **không tự viết type API tay**.
- Mọi Controller method mới phải có `@Operation(summary = "...")`.

---

## 5. Design System Token

### 5.1. Bảng màu (Tailwind config)

```ts
// frontend/tailwind.config.ts
export default {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // Cấu hình CSS Variables cho Light/Dark mode
        primary: { DEFAULT: "var(--primary)", soft: "var(--primary-soft)" },
        accent: { DEFAULT: "var(--accent)" },
        pro: { DEFAULT: "var(--pro)" },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        bg: "var(--bg)",
        surface: "var(--surface)",
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', "sans-serif"],
        ipa: ['"Noto Sans"', "sans-serif"],
      },
      fontSize: {
        display: ["36px", { lineHeight: "44px", fontWeight: "700" }],
        h1: ["28px", { lineHeight: "36px", fontWeight: "700" }],
        h2: ["22px", { lineHeight: "30px", fontWeight: "700" }],
        h3: ["18px", { lineHeight: "26px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        small: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }],
      },
      borderRadius: { btn: "10px", card: "16px", modal: "20px" },
    },
  },
};
```

**Badge CEFR:**

| Level | Màu    | Hex       |
| ----- | ------ | --------- |
| A1    | Green  | `#22C55E` |
| A2    | Lime   | `#84CC16` |
| B1    | Cyan   | `#06B6D4` |
| B2    | Blue   | `#3B82F6` |
| C1    | Purple | `#8B5CF6` |
| C2    | Pink   | `#EC4899` |

### 5.2. Hàm dùng chung cho màu điểm

```ts
// shared/utils/scoreColor.ts
export const scoreColor = (s: number) =>
  s >= 80 ? "text-success" : s >= 60 ? "text-warning" : "text-danger";

export const scoreBadge = (s: number) =>
  s >= 80 ? "bg-success/10" : s >= 60 ? "bg-warning/10" : "bg-danger/10";
```

### 5.3. Trạng thái bắt buộc cho mọi màn danh sách/dữ liệu

`loading` (skeleton) · `empty` (minh hoạ + CTA) · `error` (thông báo + Thử lại) · `no-permission` (khoá + lý do) · `locked` (mờ + icon khoá vàng + nút "Nâng cấp Pro").

---

## 6. CI/CD Pipeline

### 6.1. Backend pipeline (6 job)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Build (mvn clean compile)                                │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌───────────────┐ ┌───────────────┐ ┌────────────────┐
│ 2. Lint       │ │ 3. Test       │ │ 4. Security    │
│ SpotBugs      │ │ mvn verify    │ │ Gitleaks (chặn)│
│ SonarCloud    │ │ JaCoCo ≥30%   │ │ Trivy (cảnh báo)│
└───────┬───────┘ └───────┬───────┘ └────────┬───────┘
        └────────────────┬┴──────────────────┘
                         ▼
              ┌─────────────────────┐
              │ 5. Docker build+push│ → ghcr.io/.../backend:sha-xxx
              └──────────┬──────────┘
                         ▼ (chỉ main)
              ┌─────────────────────┐
              │ 6. Deploy staging   │ → webhook + poll /actuator/health
              └─────────────────────┘
```

**Chi tiết:** xem `.github/workflows/backend-ci.yml`.

### 6.2. Frontend pipeline (4 job)

```
┌──────────────────────────────────────┐
│ 1. Build (tsc -b + vite build)       │
└──────────────┬───────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌────────────┐   ┌─────────────────┐
│ 2. Lint    │   │ 3. Test         │
│ ESLint 0W  │   │ Vitest (skip OK)│
└─────┬──────┘   └────────┬────────┘
      └────────┬──────────┘
               ▼
      ┌────────────────────────────────┐
      │ 4. Deploy Vercel CLI           │
      │ - develop/PR → Preview + comment│
      │ - main       → --prod           │
      └────────────────────────────────┘
```

**Chi tiết:** xem `.github/workflows/frontend-ci.yml`.

### 6.3. Secrets & Variables **bắt buộc cấu hình**

| Loại     | Key                 | Dùng cho                         | Nơi set                 |
| -------- | ------------------- | -------------------------------- | ----------------------- |
| Secret   | `SONAR_TOKEN`       | SonarCloud                       | Repo Settings → Secrets |
| Secret   | `DEPLOY_HOOK`       | Webhook Render                   | Repo                    |
| Secret   | `VERCEL_TOKEN`      | Vercel CLI                       | Repo                    |
| Secret   | `VERCEL_ORG_ID`     | Vercel                           | Repo                    |
| Secret   | `VERCEL_PROJECT_ID` | Vercel                           | Repo                    |
| Variable | `STAGING_URL`       | Health check sau deploy          | Environment `staging`   |
| Variable | `VITE_API_URL`      | API base URL nhúng vào bundle FE | Repo                    |

> ⚠️ Thiếu secret nào → job tương ứng **skip gracefully** với `::notice::`. Team không bị block khi mới setup.

### 6.4. Ngưỡng chất lượng — Đối chiếu CI vs Rubric

| Metric               | Ngưỡng CI hiện tại   | Target rubric TC2.5-M4 | Hành động                              |
| -------------------- | -------------------- | ---------------------- | -------------------------------------- |
| JaCoCo LINE (BE)     | ≥ **30%**            | ≥ 50%                  | Tăng dần trong `pom.xml` khi có test   |
| Vitest coverage (FE) | **Không gate**       | ≥ 50%                  | Bật gate khi ≥ 10 test                 |
| ESLint               | 0 warning            | —                      | ✅ Đã đạt                              |
| SpotBugs             | Báo cáo (không chặn) | —                      | Cân nhắc `failOnError=true` ở Sprint 3 |
| Gitleaks             | Chặn (exit 1)        | 0 secret               | ✅ Đã đạt                              |
| Trivy                | Cảnh báo (exit 0)    | 0 CVE critical         | Cân nhắc bật exit 1 ở Sprint 4         |

### 6.5. Quy tắc CI bổ sung

- **Third-party actions pin theo SHA đầy đủ** (không dùng `@v3` vì tag có thể bị move).
- **`permissions:` cấp tối thiểu** — mặc định `contents: read`, chỉ nâng ở job cần (`packages: write`, `pull-requests: write`).
- **Cache:** backend dùng `cache: maven`, frontend dùng `cache: npm` + `cache-dependency-path`.
- **Artifact retention:** báo cáo test 14 ngày, báo cáo security 7 ngày, `dist/` 1 ngày.

### 6.6. Chiến lược đạt Mức 5 Rubric TC2.6

Rubric yêu cầu **≥ 10 lần triển khai tự động trải đều theo tiến độ**. Đề xuất:

- **Deploy staging mỗi Sprint ít nhất 3 lần** theo lịch cố định (thứ 3, 5, CN).
- Ghi mỗi lần deploy vào `AI_USAGE_LOG.md` để có minh chứng.
- Pipeline đã đủ ≥ 6 chặng → thỏa điều kiện Mức 5.

---

## 7. Deployment

### 7.1. Backend (Render) — Webhook-based, **KHÔNG** dùng `render.yaml`

- BE đóng gói thành Docker image push lên `ghcr.io/<owner>/<repo>/backend`.
- Render service pull image từ GHCR (config trong Dashboard).
- CI gọi `POST $DEPLOY_HOOK` sau khi push image → Render pull `:sha-<sha7>` mới.
- Sau webhook, CI poll `$STAGING_URL/actuator/health` tối đa **5 phút** — fail nếu không `{"status":"UP"}`.

**Env vars cần set trên Render Dashboard:**

```
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=<postgres connection string>
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=...
LLM_API_KEY=...
CORS_ALLOWED_ORIGINS=https://lingualoop.vercel.app
```

### 7.2. Frontend (Vercel) — CLI deploy, **KHÔNG** dùng Git integration

- Deploy qua `vercel deploy` từ GitHub Actions, không qua native Git integration.
- **Root Directory** = `frontend` cấu hình trên Vercel Dashboard.
- Env vars set trên Vercel Dashboard, KHÔNG dùng `vercel.json` cho secret.
- Preview URL tự comment vào PR dưới dạng `## 🚀 Preview Deployment`.

**Tại sao dùng CLI thay vì Git integration?**

- Kiểm soát được **chỉ deploy sau khi lint + test xanh** (Vercel Git integration deploy ngay khi push).
- Tránh double deploy (vừa Vercel auto, vừa GitHub Actions).

---

## 8. Checklist Review PR

### Backend

- [ ] Controller chỉ nhận/trả DTO, không chứa business logic
- [ ] Mọi BR (business rule) đọc từ config, không hardcode
- [ ] Có test cho service method mới
- [ ] Có `@Transactional` đúng chỗ
- [ ] Error code dùng constant, không string literal
- [ ] Có ghi `content_audit_log` nếu là thao tác nhạy cảm
- [ ] Không log dữ liệu nhạy cảm (token, password, audio URL có signature)
- [ ] `pom.xml` không có dependency `-SNAPSHOT`
- [ ] Endpoint mới có `@Operation` cho OpenAPI
- [ ] Không log Azure key, JWT, DB password
- [ ] `/actuator/health` vẫn hoạt động sau khi thêm config mới

### Frontend

- [ ] Component < 200 dòng, tách hook khi cần
- [ ] Xử lý đủ 4 trạng thái (loading/empty/error/success)
- [ ] Màu/space lấy từ token
- [ ] Không `any`, không `useEffect` fetch
- [ ] Có adapter cho API response mới
- [ ] Test ít nhất 1 case cho logic phức tạp
- [ ] `npm run type-check` pass local (không chỉ dựa vào CI)
- [ ] `npm run lint` pass local với **0 warning**
- [ ] `package-lock.json` được commit khi thêm/xoá dependency
- [ ] Không import vượt quá 2 cấp `../../`

### CI/CD

- [ ] Nếu thêm workflow mới → pin third-party action theo SHA
- [ ] Không commit `[skip ci]` trừ khi có lý do chính đáng (ghi trong PR description)
- [ ] Path filter đúng (sửa `backend/**` không trigger FE CI)

### Cả hai

- [ ] Commit message theo Conventional Commits
- [ ] Đã ghi vào `AI_USAGE_LOG.md` (nếu có dùng AI)
- [ ] Đã pass CI
- [ ] Không có file `.env`, secret, `node_modules`, `target/` trong diff

---

## 9. Prompt Template cho AI

### 9.1. Prompt sinh Backend feature

```
Bạn là senior Java developer trong team LinguaLoop.
Stack: Spring Boot 3.3, Java 21, PostgreSQL, MapStruct, Lombok, Spring Data JPA.

Bối cảnh: đọc skill tại docs/SKILL.md §2 SKILL BACKEND.

Nhiệm vụ: sinh code cho feature [tên feature].
Tham chiếu SRS: [dán UC liên quan].
Business rules áp dụng: [dán BR-xx liên quan].

Yêu cầu:
- Package by feature (không dùng layered package).
- Áp dụng design pattern: [Strategy | Factory | Observer...] cho [mục đích cụ thể].
- Trả DTO, dùng MapStruct, có validation.
- Có test cho service (JUnit 5 + Mockito).
- Error code dùng constant trong ErrorCodes.
- Comment tiếng Việt cho business rule phức tạp (ghi rõ BR-xx).
- Controller method có @Operation cho OpenAPI.
```

### 9.2. Prompt sinh Frontend feature

```
Bạn là senior React developer trong team LinguaLoop.
Stack: React 18 + TypeScript strict, Vite, React Router v6, TanStack Query,
Zustand, Tailwind, shadcn/ui, react-hook-form + zod.

Bối cảnh: đọc skill tại docs/SKILL.md §3 SKILL FRONTEND.

Nhiệm vụ: sinh code cho màn hình [mã màn hình - tên].
Đặc tả: [dán mục 7.x từ docs/dac-ta-chuc-nang-theo-vai-tro.md].
Design token: [dán §5 Design System].

Yêu cầu:
- Container/Presentational tách rõ.
- Custom hook cho API (React Query), Zod schema cho form.
- Xử lý đủ trạng thái: loading, empty, error, success, locked (nếu là Pro).
- Adapter chuyển snake_case → camelCase.
- i18n key cho mọi chuỗi tiếng Việt.
- Responsive: desktop 1440 + mobile 375.
- ESLint 0 warning, TypeScript strict không dùng any.
```

### 9.3. Prompt sinh test

```
Bạn là senior Java tester trong team LinguaLoop.
Stack: JUnit 5, Mockito, AssertJ, Testcontainers (PostgreSQL 16).

Feature cần test: [tên class + package]
Business rules áp dụng: [BR-xx]
Coverage target: LINE ≥ 50% cho class [XxxService]

Yêu cầu:
- Unit test cho mọi public method, dùng @Nested theo method.
- Integration test với Testcontainers cho repository/service có DB.
- Test đủ: happy path + edge case + error code (SHAD_010, SHAD_012, AUTH_001...).
- Tên test theo pattern methodName_condition_expectedResult.
- Không mock: String, List, Map, Optional, value object thuần.
- Không dùng @SpringBootTest cho unit test (chậm, không cần).
```

---

## 10. Tài liệu tham chiếu

| Loại                       | Đường dẫn                               |
| -------------------------- | --------------------------------------- |
| **Skill chung (file này)** | `docs/SKILL.md`                         |
| CI backend                 | `.github/workflows/backend-ci.yml`      |
| CI frontend                | `.github/workflows/frontend-ci.yml`     |
| SRS                        | `docs/SRS_TLCN_01.docx`                 |
| Đặc tả UI                  | `docs/dac-ta-chuc-nang-theo-vai-tro.md` |
| Rubric                     | `docs/Rubric_TLCN_KLTN_v2.pdf`          |
| AI Usage Log               | `AI_USAGE_LOG.md`                       |
| Contributing guide         | `CONTRIBUTING.md`                       |

### Bảng tra nhanh — Feature → tài liệu cần đọc

| Feature          | Đọc file   | Mục                            |
| ---------------- | ---------- | ------------------------------ |
| Auth / Email     | SRS        | UC-AUTH-01 → 08                |
| Dictation        | SRS + Spec | UC-DICT-01→04 + BR-06          |
| Shadowing        | SRS + Spec | UC-SHAD-01→04 + BR-03,04,07,12 |
| SRS / Deck       | SRS        | UC-DECK-01→06 + BR-02          |
| CEFR / Placement | SRS + Spec | UC-CEFR-01→04 + BR-01,11       |
| Weakness         | SRS + Spec | UC-WEAK-01,02                  |
| Admin            | SRS + Spec | UC-ADM-01→07                   |
| Mọi màn hình     | Spec       | §7 + §5 design system          |

---

## ✅ Cách dùng bộ skill này

1. **Onboard thành viên mới:** đọc §0 → §1 → phần stack mình làm (§2 hoặc §3).
2. **Trước khi vibe code với AI:** copy §9 template, dán §2/§3 + §5 tương ứng.
3. **Trước khi mở PR:** chạy checklist §8.
4. **Khi review PR:** đối chiếu §8 + §2.3/§3.4 rules.
5. **Khi có quyết định mới** (thêm pattern, đổi thư viện): cập nhật file này + thông báo team, không tự ý đổi.

> **Ghi chú cho đồ án (Rubric TC2.3):** mỗi lần dùng AI sinh code theo template trên, chụp lại prompt + kết quả + phần tự sửa vào `AI_USAGE_LOG.md`. Đây là minh chứng **làm chủ AI**, không phải đạo văn.

---

_Hết file SKILL.md — version 2.0_
