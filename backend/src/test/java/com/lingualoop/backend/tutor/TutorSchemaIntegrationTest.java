package com.lingualoop.backend.tutor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.Sentence;
import com.lingualoop.backend.lesson.entity.Topic;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import com.lingualoop.backend.lesson.enums.LessonStatus;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.lesson.repository.TopicRepository;
import com.lingualoop.backend.user.service.UserAccountService;

/** Schema của Phiên gia sư: hạn mức theo gói và các ràng buộc giữ dữ liệu nhất quán (TUTOR.md, BR-TUTOR-07). */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class TutorSchemaIntegrationTest {

    @Autowired private JdbcTemplate jdbc;
    @Autowired private UserAccountService userAccountService;
    @Autowired private TopicRepository topics;
    @Autowired private LessonRepository lessons;
    @Autowired private SentenceRepository sentences;

    @Test
    void planLimits_freeHasEightEnergyPerDay_proIsUnlimited_BR_QUOTA_01() {
        assertThat(jdbc.queryForMap("SELECT period, limit_value FROM plan_limits WHERE plan = 'free' AND feature = 'ai_energy'"))
                .containsEntry("period", "day").containsEntry("limit_value", 8);
        assertThat(jdbc.queryForMap("SELECT period, limit_value FROM plan_limits WHERE plan = 'pro' AND feature = 'ai_energy'"))
                .containsEntry("period", "day").containsEntry("limit_value", null);
        // Ba bộ đếm cũ đã gộp vào bể năng lượng; các cổng quyền lợi Pro vẫn còn
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM plan_limits WHERE feature IN ('shadowing_assess','ai_feedback','tutor_session')", Integer.class))
                .isZero();
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM plan_limits WHERE feature IN ('mouth_video','weakness_full')", Integer.class))
                .isEqualTo(4);
    }

    @Test
    void session_outcomeAndEndedAtMustComeTogether_andChargedNeedsStarted() {
        Fixture f = fixture();
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_sessions (user_id, attempt_id, outcome) VALUES (?, ?, 'completed')", f.user, f.attempt))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_sessions (user_id, attempt_id, charged) VALUES (?, ?, true)", f.user, f.attempt))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_sessions (user_id, attempt_id, outcome, ended_at) VALUES (?, ?, 'weird', now())",
                f.user, f.attempt)).isInstanceOf(DataIntegrityViolationException.class);

        jdbc.update("INSERT INTO tutor_sessions (user_id, attempt_id, started_at, charged) VALUES (?, ?, now(), true)",
                f.user, f.attempt);
        jdbc.update("INSERT INTO tutor_sessions (user_id, attempt_id, outcome, ended_at) VALUES (?, ?, 'connect_failed', now())",
                f.user, f.attempt);
    }

    @Test
    void words_areUniquePerSessionByKeyAndPosition_andDeletedWithTheSession() {
        Fixture f = fixture();
        UUID session = jdbc.queryForObject(
                "INSERT INTO tutor_sessions (user_id, attempt_id) VALUES (?, ?) RETURNING id", UUID.class, f.user, f.attempt);
        jdbc.update("INSERT INTO tutor_session_words (session_id, position, word, word_key, score_before) VALUES (?, 0, 'Think', 'think', 40)", session);

        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_session_words (session_id, position, word, word_key, score_before) VALUES (?, 1, 'think,', 'think', 40)",
                session)).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_session_words (session_id, position, word, word_key, score_before) VALUES (?, 0, 'This', 'this', 40)",
                session)).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_session_words (session_id, position, word, word_key, score_before, status) VALUES (?, 2, 'a', 'a', 40, 'weird')",
                session)).isInstanceOf(DataIntegrityViolationException.class);

        jdbc.update("DELETE FROM tutor_sessions WHERE id = ?", session);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM tutor_session_words WHERE session_id = ?", Integer.class, session))
                .isZero();
    }

    @Test
    void offer_cannotBeBothAcceptedAndDeclined_andLessonEventsAcceptOnlyKnownValues() {
        Fixture f = fixture();
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_offers (user_id, lesson_id, attempt_id, reason, accepted_at, declined_at) "
                        + "VALUES (?, ?, ?, 'LOW_WORD_SCORE', now(), now())", f.user, f.lesson, f.attempt))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_offers (user_id, lesson_id, attempt_id, reason) VALUES (?, ?, ?, 'NO_SIGNIFICANT_ERROR')",
                f.user, f.lesson, f.attempt)).isInstanceOf(DataIntegrityViolationException.class);
        jdbc.update("INSERT INTO tutor_offers (user_id, lesson_id, attempt_id, reason) VALUES (?, ?, ?, 'LOW_WORD_SCORE')",
                f.user, f.lesson, f.attempt);

        jdbc.update("INSERT INTO tutor_lesson_events (user_id, lesson_id, event) VALUES (?, ?, 'toggle_on')", f.user, f.lesson);
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_lesson_events (user_id, lesson_id, event) VALUES (?, ?, 'toggle_sideways')", f.user, f.lesson))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private record Fixture(UUID user, UUID lesson, long attempt) {
    }

    private Fixture fixture() {
        UUID user = userAccountService.createLocal("tutor-" + UUID.randomUUID() + "@x.com", "Tutor", "t").id();
        String tag = UUID.randomUUID().toString().substring(0, 8);
        Topic topic = new Topic();
        topic.setSlug("tutor-t-" + tag);
        topic.setName("tutor topic");
        topic = topics.save(topic);
        Lesson lesson = new Lesson();
        lesson.setTopic(topic);
        lesson.setSlug("tutor-" + tag);
        lesson.setTitle("tutor " + tag);
        lesson.setDifficulty(CefrLevel.B1);
        lesson.setPro(false);
        lesson.setStatus(LessonStatus.APPROVED);
        lesson = lessons.save(lesson);
        Sentence s = new Sentence();
        s.setLesson(lesson);
        s.setSortOrder(0);
        s.setText("Think");
        s.setStartMs(0);
        s.setEndMs(900);
        s.setCefrLevel(CefrLevel.A1);
        s = sentences.save(s);
        long attempt = jdbc.queryForObject("INSERT INTO sentence_attempts (user_id, sentence_id, mode, provider, score) "
                + "VALUES (?, ?, 'shadowing', 'azure', 70) RETURNING id", Long.class, user, s.getId());
        return new Fixture(user, lesson.getId(), attempt);
    }
}
