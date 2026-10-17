package com.lingualoop.backend.practice;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

/**
 * Dữ liệu mẫu cho test của practice. Bài và câu thuộc feature lesson nên chèn bằng SQL,
 * không import entity hay repository của lesson.
 */
@Component
@RequiredArgsConstructor
public class AttemptTestData {

    private final JdbcTemplate jdbc;
    private final UserAccountService userAccountService;

    public UUID newUser() {
        return userAccountService.createLocal("p-" + UUID.randomUUID() + "@x.com", "Practice", "h").id();
    }

    public UUID newLesson() {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        UUID topic = jdbc.queryForObject(
                "INSERT INTO topics (slug, name) VALUES (?, ?) RETURNING id", UUID.class, "t-" + tag, "Topic " + tag);
        return jdbc.queryForObject(
                "INSERT INTO lessons (topic_id, slug, title) VALUES (?, ?, ?) RETURNING id",
                UUID.class, topic, "l-" + tag, "Lesson " + tag);
    }

    public UUID newSentence(UUID lessonId, int sortOrder) {
        return jdbc.queryForObject(
                "INSERT INTO sentences (lesson_id, sort_order, text, start_ms, end_ms) VALUES (?, ?, ?, ?, ?) RETURNING id",
                UUID.class, lessonId, sortOrder, "sentence " + sortOrder, sortOrder * 1000, sortOrder * 1000 + 900);
    }

    /** Chèn một lượt nghe chép ({@code mode = dictation}) và trả về id. */
    public long insertAttempt(UUID userId, UUID sentenceId, String level, boolean retry, boolean gaveUp,
            Instant attemptedAt) {
        return insertAttempt(userId, sentenceId, "dictation", level, retry, gaveUp, attemptedAt);
    }

    public long insertAttempt(UUID userId, UUID sentenceId, String mode, String level, boolean retry,
            boolean gaveUp, Instant attemptedAt) {
        Long id = jdbc.queryForObject(
                "INSERT INTO sentence_attempts (user_id, sentence_id, mode, level, is_retry, gave_up, attempted_at) "
                        + "VALUES (?, ?, ?::practice_mode, ?, ?, ?, ?) RETURNING id",
                Long.class, userId, sentenceId, mode, level, retry, gaveUp, Timestamp.from(attemptedAt));
        return id == null ? 0 : id;
    }

    public void insertWord(long attemptId, int position, String expected, String actual, String outcome,
            String wordClass) {
        jdbc.update("INSERT INTO sentence_attempt_words "
                + "(attempt_id, position, expected_word, actual_word, outcome, expected_word_class) "
                + "VALUES (?, ?, ?, ?, ?, ?)", attemptId, position, expected, actual, outcome, wordClass);
    }
}
