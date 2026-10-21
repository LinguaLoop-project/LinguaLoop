package com.lingualoop.backend.lesson.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.user.service.UserAccountService;

/** Ghi tiến độ học của một bài khi người dùng nộp một lượt luyện (hợp đồng với dictation/shadowing). */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class LessonProgressServiceIntegrationTest {

    @Autowired private LessonProgressService service;
    @Autowired private UserAccountService userAccountService;
    @Autowired private JdbcTemplate jdbc;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    private UUID newUser() {
        return userAccountService.createLocal("prog-" + UUID.randomUUID() + "@x.com", "Prog", "h").id();
    }

    private UUID newLesson() {
        UUID topic = jdbc.queryForObject("INSERT INTO topics (slug, name) VALUES (?, ?) RETURNING id", UUID.class,
                "t-" + UUID.randomUUID(), "Topic " + tag);
        return jdbc.queryForObject("INSERT INTO lessons (topic_id, slug, title) VALUES (?, ?, ?) RETURNING id",
                UUID.class, topic, "l-" + UUID.randomUUID(), "Lesson " + tag);
    }

    private UUID newSentence(UUID lesson, int order) {
        return jdbc.queryForObject("INSERT INTO sentences (lesson_id, sort_order, text, start_ms, end_ms) "
                + "VALUES (?, ?, 'text', ?, ?) RETURNING id", UUID.class, lesson, order, order * 1000, order * 1000 + 900);
    }

    private void attempt(UUID user, UUID sentence, String mode) {
        jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode, level, attempted_at) "
                + "VALUES (?, ?, ?::practice_mode, ?, ?)", user, sentence, mode, "dictation".equals(mode) ? "normal" : null,
                Timestamp.from(Instant.now()));
    }

    private Map<String, Object> modeRow(UUID user, UUID lesson, String mode) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM user_lesson_mode_progress "
                + "WHERE user_id = ? AND lesson_id = ? AND mode = ?::practice_mode", user, lesson, mode);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private Map<String, Object> lessonRow(UUID user, UUID lesson) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?", user, lesson);
        return rows.isEmpty() ? null : rows.get(0);
    }

    @Test
    void recordActivity_firstCallStartsTheLessonAndTheMode() {
        UUID user = newUser();
        UUID lesson = newLesson();
        newSentence(lesson, 0);

        service.recordActivity(user, lesson, PracticeMode.dictation, 12);

        assertThat(lessonRow(user, lesson)).isNotNull();
        assertThat(lessonRow(user, lesson).get("completed_at")).isNull();
        assertThat(modeRow(user, lesson, "dictation")).isNotNull();
        assertThat(modeRow(user, lesson, "dictation").get("total_time_sec")).isEqualTo(12);
        assertThat(modeRow(user, lesson, "dictation").get("completed_at")).isNull();
    }

    @Test
    void recordActivity_nextCallsAddTimeAndKeepASingleRow() {
        UUID user = newUser();
        UUID lesson = newLesson();
        newSentence(lesson, 0);
        service.recordActivity(user, lesson, PracticeMode.dictation, 12);
        Object firstActivity = lessonRow(user, lesson).get("last_activity_at");

        service.recordActivity(user, lesson, PracticeMode.dictation, 30);

        assertThat(modeRow(user, lesson, "dictation").get("total_time_sec")).isEqualTo(42);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM user_lesson_progress WHERE user_id = ?",
                Integer.class, user)).isEqualTo(1);
        assertThat(((Timestamp) lessonRow(user, lesson).get("last_activity_at")).toInstant())
                .isAfterOrEqualTo(((Timestamp) firstActivity).toInstant());
    }

    @Test
    void recordActivity_marksDictationCompletedWhenEverySentenceHasAResult() {
        UUID user = newUser();
        UUID lesson = newLesson();
        UUID first = newSentence(lesson, 0);
        UUID second = newSentence(lesson, 1);
        attempt(user, first, "dictation");
        service.recordActivity(user, lesson, PracticeMode.dictation, 5);
        assertThat(modeRow(user, lesson, "dictation").get("completed_at")).isNull();

        attempt(user, second, "dictation");
        service.recordActivity(user, lesson, PracticeMode.dictation, 5);

        assertThat(modeRow(user, lesson, "dictation").get("completed_at")).isNotNull();
    }

    @Test
    void recordActivity_neverUnsetsOrMovesTheCompletionTime() {
        UUID user = newUser();
        UUID lesson = newLesson();
        UUID sentence = newSentence(lesson, 0);
        attempt(user, sentence, "dictation");
        service.recordActivity(user, lesson, PracticeMode.dictation, 5);
        Object completedAt = modeRow(user, lesson, "dictation").get("completed_at");

        newSentence(lesson, 1);
        service.recordActivity(user, lesson, PracticeMode.dictation, 5);

        assertThat(modeRow(user, lesson, "dictation").get("completed_at")).isEqualTo(completedAt);
    }

    @Test
    void recordActivity_doesNotCompleteTheLessonItself() {
        UUID user = newUser();
        UUID lesson = newLesson();
        attempt(user, newSentence(lesson, 0), "dictation");

        service.recordActivity(user, lesson, PracticeMode.dictation, 5);

        assertThat(modeRow(user, lesson, "dictation").get("completed_at")).isNotNull();
        assertThat(lessonRow(user, lesson).get("completed_at")).isNull();
    }

    @Test
    void recordActivity_keepsModesSeparateAndNeverCompletesShadowingHere() {
        UUID user = newUser();
        UUID lesson = newLesson();
        attempt(user, newSentence(lesson, 0), "dictation");

        service.recordActivity(user, lesson, PracticeMode.shadowing, 20);

        assertThat(modeRow(user, lesson, "dictation")).isNull();
        assertThat(modeRow(user, lesson, "shadowing").get("total_time_sec")).isEqualTo(20);
        assertThat(modeRow(user, lesson, "shadowing").get("completed_at")).isNull();
    }

    @Test
    void recordActivity_withZeroSecondsStillStartsTheLesson() {
        UUID user = newUser();
        UUID lesson = newLesson();
        newSentence(lesson, 0);

        service.recordActivity(user, lesson, PracticeMode.dictation, 0);

        assertThat(modeRow(user, lesson, "dictation").get("total_time_sec")).isEqualTo(0);
    }
}
