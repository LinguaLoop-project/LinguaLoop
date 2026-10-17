package com.lingualoop.backend.practice.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.practice.AttemptTestData;
import com.lingualoop.backend.practice.dto.ClassCountsView;

/** Số liệu điểm yếu theo nhóm từ mà dictation dùng để chọn ô Easy. */
@SpringBootTest
@Import({TestcontainersConfiguration.class, AttemptTestData.class})
class DictationStatsQueryServiceIntegrationTest {

    private static final Instant LONG_AGO = Instant.now().minus(Duration.ofDays(400));

    @Autowired private DictationStatsQueryService service;
    @Autowired private AttemptTestData data;

    @Test
    void countsByWordClass_sumsNormalAndHardOnly() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        attempt(user, sentence, "normal", false, false, Instant.now(), "function", 3, 1);
        attempt(user, sentence, "normal", false, false, Instant.now(), "content", 2, 2);
        attempt(user, sentence, "hard", false, false, Instant.now(), "function", 4, 0);
        attempt(user, sentence, "easy", false, false, Instant.now(), "function", 5, 5);

        var counts = service.countsByWordClass(user, LONG_AGO);

        assertThat(counts).containsOnlyKeys("function", "content");
        assertThat(counts.get("function")).isEqualTo(new ClassCountsView(7, 1));
        assertThat(counts.get("content")).isEqualTo(new ClassCountsView(2, 2));
    }

    @Test
    void countsByWordClass_excludesRetryGaveUpAndInsertedWords() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        attempt(user, sentence, "normal", false, false, Instant.now(), "function", 2, 1);
        attempt(user, sentence, "normal", true, false, Instant.now(), "function", 4, 4);
        attempt(user, sentence, "hard", false, true, Instant.now(), "function", 4, 4);
        long inserted = data.insertAttempt(user, sentence, "normal", false, false, Instant.now());
        data.insertWord(inserted, 0, null, "very", "inserted", null);

        assertThat(service.countsByWordClass(user, LONG_AGO)).containsOnlyKeys("function")
                .containsEntry("function", new ClassCountsView(2, 1));
    }

    @Test
    void countsByWordClass_countsRevealedAsError() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        long id = data.insertAttempt(user, sentence, "normal", false, false, Instant.now());
        data.insertWord(id, 0, "ice", null, "revealed", "content");
        data.insertWord(id, 1, "tea", "tea", "correct", "content");

        assertThat(service.countsByWordClass(user, LONG_AGO)).containsEntry("content", new ClassCountsView(2, 1));
    }

    @Test
    void countsByWordClass_respectsSince() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        Instant now = Instant.now();
        attempt(user, sentence, "normal", false, false, now.minus(Duration.ofDays(40)), "content", 5, 5);
        attempt(user, sentence, "normal", false, false, now, "content", 2, 1);

        assertThat(service.countsByWordClass(user, now.minus(Duration.ofDays(30))))
                .containsOnlyKeys("content").containsEntry("content", new ClassCountsView(2, 1));
        assertThat(service.countsByWordClass(user, now.plus(Duration.ofDays(2)))).isEmpty();
    }

    @Test
    void countsByWordClass_isolatesUsersAndReturnsEmptyMapForNewUser() {
        UUID sentence = data.newSentence(data.newLesson(), 0);
        attempt(data.newUser(), sentence, "normal", false, false, Instant.now(), "content", 3, 3);

        assertThat(service.countsByWordClass(data.newUser(), LONG_AGO)).isEmpty();
    }

    /** Chèn một lượt có {@code total} từ cùng nhóm, trong đó {@code errors} từ bị thay sai, còn lại đúng. */
    private void attempt(UUID user, UUID sentence, String level, boolean retry, boolean gaveUp, Instant at,
            String wordClass, int total, int errors) {
        long id = data.insertAttempt(user, sentence, level, retry, gaveUp, at);
        for (int position = 0; position < total; position++) {
            boolean wrong = position < errors;
            data.insertWord(id, position, "w", wrong ? "x" : "w", wrong ? "substituted" : "correct", wordClass);
        }
    }
}
