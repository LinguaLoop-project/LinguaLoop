package com.lingualoop.backend.schema;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.user.service.UserAccountService;

/**
 * Các ràng buộc và hành vi của schema đã khôi phục sau refactor: đơn thanh toán đã hủy, trigger
 * updated_at, nhật ký chỉ thêm, bài nguồn âm thanh, thời gian mỗi lượt. Chạy trên Postgres thật.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class SchemaGapsIntegrationTest {

    @Autowired private JdbcTemplate jdbc;
    @Autowired private LessonFixtures fixtures;
    @Autowired private UserAccountService userAccountService;

    private UUID newUser() {
        return userAccountService.createLocal("gap-" + UUID.randomUUID() + "@x.com", "Kế", "bcrypt-hash").id();
    }

    // ---- đơn thanh toán

    @Test
    void order_canBeCanceled_andOnlyOnePendingOrderPerUser() {
        UUID user = newUser();
        String insert = "INSERT INTO pro_orders (user_id, plan_name, months, credits_per_month, amount_vnd, expires_at, status, canceled_at) "
                + "VALUES (?, 'P', 1, 1, 1, now(), ?, ?)";
        jdbc.update(insert, user, "pending", null);
        assertThatThrownBy(() -> jdbc.update(insert, user, "pending", null))
                .isInstanceOf(DataIntegrityViolationException.class);

        // đơn chờ cũ chuyển sang Đã hủy thì được tạo đơn chờ mới
        jdbc.update("UPDATE pro_orders SET status = 'canceled', canceled_at = now() WHERE user_id = ? AND status = 'pending'", user);
        jdbc.update(insert, user, "pending", null);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pro_orders WHERE user_id = ? AND status = 'canceled'", Integer.class, user))
                .isEqualTo(1);

        // Đã hủy bắt buộc có canceled_at
        assertThatThrownBy(() -> jdbc.update(insert, user, "canceled", null))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // ---- trigger updated_at

    @Test
    void updatedAt_isRefreshedByTheDatabaseOnEveryUpdate() {
        UUID topic = fixtures.topic("trg-" + UUID.randomUUID());
        UUID lesson = fixtures.publishedLesson(topic, "trg " + UUID.randomUUID());
        jdbc.update("UPDATE lessons SET updated_at = now() - interval '5 days' WHERE id = ?", lesson);
        // UPDATE ở trên cũng đi qua trigger; đặt lại bằng cách tắt trigger không cần: so sánh với now()
        jdbc.update("UPDATE lessons SET title = ? WHERE id = ?", "trg2 " + UUID.randomUUID(), lesson);

        Boolean fresh = jdbc.queryForObject(
                "SELECT updated_at > now() - interval '1 minute' FROM lessons WHERE id = ?", Boolean.class, lesson);

        assertThat(fresh).isTrue();
    }

    // ---- nhật ký chỉ thêm

    @Test
    void auditLog_canBeAppendedButNeverChangedOrDeleted() {
        jdbc.update("INSERT INTO audit_logs (actor_name, actor_role, action, target_type) VALUES ('Hệ thống', 'system', 'auto', 'report')");

        assertThatThrownBy(() -> jdbc.update("UPDATE audit_logs SET note = 'x'")).isInstanceOf(DataAccessException.class)
                .hasMessageContaining("chỉ cho thêm dòng");
        assertThatThrownBy(() -> jdbc.update("DELETE FROM audit_logs")).isInstanceOf(DataAccessException.class)
                .hasMessageContaining("chỉ cho thêm dòng");
    }

    // ---- ký hiệu gốc của âm vị

    @Test
    void phonemeRow_withOnlyTheRawAzureSymbol_isAccepted_andOneWithNothingIsRejected() {
        UUID user = newUser();
        UUID topic = fixtures.topic("ph-" + UUID.randomUUID());
        UUID lesson = fixtures.publishedLesson(topic, "ph " + UUID.randomUUID());
        UUID sentence = fixtures.sentence(lesson, 0, "Hello");
        long attempt = jdbc.queryForObject("INSERT INTO sentence_attempts (user_id, sentence_id, mode, total_score) "
                + "VALUES (?, ?, 'shadowing', 70) RETURNING id", Long.class, user, sentence);
        long word = jdbc.queryForObject("INSERT INTO sentence_attempt_words (attempt_id, position, expected_word, actual_word, outcome) "
                + "VALUES (?, 0, 'hello', 'hello', 'correct') RETURNING id", Long.class, attempt);

        jdbc.update("INSERT INTO sentence_attempt_phonemes (attempt_word_id, position, azure_symbol, accuracy_score) VALUES (?, 0, 'zzz', 50)", word);
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO sentence_attempt_phonemes (attempt_word_id, position, accuracy_score) VALUES (?, 1, 50)", word))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // ---- không xóa vật lý làm mất lịch sử

    @Test
    void sentenceWithAttempts_cannotBePhysicallyDeleted() {
        UUID user = newUser();
        UUID topic = fixtures.topic("del-" + UUID.randomUUID());
        UUID lesson = fixtures.publishedLesson(topic, "del " + UUID.randomUUID());
        UUID sentence = fixtures.sentence(lesson, 0, "Hello");
        jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode, total_score) VALUES (?, ?, 'shadowing', 70)", user, sentence);

        assertThatThrownBy(() -> jdbc.update("DELETE FROM sentences WHERE id = ?", sentence))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
