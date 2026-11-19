package com.lingualoop.backend.report;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;

import lombok.RequiredArgsConstructor;

/**
 * Dữ liệu mẫu cho test báo cáo (UC-BC-01, UC-XL-01 đến 03): người dùng, bài học có câu, bộ thẻ có thẻ, và báo cáo chèn
 * thẳng bằng SQL để đặt tùy ý thời điểm gửi và trạng thái. Mỗi test tạo giáo viên mới nên danh sách của giáo viên chỉ
 * có dữ liệu của test đó; test quản trị viên lọc thêm theo giáo viên chủ hoặc học viên.
 */
@Component
@RequiredArgsConstructor
public class ReportTestData {

    private final JdbcTemplate jdbc;
    private final JwtTokenService jwtTokenService;

    public UUID user(Role role, String displayName) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, display_name, role, email_verified_at)
                VALUES (?, ?, 'hash', ?, ?, now())""", id, "rp-" + id + "@x.com", displayName, role.value());
        return id;
    }

    public String tokenFor(UUID userId, Role role) {
        return jwtTokenService.issueAccessToken(userId, role, UUID.randomUUID()).token();
    }

    public void lock(UUID userId) {
        jdbc.update("UPDATE users SET locked_at = now(), locked_reason = 'test' WHERE id = ?", userId);
    }

    /**
     * Bài học thư viện; {@code published} = Đã xuất bản. Mỗi bài một video riêng vì một video chỉ dùng cho một bài
     * thư viện chưa xóa (BR-BH-18, chỉ mục {@code uq_lessons_library_video}).
     */
    public UUID lesson(UUID owner, String title, boolean published) {
        UUID topic = jdbc.queryForObject("INSERT INTO topics (name) VALUES (?) RETURNING id", UUID.class,
                "rp-" + UUID.randomUUID());
        String video = UUID.randomUUID().toString().replace("-", "").substring(0, 11);
        return jdbc.queryForObject("""
                INSERT INTO lessons (owner_id, kind, topic_id, title, youtube_id, duration_sec, cefr_level, status)
                VALUES (?, 'library', ?, ?, ?, 600, 'B1', ?) RETURNING id""", UUID.class,
                owner, topic, title, video, published ? "published" : "draft");
    }

    /** Câu bắt đầu ở giây {@code second} của bài, dài 2 giây. */
    public UUID sentence(UUID lesson, String textEn, String textVi, int second) {
        return jdbc.queryForObject("""
                INSERT INTO sentences (lesson_id, text_en, text_vi, ipa_us, start_ms, end_ms)
                VALUES (?, ?, ?, '/ɡæt/', ?, ?) RETURNING id""", UUID.class,
                lesson, textEn, textVi, second * 1000, second * 1000 + 2000);
    }

    /** Bộ thẻ thư viện; {@code owner} null = bộ hệ thống. */
    public UUID deck(UUID owner, String name, boolean published) {
        return jdbc.queryForObject("""
                INSERT INTO vocab_decks (owner_id, kind, name, status) VALUES (?, 'library', ?, ?) RETURNING id""",
                UUID.class, owner, name, published ? "published" : "draft");
    }

    public UUID card(UUID deck, String word, String meaningVi) {
        UUID group = jdbc.queryForObject("INSERT INTO vocab_groups (deck_id, name) VALUES (?, 'Nhóm') RETURNING id",
                UUID.class, deck);
        return jdbc.queryForObject("""
                INSERT INTO vocab_cards (deck_id, group_id, word, meaning_vi, example_en)
                VALUES (?, ?, ?, ?, 'An example.') RETURNING id""", UUID.class, deck, group, word, meaningVi);
    }

    /** Báo cáo về câu, gửi lúc {@code at}, với bản chụp giá trị hiện tại của câu. */
    public UUID sentenceReport(UUID reporter, UUID sentence, String reason, String status, Instant at) {
        return jdbc.queryForObject("""
                INSERT INTO content_reports (reporter_id, sentence_id, reason, description, status, created_at,
                                             status_changed_at, handled_at, content_snapshot)
                SELECT ?, s.id, ?, 'mô tả', ?, ?, ?, CASE WHEN ? IN ('resolved','rejected') THEN now() END,
                       jsonb_build_object('text_en', s.text_en, 'ipa_us', s.ipa_us, 'ipa_uk', s.ipa_uk,
                                          'text_vi', s.text_vi, 'start_ms', s.start_ms::text, 'end_ms', s.end_ms::text)
                FROM sentences s WHERE s.id = ? RETURNING id""", UUID.class,
                reporter, reason, status, Timestamp.from(at), Timestamp.from(at), status, sentence);
    }

    /** Báo cáo về thẻ, gửi lúc {@code at}, với bản chụp giá trị hiện tại của thẻ. */
    public UUID cardReport(UUID reporter, UUID card, String reason, String status, Instant at) {
        return jdbc.queryForObject("""
                INSERT INTO content_reports (reporter_id, card_id, reason, description, status, created_at,
                                             status_changed_at, handled_at, content_snapshot)
                SELECT ?, c.id, ?, 'mô tả', ?, ?, ?, CASE WHEN ? IN ('resolved','rejected') THEN now() END,
                       jsonb_build_object('word', c.word, 'ipa_us', c.ipa_us, 'ipa_uk', c.ipa_uk,
                                          'meaning_vi', c.meaning_vi, 'definition_en', c.definition_en,
                                          'definition_vi', c.definition_vi, 'example_en', c.example_en,
                                          'example_vi', c.example_vi)
                FROM vocab_cards c WHERE c.id = ? RETURNING id""", UUID.class,
                reporter, reason, status, Timestamp.from(at), Timestamp.from(at), status, card);
    }

    public void updateSentence(UUID sentence, String column, String value) {
        // column chỉ lấy từ hằng trong test.
        jdbc.update("UPDATE sentences SET " + column + " = ? WHERE id = ?", value, sentence);
    }

    public void deleteLesson(UUID lesson) {
        jdbc.update("UPDATE lessons SET deleted_at = now() WHERE id = ?", lesson);
    }

    public String status(UUID report) {
        return jdbc.queryForObject("SELECT status FROM content_reports WHERE id = ?", String.class, report);
    }

    public String note(UUID report) {
        return jdbc.queryForObject("SELECT handling_note FROM content_reports WHERE id = ?", String.class, report);
    }

    public int countReports(UUID reporter) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM content_reports WHERE reporter_id = ?", Integer.class,
                reporter);
        return n == null ? 0 : n;
    }

    /** Báo cáo mới nhất của học viên: trạng thái và giá trị một cột trong bản chụp. */
    public String latestStatus(UUID reporter) {
        return jdbc.queryForObject("SELECT status FROM content_reports WHERE reporter_id = ? "
                + "ORDER BY created_at DESC LIMIT 1", String.class, reporter);
    }

    public String latestSnapshot(UUID reporter, String column) {
        return jdbc.queryForObject("SELECT content_snapshot->>? FROM content_reports WHERE reporter_id = ? "
                + "ORDER BY created_at DESC LIMIT 1", String.class, column, reporter);
    }

    public String latestFixField(UUID reporter) {
        return jdbc.queryForObject("SELECT fix_field FROM content_reports WHERE reporter_id = ? "
                + "ORDER BY created_at DESC LIMIT 1", String.class, reporter);
    }

    public UUID group(UUID deck) {
        return jdbc.queryForObject("INSERT INTO vocab_groups (deck_id, name) VALUES (?, ?) RETURNING id", UUID.class,
                deck, "Nhóm " + UUID.randomUUID().toString().substring(0, 6));
    }

    public UUID cardIn(UUID group, String word) {
        return jdbc.queryForObject("""
                INSERT INTO vocab_cards (deck_id, group_id, word, meaning_vi, example_en)
                VALUES ((SELECT deck_id FROM vocab_groups WHERE id = ?), ?, ?, 'nghĩa', 'An example.') RETURNING id""",
                UUID.class, group, group, word);
    }

    public void updateCard(UUID card, String column, String value) {
        // column chỉ lấy từ hằng trong test.
        jdbc.update("UPDATE vocab_cards SET " + column + " = ? WHERE id = ?", value, card);
    }

    public void deleteSentence(UUID sentence) {
        jdbc.update("UPDATE sentences SET deleted_at = now() WHERE id = ?", sentence);
    }

    public void deleteLessonAt(UUID lesson, Instant at) {
        jdbc.update("UPDATE lessons SET deleted_at = ? WHERE id = ?", Timestamp.from(at), lesson);
    }

    public String lessonStatus(UUID lesson) {
        return jdbc.queryForObject("SELECT status FROM lessons WHERE id = ?", String.class, lesson);
    }

    public String deckStatus(UUID deck) {
        return jdbc.queryForObject("SELECT status FROM vocab_decks WHERE id = ?", String.class, deck);
    }

    public void setDeckStatus(UUID deck, String status) {
        jdbc.update("UPDATE vocab_decks SET status = ? WHERE id = ?", status, deck);
    }

    /** Nguồn gỡ (report hoặc manual) của dấu đang hiệu lực; {@code column}: lesson_id hoặc deck_id. */
    public String takedownSource(String column, UUID container) {
        return jdbc.queryForObject("SELECT source FROM content_takedowns WHERE " + column
                + " = ? AND cleared_at IS NULL", String.class, container);
    }

    /** Trạng thái của một yêu cầu xuất bản lại. */
    public String requestStatus(UUID request) {
        return jdbc.queryForObject("SELECT status FROM republish_requests WHERE id = ?", String.class, request);
    }

    /** Số dấu "Bị quản trị viên gỡ" đang hiệu lực của bài học hoặc bộ thẻ; {@code column}: lesson_id hoặc deck_id. */
    public int activeTakedowns(String column, UUID container) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM content_takedowns WHERE " + column
                + " = ? AND cleared_at IS NULL", Integer.class, container);
        return n == null ? 0 : n;
    }

    /** Số câu hoặc thẻ trong bản chụp lúc gỡ của dấu đang hiệu lực. */
    public int takedownItems(String column, UUID container) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM content_takedowns t, jsonb_object_keys(t.snapshot) k "
                + "WHERE t." + column + " = ? AND t.cleared_at IS NULL", Integer.class, container);
        return n == null ? 0 : n;
    }

    public UUID pendingRequest(String column, UUID container) {
        return jdbc.queryForObject("SELECT r.id FROM republish_requests r JOIN content_takedowns t ON t.id = r.takedown_id "
                + "WHERE t." + column + " = ? AND r.status = 'pending'", UUID.class, container);
    }

    public java.util.List<String> notifications(UUID user) {
        return jdbc.queryForList("SELECT message FROM notifications WHERE user_id = ? ORDER BY created_at", String.class,
                user);
    }

    public boolean reminded(UUID report) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT reminded_at IS NOT NULL FROM content_reports WHERE id = ?",
                Boolean.class, report));
    }

    /** Gắn bản sửa đề xuất và trường cần sửa cho một báo cáo (BR-BC-11). */
    public void setFix(UUID report, String fix, String field) {
        jdbc.update("UPDATE content_reports SET suggested_fix = ?, fix_field = ? WHERE id = ?", fix, field, report);
    }

    /** Giá trị một cột của câu hoặc thẻ; {@code table}: sentences hoặc vocab_cards, cột lấy từ hằng trong test. */
    public String field(String table, UUID id, String column) {
        return jdbc.queryForObject("SELECT " + column + " FROM " + table + " WHERE id = ?", String.class, id);
    }

    /** Số dòng nhật ký sửa nội dung của một câu hoặc thẻ; {@code type}: sentence hoặc card. */
    public int countContentUpdates(String type, UUID id) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM audit_logs WHERE target_type = ? AND target_id = ? "
                + "AND action = 'update'", Integer.class, type, id);
        return n == null ? 0 : n;
    }

    public int countAudit(UUID report, String action) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM audit_logs WHERE target_type = 'report' "
                + "AND target_id = ? AND action = ?", Integer.class, report, action);
        return n == null ? 0 : n;
    }
}
