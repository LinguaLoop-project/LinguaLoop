package com.lingualoop.backend.practice;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.lesson.LessonFixtures;
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
    private final LessonFixtures lessonFixtures;

    public UUID newUser() {
        return userAccountService.createLocal("p-" + UUID.randomUUID() + "@x.com", "Practice", "h").id();
    }

    public UUID newLesson() {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        return lessonFixtures.publishedLesson(lessonFixtures.topic("Topic " + tag), "Lesson " + tag);
    }

    public UUID newSentence(UUID lessonId, int sortOrder) {
        return lessonFixtures.sentence(lessonId, sortOrder, "sentence " + sortOrder);
    }

    /** Chèn một lượt nghe chép (mode = dictation) và trả về id. */
    public long insertAttempt(UUID userId, UUID sentenceId, String level, boolean retry, boolean gaveUp,
            Instant attemptedAt) {
        return insertAttempt(userId, sentenceId, "dictation", level, retry, gaveUp, attemptedAt);
    }

    public long insertAttempt(UUID userId, UUID sentenceId, String mode, String level, boolean retry,
            boolean gaveUp, Instant attemptedAt) {
        Long id = jdbc.queryForObject(
                "INSERT INTO sentence_attempts (user_id, sentence_id, mode, level, is_retry, gave_up, total_score, "
                        + "created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?) RETURNING id",
                Long.class, userId, sentenceId, mode, level, retry, gaveUp, Timestamp.from(attemptedAt));
        return id == null ? 0 : id;
    }

    public void setScore(long attemptId, String score) {
        jdbc.update("UPDATE sentence_attempts SET total_score = ?::numeric WHERE id = ?", score, attemptId);
    }

    public void insertWord(long attemptId, int position, String expected, String actual, String outcome,
            String wordClass) {
        jdbc.update("INSERT INTO sentence_attempt_words "
                + "(attempt_id, position, expected_word, actual_word, outcome, word_class) "
                + "VALUES (?, ?, ?, ?, ?, ?)", attemptId, position, expected, actual, outcome, wordClass);
    }
}
