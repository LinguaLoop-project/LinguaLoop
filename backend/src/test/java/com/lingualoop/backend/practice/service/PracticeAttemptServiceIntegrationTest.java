package com.lingualoop.backend.practice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.Duration;
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
import com.lingualoop.backend.practice.dto.request.AttemptWordRequest;
import com.lingualoop.backend.practice.dto.request.DictationAttemptRequest;
import com.lingualoop.backend.practice.enums.AttemptOutcome;
import com.lingualoop.backend.practice.enums.AttemptWordClass;
import com.lingualoop.backend.practice.enums.DictationLevel;
import com.lingualoop.backend.practice.dto.DictationAttemptView;

/** Hợp đồng ghi/đọc lượt nghe chép mà dictation dùng. */
@SpringBootTest
@Import({TestcontainersConfiguration.class, AttemptTestData.class})
class PracticeAttemptServiceIntegrationTest {

    @Autowired private PracticeAttemptService service;
    @Autowired private AttemptTestData data;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void recordDictationAttempt_storesAttemptAndWords() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        List<AttemptWordRequest> words = List.of(
                new AttemptWordRequest(0, "the", "the", AttemptOutcome.correct, AttemptWordClass.function),
                new AttemptWordRequest(2, "ice", "eyes", AttemptOutcome.substituted, AttemptWordClass.content),
                new AttemptWordRequest(4, "tea", null, AttemptOutcome.revealed, AttemptWordClass.content));

        long id = service.recordDictationAttempt(new DictationAttemptRequest(user, sentence, DictationLevel.easy,
                new BigDecimal("0.75"), 2, 4200, false, false, null, new BigDecimal("66.67"), words));

        assertThat(id).isPositive();
        Map<String, Object> row = jdbc.queryForMap("SELECT * FROM sentence_attempts WHERE id = ?", id);
        assertThat(row.get("user_id")).isEqualTo(user);
        assertThat(row.get("sentence_id")).isEqualTo(sentence);
        assertThat(row.get("mode")).hasToString("dictation");
        assertThat(row.get("level")).isEqualTo("easy");
        assertThat((BigDecimal) row.get("playback_rate")).isEqualByComparingTo("0.75");
        assertThat(row.get("replay_count")).isEqualTo(2);
        assertThat(row.get("duration_ms")).isEqualTo(4200);
        assertThat((BigDecimal) row.get("score")).isEqualByComparingTo("66.67");
        assertThat(row.get("is_retry")).isEqualTo(false);
        assertThat(row.get("gave_up")).isEqualTo(false);
        assertThat(row.get("attempted_at")).isNotNull();
        List<Map<String, Object>> stored = jdbc.queryForList(
                "SELECT position, expected_word, actual_word, outcome, expected_word_class "
                        + "FROM sentence_attempt_words WHERE attempt_id = ? ORDER BY position", id);
        assertThat(stored).hasSize(3);
        assertThat(stored.get(0)).containsEntry("position", 0).containsEntry("expected_word", "the")
                .containsEntry("actual_word", "the").containsEntry("outcome", "correct")
                .containsEntry("expected_word_class", "function");
        assertThat(stored.get(1)).containsEntry("position", 2).containsEntry("actual_word", "eyes")
                .containsEntry("outcome", "substituted");
        assertThat(stored.get(2)).containsEntry("position", 4).containsEntry("actual_word", null)
                .containsEntry("outcome", "revealed");
    }

    @Test
    void recordDictationAttempt_persistsRetryAndGaveUpFlags() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);

        long id = service.recordDictationAttempt(record(user, sentence, DictationLevel.hard, true, true, BigDecimal.ZERO,
                List.of(new AttemptWordRequest(0, "the", null, AttemptOutcome.omitted, AttemptWordClass.function))));

        Map<String, Object> row = jdbc.queryForMap(
                "SELECT is_retry, gave_up, level FROM sentence_attempts WHERE id = ?", id);
        assertThat(row.get("is_retry")).isEqualTo(true);
        assertThat(row.get("gave_up")).isEqualTo(true);
        assertThat(row.get("level")).isEqualTo("hard");
    }

    @Test
    void recordDictationAttempt_withNoWords_storesAttemptOnly() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);

        long id = service.recordDictationAttempt(record(user, sentence, DictationLevel.normal, false, true, BigDecimal.ZERO,
                List.of()));

        assertThat(count("SELECT count(*) FROM sentence_attempts WHERE id = ?", id)).isEqualTo(1);
        assertThat(count("SELECT count(*) FROM sentence_attempt_words WHERE attempt_id = ?", id)).isZero();
    }

    @Test
    void recordDictationAttempt_withInsertedWord_storesNullExpectedAndClass() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);

        long id = service.recordDictationAttempt(record(user, sentence, DictationLevel.normal, false, false,
                new BigDecimal("50"), List.of(new AttemptWordRequest(3, null, "very", AttemptOutcome.inserted, null))));

        Map<String, Object> word = jdbc.queryForMap(
                "SELECT expected_word, actual_word, expected_word_class FROM sentence_attempt_words "
                        + "WHERE attempt_id = ?", id);
        assertThat(word.get("expected_word")).isNull();
        assertThat(word.get("actual_word")).isEqualTo("very");
        assertThat(word.get("expected_word_class")).isNull();
    }

    @Test
    void recordDictationAttempt_rejectsInsertedWordWithExpectedWordOrClass() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);

        assertThatThrownBy(() -> service.recordDictationAttempt(record(user, sentence, DictationLevel.normal, false, false,
                BigDecimal.TEN, List.of(new AttemptWordRequest(1, null, "very", AttemptOutcome.inserted, AttemptWordClass.function)))))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("1");
        assertThatThrownBy(() -> service.recordDictationAttempt(record(user, sentence, DictationLevel.normal, false, false,
                BigDecimal.TEN, List.of(new AttemptWordRequest(1, "the", "very", AttemptOutcome.inserted, null)))))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(count("SELECT count(*) FROM sentence_attempts WHERE user_id = ?", user)).isZero();
    }

    @Test
    void recordDictationAttempt_rejectsNonInsertedWordWithoutExpectedWord() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);

        assertThatThrownBy(() -> service.recordDictationAttempt(record(user, sentence, DictationLevel.normal, false, false,
                BigDecimal.TEN, List.of(new AttemptWordRequest(0, null, "x", AttemptOutcome.substituted, AttemptWordClass.content)))))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(count("SELECT count(*) FROM sentence_attempts WHERE user_id = ?", user)).isZero();
    }

    @Test
    void recordDictationAttempt_withDuplicatePosition_rollsBackWholeAttempt() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);

        assertThatThrownBy(() -> service.recordDictationAttempt(record(user, sentence, DictationLevel.normal, false, false,
                BigDecimal.TEN, List.of(
                        new AttemptWordRequest(1, "the", "the", AttemptOutcome.correct, AttemptWordClass.function),
                        new AttemptWordRequest(1, "ice", "ice", AttemptOutcome.correct, AttemptWordClass.content)))))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThat(count("SELECT count(*) FROM sentence_attempts WHERE user_id = ?", user)).isZero();
    }

    @Test
    void findLatestDictationAttempts_returnsNewestAttemptPerSentenceOrderedBySortOrder() {
        UUID user = data.newUser();
        UUID lesson = data.newLesson();
        UUID first = data.newSentence(lesson, 0);
        UUID second = data.newSentence(lesson, 1);
        Instant now = Instant.now();
        data.insertAttempt(user, first, "normal", false, false, now.minus(Duration.ofDays(2)));
        long newest = data.insertAttempt(user, first, "hard", false, false, now.minus(Duration.ofDays(1)));
        jdbc.update("UPDATE sentence_attempts SET score = 90 WHERE id = ?", newest);
        long other = data.insertAttempt(user, second, "easy", false, false, now.minus(Duration.ofDays(3)));

        List<DictationAttemptView> latest = service.findLatestDictationAttempts(user, lesson);

        assertThat(latest).extracting(DictationAttemptView::sentenceId).containsExactly(first, second);
        assertThat(latest.get(0).attemptId()).isEqualTo(newest);
        assertThat(latest.get(0).level()).isEqualTo(DictationLevel.hard);
        assertThat(latest.get(0).score()).isEqualByComparingTo("90");
        assertThat(latest.get(0).attemptedAt()).isNotNull();
        assertThat(latest.get(1).attemptId()).isEqualTo(other);
    }

    @Test
    void findLatestDictationAttempts_ignoresOtherUsersOtherLessonsAndShadowing() {
        UUID user = data.newUser();
        UUID lesson = data.newLesson();
        UUID sentence = data.newSentence(lesson, 0);
        UUID elsewhere = data.newSentence(data.newLesson(), 0);
        Instant now = Instant.now();
        long mine = data.insertAttempt(user, sentence, "normal", false, false, now.minus(Duration.ofDays(1)));
        data.insertAttempt(user, sentence, "shadowing", null, false, false, now);
        data.insertAttempt(data.newUser(), sentence, "normal", false, false, now);
        data.insertAttempt(user, elsewhere, "normal", false, false, now);

        assertThat(service.findLatestDictationAttempts(user, lesson))
                .extracting(DictationAttemptView::attemptId).containsExactly(mine);
        assertThat(service.findLatestDictationAttempts(user, data.newLesson())).isEmpty();
    }

    @Test
    void findLatestDictationAttempts_exposesRetryAndGaveUpFlags() {
        UUID user = data.newUser();
        UUID lesson = data.newLesson();
        UUID sentence = data.newSentence(lesson, 0);
        data.insertAttempt(user, sentence, "normal", true, true, Instant.now());

        DictationAttemptView summary = service.findLatestDictationAttempts(user, lesson).get(0);

        assertThat(summary.retry()).isTrue();
        assertThat(summary.gaveUp()).isTrue();
    }

    @Test
    void findRecentBlankPositions_returnsNewestFirstAndRespectsLimit() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        Instant now = Instant.now();
        easyAttempt(user, sentence, now.minus(Duration.ofDays(3)), 3, 1);
        easyAttempt(user, sentence, now.minus(Duration.ofDays(2)), 0, 2);
        easyAttempt(user, sentence, now.minus(Duration.ofDays(1)), 4, 1);

        assertThat(service.findRecentBlankPositions(user, sentence, 2))
                .containsExactly(List.of(1, 4), List.of(0, 2));
        assertThat(service.findRecentBlankPositions(user, sentence, 10)).hasSize(3);
    }

    @Test
    void findRecentBlankPositions_onlyEasyAttemptsOfThatUserAndSentence() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        UUID otherSentence = data.newSentence(data.newLesson(), 0);
        Instant now = Instant.now();
        easyAttempt(user, sentence, now.minus(Duration.ofDays(1)), 2);
        long normal = data.insertAttempt(user, sentence, "normal", false, false, now);
        data.insertWord(normal, 5, "ice", "ice", "correct", "content");
        long shadowing = data.insertAttempt(user, sentence, "shadowing", "easy", false, false, now);
        data.insertWord(shadowing, 6, "ice", "ice", "correct", "content");
        easyAttempt(data.newUser(), sentence, now, 7);
        easyAttempt(user, otherSentence, now, 8);

        assertThat(service.findRecentBlankPositions(user, sentence, 10)).containsExactly(List.of(2));
        assertThat(service.findRecentBlankPositions(user, sentence, 0)).isEmpty();
        assertThat(service.findRecentBlankPositions(user, sentence, -1)).isEmpty();
    }

    private void easyAttempt(UUID user, UUID sentence, Instant at, int... positions) {
        long id = data.insertAttempt(user, sentence, "easy", false, false, at);
        for (int p : positions) {
            data.insertWord(id, p, "ice", "ice", "correct", "content");
        }
    }

    private static DictationAttemptRequest record(UUID user, UUID sentence, DictationLevel level, boolean retry,
            boolean gaveUp, BigDecimal score, List<AttemptWordRequest> words) {
        return new DictationAttemptRequest(user, sentence, level, new BigDecimal("1.00"), 0, 1000, retry, gaveUp,
                level == DictationLevel.easy ? null : "typed", score, words);
    }

    private int count(String sql, Object arg) {
        Integer n = jdbc.queryForObject(sql, Integer.class, arg);
        return n == null ? 0 : n;
    }
}
