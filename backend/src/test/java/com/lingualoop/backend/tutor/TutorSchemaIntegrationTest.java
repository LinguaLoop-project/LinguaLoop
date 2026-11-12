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

/** Schema của Phiên gia sư: các ràng buộc giữ dữ liệu nhất quán. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class TutorSchemaIntegrationTest {

    @Autowired private JdbcTemplate jdbc;
    @Autowired private UserAccountService userAccountService;
    @Autowired private TopicRepository topics;
    @Autowired private LessonRepository lessons;
    @Autowired private SentenceRepository sentences;

    @Test
    void session_outcomeAndEndedAtMustComeTogether() {
        Fixture f = fixture();
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_sessions (user_id, attempt_id, outcome) VALUES (?, ?, 'completed')", f.user, f.attempt))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_sessions (user_id, attempt_id, outcome, ended_at) VALUES (?, ?, 'weird', now())",
                f.user, f.attempt)).isInstanceOf(DataIntegrityViolationException.class);

        jdbc.update("INSERT INTO tutor_sessions (user_id, attempt_id, started_at) VALUES (?, ?, now())",
                f.user, f.attempt);
        jdbc.update("INSERT INTO tutor_sessions (user_id, attempt_id, outcome, ended_at) VALUES (?, ?, 'connect_failed', now())",
                f.user, f.attempt);
    }

    @Test
    void words_areUniquePerSessionByPosition_andDeletedWithTheSession() {
        Fixture f = fixture();
        UUID session = jdbc.queryForObject(
                "INSERT INTO tutor_sessions (user_id, attempt_id) VALUES (?, ?) RETURNING id", UUID.class, f.user, f.attempt);
        jdbc.update("INSERT INTO tutor_session_words (session_id, position, word, score_before) VALUES (?, 0, 'Think', 40)", session);

        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_session_words (session_id, position, word, score_before) VALUES (?, 0, 'This', 40)",
                session)).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_session_words (session_id, position, word, score_before, status) VALUES (?, 2, 'a', 40, 'weird')",
                session)).isInstanceOf(DataIntegrityViolationException.class);

        jdbc.update("DELETE FROM tutor_sessions WHERE id = ?", session);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM tutor_session_words WHERE session_id = ?", Integer.class, session))
                .isZero();
    }

    @Test
    void offer_cannotBeBothAcceptedAndDeclined_andLessonEventsAcceptOnlyKnownValues() {
        Fixture f = fixture();
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO tutor_offers (user_id, lesson_id, attempt_id, accepted_at, declined_at) VALUES (?, ?, ?, now(), now())",
                f.user, f.lesson, f.attempt))
                .isInstanceOf(DataIntegrityViolationException.class);
        jdbc.update("INSERT INTO tutor_offers (user_id, lesson_id, attempt_id) VALUES (?, ?, ?)",
                f.user, f.lesson, f.attempt);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM tutor_offers WHERE user_id = ?", Integer.class, f.user))
                .isEqualTo(1);

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
        topic.setName("tutor topic " + UUID.randomUUID());
        topic = topics.save(topic);
        Lesson lesson = new Lesson();
        lesson.setTopic(topic);
        lesson.setTitle("tutor " + tag);
        lesson.setOwnerId(com.lingualoop.backend.lesson.LessonFixtures.SYSTEM_TEACHER);
        lesson.setYoutubeId(java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 11));
        lesson.setDurationSec(600);
        lesson.setCefrLevel(CefrLevel.B1);
        lesson.setPro(false);
        lesson.setStatus(LessonStatus.PUBLISHED);
        lesson = lessons.save(lesson);
        Sentence s = new Sentence();
        s.setLesson(lesson);
        s.setTextEn("Think");
        s.setStartMs(0);
        s.setEndMs(900);
        s = sentences.save(s);
        long attempt = jdbc.queryForObject("INSERT INTO sentence_attempts (user_id, sentence_id, mode, total_score) "
                + "VALUES (?, ?, 'shadowing', 70) RETURNING id", Long.class, user, s.getId());
        return new Fixture(user, lesson.getId(), attempt);
    }
}
