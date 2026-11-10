package com.lingualoop.backend.practice.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.practice.AttemptTestData;

/** Schema nghe chép: cột mới của sentence_attempts, outcome revealed và view v_user_dictation_stats. */
@SpringBootTest
@Import({TestcontainersConfiguration.class, AttemptTestData.class})
class DictationAttemptSchemaIntegrationTest {

    @Autowired private AttemptTestData data;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void level_rejectsValueOutsideEasyNormalHard() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        Instant now = Instant.now();

        assertThatThrownBy(() -> data.insertAttempt(user, sentence, "expert", false, false, now))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatCode(() -> {
            data.insertAttempt(user, sentence, "easy", false, false, now);
            data.insertAttempt(user, sentence, "normal", false, false, now);
            data.insertAttempt(user, sentence, "hard", false, false, now);
        }).doesNotThrowAnyException();
    }

    @Test
    void outcome_acceptsRevealedWithoutActualWord() {
        long attempt = newAttempt("easy");

        assertThatCode(() -> data.insertWord(attempt, 0, "ice", null, "revealed", "content"))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> data.insertWord(attempt, 1, "ice", "ice", "inserted", "content"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void outcome_rejectsUnknownValue() {
        long attempt = newAttempt("easy");

        assertThatThrownBy(() -> data.insertWord(attempt, 0, "ice", "ice", "wrong", "content"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void defaults_retryAndGaveUpAreFalse() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode, level, total_score) "
                + "VALUES (?, ?, 'dictation', 'easy', 0)",
                user, sentence);

        Map<String, Object> row = jdbc.queryForMap(
                "SELECT is_retry, gave_up, listen_count, client_request_id FROM sentence_attempts WHERE user_id = ?", user);

        assertThat(row.get("is_retry")).isEqualTo(false);
        assertThat(row.get("gave_up")).isEqualTo(false);
        assertThat(row.get("listen_count")).isEqualTo(0);
        assertThat(row.get("client_request_id")).isNull();
    }

    @Test
    void dictationStatsView_usesFirstCountedAttemptOfEachSentence_excludesRetryAndGaveUp_countsRevealed() {
        UUID user = data.newUser();
        UUID lesson = data.newLesson();
        UUID sentence = data.newSentence(lesson, 0);
        UUID other = data.newSentence(lesson, 1);
        Instant now = Instant.now();

        long gaveUp = data.insertAttempt(user, sentence, "hard", false, true, now.minusSeconds(30));
        data.insertWord(gaveUp, 0, "ice", null, "omitted", "content");
        long retry = data.insertAttempt(user, sentence, "normal", true, false, now.minusSeconds(20));
        data.insertWord(retry, 0, "the", null, "omitted", "function");

        long first = data.insertAttempt(user, sentence, "normal", false, false, now.minusSeconds(10));
        data.insertWord(first, 0, "the", "the", "correct", "function");
        data.insertWord(first, 1, "of", null, "revealed", "function");
        data.insertWord(first, 2, "ice", "ise", "misspelled", "content");
        data.insertWord(first, 3, null, "very", "inserted", null);

        long later = data.insertAttempt(user, sentence, "normal", false, false, now);
        data.insertWord(later, 0, "the", null, "omitted", "function");

        long otherSentence = data.insertAttempt(user, other, "easy", false, false, now);
        data.insertWord(otherSentence, 0, "ice", "ice", "correct", "content");

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT word_class, total_words, wrong_words FROM v_user_dictation_stats WHERE user_id = ?", user);

        assertThat(rows).hasSize(2);
        assertThat(row(rows, "function")).containsEntry("total_words", 2L).containsEntry("wrong_words", 1L);
        assertThat(row(rows, "content")).containsEntry("total_words", 2L).containsEntry("wrong_words", 1L);
    }

    @Test
    void sentenceAttempts_rejectsDuplicateClientRequestIdOfTheSameUserOnly() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        UUID requestId = UUID.randomUUID();
        String insert = "INSERT INTO sentence_attempts (user_id, sentence_id, mode, level, total_score, "
                + "client_request_id) VALUES (?, ?, 'dictation', 'easy', 0, ?)";

        jdbc.update(insert, user, sentence, requestId);

        assertThatThrownBy(() -> jdbc.update(insert, user, sentence, requestId))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatCode(() -> jdbc.update(insert, data.newUser(), sentence, requestId)).doesNotThrowAnyException();
    }

    private long newAttempt(String level) {
        return data.insertAttempt(data.newUser(), data.newSentence(data.newLesson(), 0), level, false, false,
                Instant.now());
    }

    private static Map<String, Object> row(List<Map<String, Object>> rows, String wordClass) {
        return rows.stream().filter(r -> wordClass.equals(r.get("word_class"))).findFirst().orElseThrow();
    }
}
