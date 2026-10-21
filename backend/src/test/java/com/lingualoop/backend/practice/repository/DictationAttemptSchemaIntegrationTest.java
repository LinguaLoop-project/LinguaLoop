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
            data.insertAttempt(user, sentence, null, false, false, now);
        }).doesNotThrowAnyException();
    }

    @Test
    void outcome_acceptsRevealedWithoutActualWord() {
        long attempt = newAttempt("easy");

        assertThatCode(() -> data.insertWord(attempt, 0, "ice", null, "revealed", "content"))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> data.insertWord(attempt, 1, "ice", null, "substituted", "content"))
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
        jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode) VALUES (?, ?, 'dictation')",
                user, sentence);

        Map<String, Object> row = jdbc.queryForMap(
                "SELECT is_retry, gave_up, playback_rate, level FROM sentence_attempts WHERE user_id = ?", user);

        assertThat(row.get("is_retry")).isEqualTo(false);
        assertThat(row.get("gave_up")).isEqualTo(false);
        assertThat(row.get("playback_rate")).isNull();
        assertThat(row.get("level")).isNull();
    }

    @Test
    void dictationStatsView_excludesRetryAndGaveUp_groupsByLevel_countsRevealed() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        Instant now = Instant.now();

        long normal = data.insertAttempt(user, sentence, "normal", false, false, now);
        data.insertWord(normal, 0, "the", "the", "correct", "function");
        data.insertWord(normal, 1, "of", null, "revealed", "function");
        data.insertWord(normal, 2, "ice", "ise", "misspelled", "content");
        data.insertWord(normal, 3, null, "very", "inserted", null);

        long retry = data.insertAttempt(user, sentence, "normal", true, false, now);
        data.insertWord(retry, 0, "the", null, "omitted", "function");

        long gaveUp = data.insertAttempt(user, sentence, "hard", false, true, now);
        data.insertWord(gaveUp, 0, "ice", null, "omitted", "content");

        long easy = data.insertAttempt(user, sentence, "easy", false, false, now);
        data.insertWord(easy, 0, "ice", "ice", "correct", "content");

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT level, word_class, opportunities, errors, misspelled, revealed "
                        + "FROM v_user_dictation_stats WHERE user_id = ?", user);

        assertThat(rows).hasSize(3);
        assertThat(row(rows, "normal", "function"))
                .containsEntry("opportunities", 2L).containsEntry("errors", 1L).containsEntry("revealed", 1L);
        assertThat(row(rows, "normal", "content"))
                .containsEntry("opportunities", 1L).containsEntry("errors", 1L).containsEntry("misspelled", 1L);
        assertThat(row(rows, "easy", "content"))
                .containsEntry("opportunities", 1L).containsEntry("errors", 0L);
        assertThat(rows).noneMatch(r -> "hard".equals(r.get("level")));
    }

    private long newAttempt(String level) {
        return data.insertAttempt(data.newUser(), data.newSentence(data.newLesson(), 0), level, false, false,
                Instant.now());
    }

    private static Map<String, Object> row(List<Map<String, Object>> rows, String level, String wordClass) {
        return rows.stream()
                .filter(r -> level.equals(r.get("level")) && wordClass.equals(r.get("word_class")))
                .findFirst().orElseThrow();
    }
}
