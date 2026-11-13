# Kế hoạch chuyển sang schema MVP (baseline mới)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (user-driven, mentor mode: người dùng viết code, Claude hướng dẫn và review). Steps use checkbox (`- [ ]`) syntax.

**Spec:** `docs/design/schema-mvp.sql` (đã chạy sạch trên Postgres 17), SRS `docs/srs/<MODULE>/`.
**Sau khi duyệt:** copy file này vào `docs/design/schema-mvp-migration-plan.md` để đi cùng spec.

## Context

Scope SRS đổi (credit thay năng lượng AI, bỏ consent / minimal pairs / placement test / daily plan, thêm BH/BT/XL/GA/NK). Schema cũ (18 migration, 35+ bảng) không còn khớp. Đã chốt với người dùng:

| Quyết định | Chốt |
|---|---|
| Cách migrate | **Baseline mới**: xoá 18 migration cũ, V1 = schema-mvp.sql, V2 = seed. Reset DB local/staging. Không chuyển dữ liệu người dùng. |
| Seed | Chỉ 44 âm vị + mẹo + video khẩu hình, cấu hình credit mặc định, 2 tài khoản dev (admin, giáo viên hệ thống). Từ điển và 9 bộ từ nạp bằng script ngoài Flyway. |
| Dump 1.712 bài / 45k câu (`backend/seed/*.sql.gz`, shape cũ) | **Chuyển đổi** sang shape mới, gán owner = giáo viên hệ thống. |
| `lessons.owner_id` | NOT NULL, giáo viên hệ thống seed sẵn. |
| Slug `lessons`/`topics` | **Bỏ**, API và frontend chuyển sang `id` (frontend là PR riêng, 22 file). |
| `sentences.ipa` | Đổi thành `ipa_us` + thêm `ipa_uk` nullable (khớp ADR 0007, giữ dữ liệu dump). |
| Chia PR | 1 nhánh backend `refactor/schema-mvp`, mỗi task 1 commit, 1 PR Lâm review. Frontend PR sau. |

Hiện trạng backend (khảo sát): 28 entity, 15 dính cột bị đổi; ~45 integration test dùng Testcontainers + Flyway và seed bằng JdbcTemplate theo cột cũ; `ddl-auto: validate` nên app không khởi động được cho đến khi mọi entity khớp. Code dùng 4 view: `v_user_plan`, `v_user_dictation_stats`, `v_user_sentence_stats`, `v_lesson_sentence_counts`. `UsageService` (năng lượng) được gọi từ `AiFeedbackServiceImpl`, `TutorSessionService`, `PronunciationHints`, `UsageController`. `ConsentService` được gọi ở 4 service và mock ở 6 test.

**Cách giữ test xanh từng bước:** Task 2 tạm đặt `spring.jpa.hibernate.ddl-auto: none` trong `src/test/resources/application-prod.yml`; Task 11 bật lại `validate`. Nhờ vậy test của feature nào xanh sau task của feature đó.

## Global Constraints

- Postgres 17, Flyway, Java 21, Spring Boot 4.1.1. Testcontainers `postgres:17-alpine`, không H2.
- Không sửa migration đã merge **trừ** việc xoá toàn bộ để làm baseline (đã chốt). Sau baseline, mọi thay đổi là migration mới theo tên `V2026MMDD_HHMM__ten_viec.sql`.
- Vai trò: `student`, `teacher`, `admin` (SRS dùng "Giáo viên"; `instructor` bỏ).
- Quyền sở hữu bảng (planning/README §3): Lâm sở hữu lessons/sentences, sentence_attempts*, phonemes, gói/credit, ai_feedback. Kế (người thực hiện) được sửa qua PR Lâm duyệt (thoả thuận 2026-10-17). Báo Lâm trước khi tạo file migration.
- Commit message một dòng, Conventional Commits, không trailer AI. Dừng cho người dùng review trước mỗi commit.
- `npx eslint` không liên quan (backend); CI backend: `./mvnw verify` (coverage ≥ 30%), SpotBugs report.

## Review Focus

1. Dump cũ có câu chồng mốc hoặc ngắn hơn 0,5 s: script chuyển đổi phải cắt/bỏ và **báo số lượng**, nếu không V1 `ex_sentence_overlap` / `chk_sentence_len` chặn nạp. (Task 1 bước 4.)
2. Trùng tiêu đề giữa 1.712 bài cùng owner (`uq_lessons_owner_title`): dedupe bằng hậu tố ` (2)`, ` (3)`; test số bài nạp = số bài trong dump. (Task 1.)
3. Ví credit Free đặt lại lúc 00:00 Asia/Ho_Chi_Minh, không phải UTC: test với `Clock` cố định 23:59 và 00:01 giờ VN. (Task 6.)
4. Nộp lượt nghe chép gửi lại cùng `client_request_id` không tạo lượt thứ hai, trả lại lượt cũ. (Task 5.)
5. Câu của bài `draft` không trả về cho học viên qua `/lessons/{id}` dù biết id. (Task 4.)

---

### Task 0: Chuẩn bị

- [ ] Báo Lâm: baseline mới, danh sách bảng của Lâm bị đổi (lessons, sentences, sentence_attempts*, phonemes, ai_feedback, user_sentence_review, sentence_notes, bỏ plan_limits/usage_counters/user_subscriptions/phoneme_confusions/user_lesson_*).
- [ ] `git checkout -b refactor/schema-mvp develop`
- [ ] Xác nhận staging không có dữ liệu cần giữ (CI job "Triển khai staging" chỉ chạy trên `main`; DB staging sẽ cần `DROP SCHEMA public CASCADE` trước deploy đầu tiên sau merge). Ghi việc này vào mô tả PR.

### Task 1: Chuyển đổi dump bài học sang schema mới (làm TRƯỚC khi xoá migration cũ)

**Files:**
- Create: `backend/seed/convert-legacy-dump.sh` (one-off, xoá sau khi commit dump mới), `backend/seed/convert-legacy-dump.sql`
- Modify: `backend/seed/01_topics_lessons.sql.gz`, `backend/seed/02_sentences.sql.gz` (ghi đè bằng shape mới), `backend/seed/seed-lessons.sh` + `.ps1` (không đổi logic, chỉ cập nhật chú thích)

**Produces:** hai file gz nạp được vào DB dựng từ V1+V2 mới bằng `seed-lessons.sh`.

- [ ] **Step 1:** `convert-legacy-dump.sh`: chạy `postgres:17` tạm (không publish port; `docker exec`), apply các migration cũ (`git show HEAD:backend/src/main/resources/db/migration/<file>` theo thứ tự Flyway), nạp 2 gz cũ.
- [ ] **Step 2:** Tạo schema `mvp` trong cùng DB: `CREATE SCHEMA mvp; SET search_path = mvp;` rồi chạy `docs/design/schema-mvp.sql` (bỏ 3 dòng `CREATE EXTENSION`).
- [ ] **Step 3:** `convert-legacy-dump.sql` – ánh xạ (chạy với `search_path = public`):
  - `mvp.users`: 2 dòng cố định (trùng Task 2 V2 seed, `ON CONFLICT DO NOTHING`): admin `00000000-0000-0000-0000-000000000001`, teacher `00000000-0000-0000-0000-000000000002`.
  - `mvp.topics(id, name, name_vi)` ← `topics` (giữ id).
  - `mvp.lessons(id, owner_id='…0002', kind='library', topic_id, title, youtube_id, duration_sec, cefr_level, is_pro, status, view_count, created_at, updated_at)` ← `lessons WHERE deleted_at IS NULL AND source_type='youtube'`:
    - `youtube_id = substring(source_url from '(?:v=|youtu\.be/|embed/)([A-Za-z0-9_-]{11})')`, bỏ bài không trích được.
    - `cefr_level = COALESCE(difficulty, 'B1')`; `duration_sec = COALESCE(duration_sec, ceil(max(end_ms)/1000.0))`.
    - `status = CASE WHEN status='APPROVED' THEN 'published' ELSE 'draft' END`.
    - Dedupe tiêu đề: `row_number() OVER (PARTITION BY lower(title) ORDER BY created_at)`; n>1 → `title || ' (' || n || ')'`, cắt 100 ký tự.
  - `mvp.sentences(id, lesson_id, text_en=text, text_vi, ipa_us, ipa_uk, start_ms, end_ms, created_at, updated_at)`:
    - Bỏ câu có `end_ms - start_ms < 500` hoặc `text` rỗng/ > 500 ký tự.
    - Chồng lấn: với mỗi bài, `end_ms = LEAST(end_ms, lead(start_ms) OVER (PARTITION BY lesson_id ORDER BY start_ms))`; sau đó bỏ lại câu < 500 ms; nếu còn trùng `start_ms` thì giữ câu có `sort_order` nhỏ hơn.
    - Bỏ câu có `end_ms > duration_sec*1000` sau khi tính duration.
  - In báo cáo: số topic/lesson/sentence nguồn và đích, số bài bỏ vì không có youtube_id, số câu bỏ theo từng lý do, số tiêu đề đổi.
- [ ] **Step 4:** Xuất: `pg_dump --data-only --column-inserts --rows-per-insert=500 --schema=mvp -t mvp.topics -t mvp.lessons` → `sed 's/mvp\.//'` → gzip ghi đè `01_topics_lessons.sql.gz`; tương tự `mvp.sentences` → `02_sentences.sql.gz`. Thêm `ON CONFLICT (id) DO NOTHING` nếu muốn chạy lại an toàn (hoặc ghi chú trong script seed là chỉ nạp một lần).
- [ ] **Step 5 (kiểm):** container mới, apply V1+V2 **mới** (từ Task 2), chạy `seed-lessons.sh` với `DATABASE_URL`, `ON_ERROR_STOP=1` không lỗi; `SELECT count(*)` ba bảng khớp báo cáo bước 3; `SELECT count(*) FROM lessons l WHERE NOT EXISTS (SELECT 1 FROM sentences s WHERE s.lesson_id=l.id)` = 0 (bài rỗng thì bỏ luôn ở bước 3).
- [ ] **Step 6:** Commit cùng Task 2 (dump mới chỉ có nghĩa với V1 mới).

### Task 2: Baseline Flyway mới + seed

**Files:**
- Modify: `docs/design/schema-mvp.sql` → (a) `sentences.ipa` thành `ipa_us` + thêm `ipa_uk text`; (b) thêm 2 view code đang dùng: `v_user_sentence_stats` (user_id, sentence_id, mode, attempt_count, best_score, last_score, last_attempt_at; theo `total_score`, `created_at`) và `v_lesson_sentence_counts` (chỉ câu `deleted_at IS NULL`); (c) chuyển 2 `INSERT` (ai_settings, ai_feature_prices) sang V2.
- Delete: 18 file trong `backend/src/main/resources/db/migration/`.
- Create: `V1__init_schema.sql` (= schema-mvp.sql sau sửa), `V2__seed_reference_data.sql`.
- Modify: `backend/src/main/resources/application-dev.yml` (bỏ `ignore-migration-patterns`, giữ `out-of-order`), `backend/src/test/resources/application-prod.yml` (thêm tạm `spring.jpa.hibernate.ddl-auto: none`, có chú thích "bỏ ở task cuối").
- Modify: `backend/seed/seed-lessons.sh` chú thích.

**V2 nội dung (sinh bằng script, không gõ tay):**
- [ ] **Step 1:** Trong container của Task 1 (schema cũ đã apply hết migration), xuất 44 âm vị:
  `SELECT p.symbol, p.kind, p.example_word, COALESCE(c.tip_vi, p.description_vi) AS tip_vi, p.mouth_video_url FROM phonemes p LEFT JOIN phoneme_confusions c ON c.target_phoneme_id=p.id AND c.produced_phoneme_id IS NULL AND c.l1='vi' ORDER BY p.id` → viết thành `INSERT INTO phonemes (symbol, kind, example_word, tip_vi, mouth_video_url) VALUES ...`. Kiểm: đúng 44 dòng, có `ɚ`, không có `ɒ`.
- [ ] **Step 2:** `INSERT INTO ai_settings (id) VALUES (1);` và 4 dòng `ai_feature_prices` (giá 0, chú thích "quản trị viên điền giá thật ở UC-GA-01").
- [ ] **Step 3:** 2 tài khoản dev: id cố định như Task 1, email `admin@lingualoop.local` / `teacher@lingualoop.local`, `display_name`, `role`, `email_verified_at=now()`, `terms_accepted_at=now()`, `onboarded_at=now()`, `password_hash` = BCrypt của `Dev12345!` (sinh một lần bằng `new BCryptPasswordEncoder().encode(...)` trong test tạm hoặc `htpasswd -bnBC 10`), kèm `ai_wallets` cho teacher `balance=1000`. Ghi chú trong file: đổi mật khẩu trên môi trường thật.
- [ ] **Step 4 (kiểm):** container sạch, `psql -v ON_ERROR_STOP=1 -f V1 -f V2` không lỗi; `SELECT count(*) FROM phonemes`=44.
- [ ] **Step 5:** `./mvnw compile` xanh (chưa chạy test). Commit: `refactor(db): baseline schema MVP, seed âm vị và tài khoản dev` (gồm Task 1 dump).

### Task 3: Role, User, Auth, bỏ Consent

**Files:**
- Modify: `security/Role.java` (INSTRUCTOR→TEACHER), `security/RoleAttributeConverter`, `user/entity/User.java`, `user/dto/UserAccountView.java`, `auth/service/AuthService.java`, `GoogleAuthService.java`, `PasswordResetService.java`, `user/repository/UserRepository.java`.
- Delete: `user/service/ConsentService.java`, `StubConsentService.java`; xoá lời gọi ở `ShadowingAttemptServiceImpl:53,69`, `AiFeedbackServiceImpl:38,57`, `TutorSessionService:49,74`, `TutorAttemptService:41,65`; xoá `@MockitoBean ConsentService` ở 6 test.
- Test: `UserRepositoryTest`, `UserAccountServiceTest`, auth `*IntegrationTest`, `LoginAttemptServiceTest`, `RefreshTokenServiceTest`.

**User entity → cột mới:** bỏ `authUid`, `disabled`, `emailVerified(boolean)`; thêm `googleSub`, `emailVerifiedAt`, `lockedAt`, `lockedReason`, `dailyMinutes`(default 15), `timezone`. `isLocked()` = `lockedAt != null`; `isEmailVerified()` = `emailVerifiedAt != null`.

- [ ] Sửa entity + Role; `GoogleAuthService`: tìm theo `googleSub`, liên kết ghi `googleSub` (AC-TK-24: email đã liên kết Google khác → từ chối).
- [ ] `AuthService`: `disabled` → `lockedAt`, thông báo "tài khoản bị khoá" (BR-TK-10); `PasswordResetService` không gửi thư cho tài khoản khoá.
- [ ] Sửa test fixtures (JdbcTemplate insert users: cột `email_verified_at`, bỏ `disabled`, role `'teacher'`).
- [ ] `./mvnw test -Dtest='com.lingualoop.backend.auth.**,com.lingualoop.backend.user.**'` xanh. Commit `refactor(auth): khớp users với schema MVP, bỏ ConsentService`.

### Task 4: Lesson, Topic, Sentence, tiến độ bài tính từ lượt làm

**Files:**
- Modify: `lesson/entity/Topic.java`, `Lesson.java`, `Sentence.java`, `LessonStatus` (DRAFT, PUBLISHED), `lesson/repository/LessonRepository.java`, `LessonSpecification.java`, `TopicRepository.java`, `SentenceRepository.java`, `lesson/service/LessonQueryServiceImpl.java`, `SentenceQueryServiceImpl.java`, controller + DTO (bỏ `slug`, `titleVi`, `description`, `sourceUrl`; thêm `youtubeId`, `thumbnailUrl` = `https://img.youtube.com/vi/{youtubeId}/hqdefault.jpg` tính trong DTO).
- Delete: `UserLessonProgress`, `UserLessonProgressId`, `UserLessonModeProgress`, `UserLessonModeProgressId`, `LessonProgressRepository`, `LessonModeProgressRepository`.
- Rewrite: `lesson/service/LessonProgressService` (giữ interface `PracticeProgressQueryService` nếu feature khác gọi): native query trên `sentence_attempts` + `sentences`:
  - tiến độ % = `count(DISTINCT sentence_id có lượt mode) / count(sentences deleted_at IS NULL)` (BR-DI-20, BR-TC-08);
  - "Tiếp tục học" = 3 bài có `max(created_at)` gần nhất (BR-TC-10);
  - hoàn thành mode = mọi câu có ≥1 lượt (BR-SH-05); `recordActivity` xoá.
- Test: `lesson/**IntegrationTest`, `DictationTestData.java`, `AttemptTestData.java`, `LessonProgressServiceIntegrationTest`, `LessonLibraryIntegrationTest` (bỏ insert `user_lesson_mode_progress`).

- [ ] Entity: `Topic(id, name, nameVi)`; `Lesson(ownerId, kind, topicId, title, youtubeId, durationSec, cefrLevel, isPro, status, unpublishReason, viewCount, deletedAt)`; `Sentence(lessonId, textEn, textVi, ipaUs, ipaUk, startMs, endMs, deletedAt)`.
- [ ] API: `/api/lessons/{id}`, `/api/topics/{id}` (UUID); `LessonSpecification` lọc `status=PUBLISHED AND kind='library' AND deletedAt IS NULL`, topic theo id; `SentenceRepository.findByLessonIdAndDeletedAtIsNullOrderByStartMsAsc`.
- [ ] Test mới trong `LessonLibraryIntegrationTest`: `draftLessonIsNotFoundForStudent` (GET `/api/lessons/{id}` của bài draft → 404) — Review Focus 5.
- [ ] `./mvnw test -Dtest='com.lingualoop.backend.lesson.**'` xanh. Commit `refactor(lesson): bỏ slug và bảng tiến độ, tiến độ tính từ sentence_attempts`.

### Task 5: Practice (lượt làm, từ, câu cần ôn, ghi chú)

**Files:**
- Modify: `practice/entity/SentenceAttempt.java` (`score`→`totalScore`, `replayCount`→`listenCount`, `attemptedAt`→`createdAt`, bỏ `provider`, `playbackRate`, `durationMs`; thêm `clientRequestId`), `SentenceAttemptWord` (`expectedWordClass`→`wordClass`, thêm `isHomophone`), `SentenceReview` (bỏ `status`, `priority`; reason `low_score|manual`; "resolve" = delete), `SentenceNote` (khoá ghép `@IdClass(user_id, sentence_id, mode)`, bỏ `id`).
- Modify: mọi native query trong `SentenceAttemptRepository`, `SentenceReviewRepository`, `SentenceNoteRepository`, `PracticeProgressRepository`, `DictationStatsRepository`: `a.score`→`a.total_score`, `a.attempted_at`→`a.created_at`, `s.text`→`s.text_en`, bỏ `l.slug` (trả `l.id`), `s.sort_order` → `row_number() OVER (PARTITION BY s.lesson_id ORDER BY s.start_ms)` nếu DTO cần số thứ tự.
- Modify: service nộp lượt nghe chép: nhận `clientRequestId` (UUID, bắt buộc với dictation), bắt `DataIntegrityViolationException` trên `uq_sa_request` → trả lượt đã có (BR-DI-21).
- Test: `DictationApiIntegrationTest`, `DictationAttemptSchemaIntegrationTest`, review/notes tests; thêm `resubmitSameClientRequestIdReturnsExistingAttempt` (Review Focus 4: POST 2 lần cùng id → 1 dòng `sentence_attempts`, cùng attempt id trả về).

- [ ] Sửa entity, repo, service, DTO (`score` giữ tên ở API nếu frontend đang dùng; chỉ đổi cột).
- [ ] `./mvnw test -Dtest='com.lingualoop.backend.practice.**,com.lingualoop.backend.dictation.**'` xanh. Commit `refactor(practice): khớp lượt làm, câu cần ôn, ghi chú với schema MVP`.

### Task 6: Credit thay năng lượng AI (feature `credit` + `subscription`)

**Files:**
- Delete: `subscription/entity/PlanLimit`, `UsageCounter`, `UserSubscription`, `UserPlanView`; `PlanLimitRepository`, `UsageCounterRepository`, `UserSubscriptionRepository`, `UserPlanRepository`; `UsageService`, `UsageServiceImpl`, `UsageController`, dto `FeatureUsage`, `UsageTicket`; `subscription/constant/AiAction` (giữ lại chỉ nếu còn tên action cho mã lỗi).
- Create `credit/`: entity `AiSettings`, `AiFeaturePrice`, `AiWallet`, `AiUsageLog`; repository tương ứng; `service/CreditService.java` (interface, contract cho feature khác), `CreditServiceImpl.java`, `AiFeature.java` (enum, giá trị DB lowercase), dto `CreditBalance(int balance, Instant resetsAt, String kind)`; `controller/CreditController` `GET /api/credits/balance`.
- Create `subscription/`: entity `ProPlan`, `ProOrder`; `ProOrderRepository.existsActive(userId)` (query trên `pro_orders` như `v_active_pro`); `SubscriptionQueryServiceImpl.isPro` dùng nó; `SubscriptionController` giữ `GET /api/subscription/plan`.
- Modify: `devtools/DevToolsService` (thay "set pro / đặt usage" bằng: tạo `pro_orders` paid N tháng; đặt `ai_wallets.balance`).
- Config: `app.usage.zone` → `app.credit.zone: Asia/Ho_Chi_Minh`; thêm `app.credit.tutor-session-cost: 3`.
- Test: `AiEnergyUsageIntegrationTest` → `CreditServiceIntegrationTest`; `DevToolsEnabledIntegrationTest`; mọi test seed `user_subscriptions` (~8 chỗ) → helper `TestData.grantPro(userId, months)` insert `pro_orders`.

**Interfaces (Produces):**
```java
public enum AiFeature { SHADOWING_FEEDBACK, LESSON_CHAT, TUTOR_SESSION, LESSON_SUGGEST; public String dbValue(); }
public interface CreditService {
    /** Làm mới ví theo gói (lazy) rồi kiểm số dư >= ai_settings.min_balance_to_start.
     *  @throws BusinessException QUOTA_EXCEEDED (detail: feature, balance, minBalance) */
    void requireCanStart(UUID userId, AiFeature feature);
    /** Trừ ceil((in*priceIn + out*priceOut)/creditValueVnd), tối thiểu 1, không âm (BR-GA-06); ghi ai_usage_logs success. Trả số credit đã trừ. */
    int charge(UUID userId, AiFeature feature, long inputUnits, long outputUnits);
    /** Trừ đúng {@code credits} (dùng cho phiên gia sư, cost cố định). */
    int chargeFixed(UUID userId, AiFeature feature, int credits);
    /** Ghi ai_usage_logs failed / rejected_no_credit, không trừ. */
    void logFailure(UUID userId, AiFeature feature, boolean rejectedNoCredit);
    CreditBalance balanceOf(UUID userId);
}
```
**Quy tắc làm mới ví** (`CreditServiceImpl.refresh(userId)`, chạy trong cùng transaction, `SELECT ... FOR UPDATE` dòng ví, tạo nếu chưa có):
- role `teacher`/`admin`: không đặt lại (`resetsAt=null`).
- Pro còn hạn (`existsActive`): nếu `resetsAt == null || resetsAt <= now` → `balance = credits_per_month` của đơn đang hiệu lực, `resetsAt` = mốc tháng kế tiếp tính từ `starts_at` của đơn (BR-GA-10).
- Free: nếu `resetsAt == null || resetsAt <= now` → `balance = ai_settings.free_daily_credits`, `resetsAt` = 00:00 ngày mai theo `app.credit.zone` (BR-GA-03).

- [ ] Test trước (`CreditServiceIntegrationTest`, `Clock` cố định):
  - `freeWalletResetsAtMidnightVietnam`: clock 2026-11-10T16:59Z (23:59 VN) ví 0 → `requireCanStart` ném QUOTA_EXCEEDED; clock 2026-11-10T17:01Z (00:01 VN) → balance = 20, không ném. (Review Focus 3)
  - `chargeRoundsUpAndMinimumOne`: giá 0 → charge = 1; giá in=25 000 000 đ/1M, in=1 000 → 25 đ / 25 = 1; in=1 100 → 2.
  - `chargeNeverGoesNegative`: balance 1, charge cost 3 → trả 1, balance 0.
  - `failureIsLoggedNotCharged`.
  - `proWalletUsesMonthlyCredits` (grantPro 1 tháng, credits_per_month 1164 → balance 1164).
- [ ] Cài đặt, `./mvnw test -Dtest='com.lingualoop.backend.credit.**,com.lingualoop.backend.subscription.**,com.lingualoop.backend.devtools.**'` xanh. Commit `feat(credit): ví credit AI thay năng lượng, gói Pro theo pro_orders`.

### Task 7: Shadowing

**Files:**
- Modify: `practice/entity/AttemptPhoneme.java` (`phonemeId`→`heardPhonemeId`, `producedPhonemeId`→`altPhonemeId`, bỏ `azureSymbol`, `producedScore`), `shadowing/entity/Phoneme.java` (+`kind`, `exampleWord`, `tipVi`), `AiFeedback.java` (`@Id attemptId`, bỏ `model`, `promptVersion`, `inputTokens`, `outputTokens`), `shadowing/azure/*` mapper ghi 3 id âm vị, `shadowing/service/PronunciationHints.java` (mẹo = `phoneme.tipVi`; video: `subscriptionQueryService.isPro(userId)` thay `usageService.usageOf(MOUTH_VIDEO)`), `AiFeedbackServiceImpl.java` (`creditService.requireCanStart` → gọi Gemini → `charge(userId, SHADOWING_FEEDBACK, inputTokens, outputTokens)`; lỗi → `logFailure`, không trừ), `ShadowingAttemptRepository` (`a.score`→`total_score`, `s.sort_order`→`start_ms`), `AttemptPhonemeRepository`.
- Delete: `shadowing/entity/PhonemeConfusion.java`, `PhonemeConfusionRepository`.
- Test: `ShadowingAttemptIntegrationTest`, `AiFeedbackIntegrationTest`, `ShadowingHintsFailureIntegrationTest`, `ShadowingReviewHistoryNotesIntegrationTest` (sửa insert `sentence_attempt_phonemes`, `ai_feedback`; kiểm `v_user_phoneme_stats` theo `target_phoneme_id`/`heard_phoneme_id`).

- [ ] Thực hiện, `./mvnw test -Dtest='com.lingualoop.backend.shadowing.**'` xanh. Commit `refactor(shadowing): mẹo trong phonemes, nhận xét AI trừ credit theo token`.

### Task 8: Tutor

**Files:**
- Delete: `tutor/entity/TutorLessonEvent.java`, `TutorLessonEventRepository`, endpoint ghi sự kiện bật/tắt (BR-AI-14 "ghi nhận sự kiện" → tạm bỏ, ghi vào mô tả PR để Lâm quyết).
- Modify: `TutorOffer` (bỏ `reason` enum khỏi entity; giữ trong DTO nếu frontend hiển thị), `TutorSession` (bỏ `liveModel`, `charged`; `currentWordKey`→`currentPosition`), `TutorSessionWord` (bỏ `wordKey`, `totalAttempts`; `getWordKey()` = `Words.normalize(word)` tính tại chỗ để `TutorAttemptService:109,165` không đổi), `TutorSessionService` (tạo phiên: `creditService.requireCanStart(TUTOR_SESSION)`; khi `started`: `chargeFixed(userId, TUTOR_SESSION, app.credit.tutor-session-cost)`; `connect_failed` không trừ — khớp BR-AI-15 mức MVP), `TutorDtos` (bỏ `charged` hoặc tính = `startedAt != null`).
- Test: `TutorSchemaIntegrationTest` (bỏ phần `plan_limits`, `tutor_lesson_events`, `word_key`), `TutorOfferAndSessionIntegrationTest`, `TutorSessionLifecycleIntegrationTest`.

- [ ] Thực hiện, `./mvnw test -Dtest='com.lingualoop.backend.tutor.**'` xanh. Commit `refactor(tutor): khớp phiên gia sư với schema MVP, trừ credit khi phiên bắt đầu`.

### Task 9: Audit log

**Files:**
- Modify: `audit/entity/ContentAuditLog.java` → `AuditLog` (`@Table audit_logs`: `actorId`, `actorName`, `actorRole`, `action`, `targetType`, `targetId`, `targetName`, `changes` jsonb, `note`), `AuditService` (interface: thêm `actorName`, `targetName`, `note`; `actorRole` nhận `"system"` khi `actorId` null), `AuditServiceIntegrationTest` (`'instructor'` → `'teacher'`).
- [ ] `./mvnw test -Dtest='com.lingualoop.backend.audit.**'` xanh. Commit `refactor(audit): bảng audit_logs chung cho nội dung, quản trị, báo cáo`.

### Task 10: Dictionary

**Files:**
- Modify: `dictionary/entity/DictionaryWord.java` (bỏ `cefrLevel`, `posPronunciations`, `source`, `createdAt/updatedAt` nếu kế thừa BaseEntity → không kế thừa nữa), `DictionaryWordRepository` (query jsonb `meanings` giữ nguyên), DTO.
- Test: `DictionaryApiIntegrationTest` (insert bỏ cột đã xoá).
- Ghi chú: script nạp từ điển tflat không nằm trong repo; thêm mục "nạp từ điển" vào `backend/seed/README` (tạo mới, ngắn) nêu cột cần có.
- [ ] `./mvnw test -Dtest='com.lingualoop.backend.dictionary.**'` xanh. Commit `refactor(dictionary): bỏ cột không dùng trong dictionary_words`.

### Task 11: Bật lại validate, toàn bộ verify, tài liệu

- [ ] Xoá `ddl-auto: none` khỏi `src/test/resources/application-prod.yml`.
- [ ] `./mvnw verify` xanh (coverage ≥ 30%); `./mvnw compile spotbugs:check` không lỗi mới.
- [ ] `./mvnw spring-boot:run` với compose: app khởi động, Flyway V1 V2 chạy, `seed-lessons.sh` nạp, đăng nhập `teacher@lingualoop.local`, `GET /api/lessons?topicId=...` trả bài.
- [ ] Docs: `planning/README.md` §3 cập nhật bảng sở hữu theo bảng mới (Kế: users, auth_*, notifications, dictionary_words, deck_categories, vocab_*, user_card_progress, vocab_sessions, vocab_review_logs, audit_logs, content_reports; Lâm: topics, lessons, sentences, lesson_likes, sentence_attempt*, user_sentence_review, sentence_notes, phonemes, ai_*, tutor_*, pro_plans, pro_orders). Thêm `docs/adr/0008-baseline-schema-mvp.md` (lý do, quyết định slug/ipa_uk/credit, hậu quả: reset staging). Cập nhật `CLAUDE.md` dòng "Never edit V1/V2" vẫn đúng với file mới; bỏ câu "Repo is at the scaffold stage".
- [ ] Commit `docs: cập nhật sở hữu bảng và ADR 0011 cho schema MVP`. Push khi người dùng bảo; mô tả PR nêu: reset DB staging, frontend PR nối tiếp.

### Task 12 (PR riêng, sau khi backend merge): Frontend

Không chi tiết ở đây, chỉ phạm vi: `'instructor'` → `'teacher'` (11 file, `routes.tsx`, `shellConfigs.ts`, `auth/types.ts`...), slug → id cho lesson/topic (22 file trong `features/lesson`, `dictation`, `shadowing`), `hooks/useAiEnergy.ts` → `GET /api/credits/balance`, bỏ UI consent nếu có, DTO bài học (`youtubeId`, `thumbnailUrl`).

## Verification (end-to-end)

1. Container sạch: `V1` + `V2` + `seed-lessons.sh` nạp không lỗi, 44 phonemes, ≥1 500 bài, 0 bài không có câu.
2. `./mvnw verify` xanh với `ddl-auto: validate`.
3. Chạy app local: đăng nhập teacher dev, mở bài theo id, nộp 1 lượt nghe chép 2 lần cùng `clientRequestId` → 1 lượt; xin nhận xét AI → `ai_usage_logs` 1 dòng success, `ai_wallets.balance` giảm ≥1.
4. `GET /api/credits/balance` của học viên Free mới → 20, `resetsAt` = 00:00 VN ngày mai.

## Ngoài phạm vi (bảng có trong V1 nhưng chưa có code)

`vocab_decks/groups/cards`, `user_card_progress`, `vocab_sessions`, `vocab_review_logs`, `content_reports`, `notifications`, `lesson_likes`, `ai_conversations*`, `pro_plans` (màn quản trị), `lessons.kind='personal'`. Chúng nằm trong V1 để không phải thêm migration ngay; feature tương ứng (HT, BT, NT, BC, XL, GA, PR, AI-01) làm ở các PR sau theo `/new-feature`.

## Điểm mở còn lại (ghi vào PR, không chặn)

- Chi phí phiên gia sư cố định 3 credit (không theo token vì âm thanh đi thẳng trình duyệt → Gemini). Về sau đổi theo phút nếu cần.
- `BR-AI-14` sự kiện bật/tắt Chế độ gia sư bị bỏ cùng `tutor_lesson_events`; thêm lại nếu Lâm cần số liệu.
- Giá `ai_feature_prices` seed = 0 → mọi lần dùng trừ 1 credit cho đến khi quản trị viên điền giá thật.
