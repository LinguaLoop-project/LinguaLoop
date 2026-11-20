package com.lingualoop.backend.user;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;

import lombok.RequiredArgsConstructor;

/**
 * Dữ liệu mẫu cho test quản trị tài khoản và giao lại nội dung (UC-QT-01 đến 07), chèn thẳng bằng SQL để đặt tùy ý
 * ngày tham gia, trạng thái khóa, chủ nội dung và trạng thái báo cáo. Cơ sở dữ liệu của test dùng chung nên mỗi test
 * đặt tên với một tiền tố riêng và lọc theo tiền tố đó.
 */
@Component
@RequiredArgsConstructor
public class AdminUserTestData {

    private final JdbcTemplate jdbc;
    private final JwtTokenService jwtTokenService;

    public UUID user(Role role, String displayName) {
        return user(role, displayName, Instant.now());
    }

    /** Tài khoản với ngày tham gia {@code createdAt}. */
    public UUID user(Role role, String displayName, Instant createdAt) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, display_name, role, email_verified_at, created_at)
                VALUES (?, ?, 'hash', ?, ?, now(), ?)""", id, "qt-" + id + "@x.com", displayName, role.value(),
                Timestamp.from(createdAt));
        return id;
    }

    public UUID teacher(String displayName) {
        return user(Role.TEACHER, displayName);
    }

    public UUID admin() {
        return user(Role.ADMIN, "Quản trị viên");
    }

    public String bearer(UUID userId, Role role) {
        return "Bearer " + jwtTokenService.issueAccessToken(userId, role, UUID.randomUUID()).token();
    }

    public void lock(UUID userId) {
        jdbc.update("UPDATE users SET locked_at = now(), locked_reason = 'test' WHERE id = ?", userId);
    }

    public void grantPro(UUID userId, Instant endsAt) {
        Instant start = Instant.now().minusSeconds(3600);
        jdbc.update("""
                INSERT INTO pro_orders (user_id, plan_name, months, credits_per_month, amount_vnd, status, expires_at,
                                        paid_at, starts_at, ends_at)
                VALUES (?, 'Pro 1 tháng', 1, 1000, 99000, 'paid', ?, ?, ?, ?)""", userId,
                Timestamp.from(start), Timestamp.from(start), Timestamp.from(start), Timestamp.from(endsAt));
    }

    public void setCredits(UUID userId, int balance) {
        jdbc.update("""
                INSERT INTO ai_wallets (user_id, balance, resets_at, updated_at) VALUES (?, ?, NULL, now())
                ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance, resets_at = NULL""", userId, balance);
    }

    /** Một phiên đăng nhập còn hiệu lực; trả id dòng refresh token. */
    public UUID session(UUID userId) {
        return jdbc.queryForObject("""
                INSERT INTO auth_refresh_tokens (user_id, family_id, token_hash, expires_at)
                VALUES (?, gen_random_uuid(), ?, now() + interval '30 days') RETURNING id""", UUID.class,
                userId, "hash-" + UUID.randomUUID());
    }

    public boolean sessionRevoked(UUID tokenId) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT revoked_at IS NOT NULL FROM auth_refresh_tokens WHERE id = ?", Boolean.class, tokenId));
    }

    // ---------------------------------------------------------------- nội dung

    /** Bài học; {@code kind} {@code library} hoặc {@code personal}. Mỗi bài một video riêng (uq_lessons_library_video). */
    public UUID lesson(UUID owner, String title, String kind, boolean published) {
        UUID topic = jdbc.queryForObject("INSERT INTO topics (name) VALUES (?) RETURNING id", UUID.class,
                "qt-" + UUID.randomUUID());
        String video = UUID.randomUUID().toString().replace("-", "").substring(0, 11);
        return jdbc.queryForObject("""
                INSERT INTO lessons (owner_id, kind, topic_id, title, youtube_id, duration_sec, cefr_level, status)
                VALUES (?, ?, ?, ?, ?, 600, 'B1', ?) RETURNING id""", UUID.class,
                owner, kind, topic, title, video, published ? "published" : "draft");
    }

    public UUID lesson(UUID owner, String title, boolean published) {
        return lesson(owner, title, "library", published);
    }

    /** Bộ thẻ; {@code owner} null = bộ hệ thống chưa gán chủ. */
    public UUID deck(UUID owner, String name, String kind, boolean published) {
        return jdbc.queryForObject("""
                INSERT INTO vocab_decks (owner_id, kind, name, status) VALUES (?, ?, ?, ?) RETURNING id""",
                UUID.class, owner, kind, name, published ? "published" : "draft");
    }

    public UUID deck(UUID owner, String name, boolean published) {
        return deck(owner, name, "library", published);
    }

    public void deleteLesson(UUID lesson) {
        jdbc.update("UPDATE lessons SET deleted_at = now() WHERE id = ?", lesson);
    }

    /** Báo cáo lỗi nội dung về một câu mới của bài, ở trạng thái {@code status}. */
    public UUID lessonReport(UUID lesson, String status) {
        UUID reporter = user(Role.STUDENT, "Người báo");
        // Các câu của một bài không được chồng mốc thời gian (ex_sentence_overlap): câu mới nối sau câu cuối.
        UUID sentence = jdbc.queryForObject("""
                INSERT INTO sentences (lesson_id, text_en, text_vi, ipa_us, start_ms, end_ms)
                SELECT ?, ?, 'câu', '/x/', n * 2000, n * 2000 + 2000
                FROM (SELECT count(*) AS n FROM sentences WHERE lesson_id = ?) c RETURNING id""", UUID.class, lesson,
                "Sentence " + UUID.randomUUID(), lesson);
        return jdbc.queryForObject("""
                INSERT INTO content_reports (reporter_id, sentence_id, reason, description, status)
                VALUES (?, ?, 'other', 'mô tả', ?) RETURNING id""", UUID.class, reporter, sentence, status);
    }

    /** Báo cáo lỗi nội dung về một thẻ mới của bộ, ở trạng thái {@code status}. */
    public UUID deckReport(UUID deck, String status) {
        UUID reporter = user(Role.STUDENT, "Người báo");
        UUID group = jdbc.queryForObject("INSERT INTO vocab_groups (deck_id, name) VALUES (?, ?) RETURNING id",
                UUID.class, deck, "Nhóm " + UUID.randomUUID());
        UUID card = jdbc.queryForObject("""
                INSERT INTO vocab_cards (deck_id, group_id, word, meaning_vi) VALUES (?, ?, ?, 'nghĩa') RETURNING id""",
                UUID.class, deck, group, "w" + UUID.randomUUID().toString().substring(0, 8));
        return jdbc.queryForObject("""
                INSERT INTO content_reports (reporter_id, card_id, reason, description, status)
                VALUES (?, ?, 'other', 'mô tả', ?) RETURNING id""", UUID.class, reporter, card, status);
    }

    public UUID lessonOwner(UUID lesson) {
        return jdbc.queryForObject("SELECT owner_id FROM lessons WHERE id = ?", UUID.class, lesson);
    }

    public UUID deckOwner(UUID deck) {
        return jdbc.queryForObject("SELECT owner_id FROM vocab_decks WHERE id = ?", UUID.class, deck);
    }

    public String lessonStatus(UUID lesson) {
        return jdbc.queryForObject("SELECT status FROM lessons WHERE id = ?", String.class, lesson);
    }

    public String deckStatus(UUID deck) {
        return jdbc.queryForObject("SELECT status FROM vocab_decks WHERE id = ?", String.class, deck);
    }

    public String reportStatus(UUID report) {
        return jdbc.queryForObject("SELECT status FROM content_reports WHERE id = ?", String.class, report);
    }

    // ---------------------------------------------------------------- kiểm tra

    public String role(UUID userId) {
        return jdbc.queryForObject("SELECT role FROM users WHERE id = ?", String.class, userId);
    }

    public boolean locked(UUID userId) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT locked_at IS NOT NULL FROM users WHERE id = ?",
                Boolean.class, userId));
    }

    public Instant proEndsAt(UUID userId) {
        return jdbc.queryForObject("SELECT max(ends_at) FROM pro_orders WHERE user_id = ? AND status = 'paid'",
                Timestamp.class, userId).toInstant();
    }

    public Integer walletBalance(UUID userId) {
        return jdbc.queryForObject("SELECT balance FROM ai_wallets WHERE user_id = ?", Integer.class, userId);
    }

    public boolean walletHasReset(UUID userId) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT resets_at IS NOT NULL FROM ai_wallets WHERE user_id = ?",
                Boolean.class, userId));
    }

    public int countAudit(UUID targetId, String action) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM audit_logs WHERE target_id = ? AND action = ?",
                Integer.class, targetId, action);
        return n == null ? 0 : n;
    }

    public String auditNote(UUID targetId, String action) {
        return jdbc.queryForObject("""
                SELECT note FROM audit_logs WHERE target_id = ? AND action = ? ORDER BY id DESC LIMIT 1""",
                String.class, targetId, action);
    }

    public List<String> notifications(UUID userId) {
        return jdbc.queryForList("SELECT message FROM notifications WHERE user_id = ? ORDER BY created_at", String.class,
                userId);
    }
}
