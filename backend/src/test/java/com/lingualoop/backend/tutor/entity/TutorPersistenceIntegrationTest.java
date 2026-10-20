package com.lingualoop.backend.tutor.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.Sentence;
import com.lingualoop.backend.lesson.entity.Topic;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import com.lingualoop.backend.lesson.enums.LessonStatus;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.lesson.repository.TopicRepository;
import com.lingualoop.backend.tutor.SessionOutcome;
import com.lingualoop.backend.tutor.TutorOfferPolicy;
import com.lingualoop.backend.tutor.WordStatus;
import com.lingualoop.backend.tutor.entity.TutorSession.WordSeed;
import com.lingualoop.backend.tutor.repository.TutorLessonEventRepository;
import com.lingualoop.backend.tutor.repository.TutorOfferRepository;
import com.lingualoop.backend.tutor.repository.TutorSessionRepository;
import com.lingualoop.backend.user.service.UserAccountService;

/** Phiên gia sư lưu và đọc lại đúng qua JPA (khớp schema, ddl-auto validate) và khoá dòng khi ghi. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class TutorPersistenceIntegrationTest {

    @Autowired private TutorSessionRepository sessions;
    @Autowired private TutorOfferRepository offers;
    @Autowired private TutorLessonEventRepository events;
    @Autowired private TransactionTemplate tx;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private UserAccountService userAccountService;
    @Autowired private TopicRepository topics;
    @Autowired private LessonRepository lessons;
    @Autowired private SentenceRepository sentences;

    private record Fixture(UUID user, UUID lesson, long attempt) {
    }

    @Test
    void sessionWordsAndOutcomeRoundTrip_includingTheLowercaseColumns() {
        Fixture f = fixture();
        short thetaId = jdbc.queryForObject("SELECT id FROM phonemes WHERE symbol = 'θ'", Short.class);
        UUID id = tx.execute(status -> sessions.save(TutorSession.open(f.user, f.attempt, null, "live-model",
                Instant.now(), List.of(new WordSeed("Think", "think", thetaId, 40.5), new WordSeed("sing", "sing", null, 90)))).getId());

        tx.executeWithoutResult(status -> {
            TutorSession s = sessions.findByIdAndUserId(id, f.user).orElseThrow();
            s.markStarted(Instant.now());
            s.markCharged();
            s.recordWordAttempt(85);
            s.end(SessionOutcome.COMPLETED, Instant.now());
        });

        assertThat(jdbc.queryForMap("SELECT outcome, charged, live_model, current_word_key FROM tutor_sessions WHERE id = ?", id))
                .containsEntry("outcome", "completed").containsEntry("charged", true)
                .containsEntry("live_model", "live-model").containsEntry("current_word_key", "think");
        assertThat(jdbc.queryForMap("SELECT status, attempts, total_attempts, score_before, score_after "
                + "FROM tutor_session_words WHERE session_id = ? AND word_key = 'think'", id))
                .containsEntry("status", "passed").containsEntry("attempts", 1)
                .containsEntry("score_after", new java.math.BigDecimal("85.00"));
        tx.executeWithoutResult(status -> {
            TutorSession s = sessions.findByIdAndUserId(id, f.user).orElseThrow();
            assertThat(s.getOutcome()).isEqualTo(SessionOutcome.COMPLETED);
            assertThat(s.getWords()).extracting(TutorSessionWord::getStatus).containsExactly(WordStatus.PASSED, WordStatus.PENDING);
            assertThat(s.getWords().get(0).getFocusPhonemeId()).isEqualTo(thetaId);
            assertThat(s.getWords().get(1).getFocusPhonemeId()).isNull();
        });
    }

    @Test
    void sessionsOfAnotherUserAreInvisible_AC_TUTOR_09() {
        Fixture f = fixture();
        UUID id = tx.execute(status -> sessions.save(TutorSession.open(f.user, f.attempt, null, null, Instant.now(), List.of())).getId());

        assertThat(sessions.findByIdAndUserId(id, UUID.randomUUID())).isEmpty();
        Boolean lockedForStranger = tx.execute(status -> sessions.lockByIdAndUserId(id, UUID.randomUUID()).isPresent());
        assertThat(lockedForStranger).isFalse();
    }

    @Test
    void theLockQueryReturnsTheSessionInsideATransaction() {
        Fixture f = fixture();
        UUID id = tx.execute(status -> sessions.save(TutorSession.open(f.user, f.attempt, null, null, Instant.now(), List.of())).getId());

        Boolean found = tx.execute(status -> sessions.lockByIdAndUserId(id, f.user).isPresent());

        assertThat(found).isTrue();
    }

    @Test
    void unstartedQueryFindsOnlyOpenUnstartedSessionsOlderThanTheCutoff() {
        Fixture f = fixture();
        Instant old = Instant.now().minusSeconds(120);
        UUID unstarted = tx.execute(status -> sessions.save(TutorSession.open(f.user, f.attempt, null, null, old, List.of())).getId());
        UUID started = tx.execute(status -> {
            TutorSession s = TutorSession.open(f.user, f.attempt, null, null, old, List.of());
            s.markStarted(old.plusSeconds(1));
            return sessions.save(s).getId();
        });
        UUID fresh = tx.execute(status -> sessions.save(TutorSession.open(f.user, f.attempt, null, null, Instant.now(), List.of())).getId());

        List<UUID> found = sessions.findUnstartedBefore(Instant.now().minusSeconds(15)).stream().map(TutorSession::getId).toList();

        assertThat(found).contains(unstarted).doesNotContain(started, fresh);
    }

    @Test
    void offersResolveOnceAndTheLatestOneIsFoundPerLesson() {
        Fixture f = fixture();
        Instant now = Instant.now();
        UUID first = offers.save(TutorOffer.of(f.user, f.lesson, f.attempt, TutorOfferPolicy.Reason.LOW_WORD_SCORE, now.minusSeconds(60))).getId();
        UUID second = offers.save(TutorOffer.of(f.user, f.lesson, f.attempt, TutorOfferPolicy.Reason.REPEATED_PHONEME_ERROR, now)).getId();

        assertThat(offers.findFirstByUserIdAndLessonIdOrderByCreatedAtDesc(f.user, f.lesson)).get()
                .extracting(TutorOffer::getId).isEqualTo(second);

        tx.executeWithoutResult(status -> {
            TutorOffer o = offers.findByIdAndUserId(first, f.user).orElseThrow();
            o.decline(now);
            o.accept(now.plusSeconds(1)); // đã trả lời một lần thì giữ nguyên
        });
        TutorOffer reloaded = offers.findById(first).orElseThrow();
        assertThat(reloaded.getDeclinedAt()).isNotNull();
        assertThat(reloaded.getAcceptedAt()).isNull();
        assertThat(offers.findByIdAndUserId(first, UUID.randomUUID())).isEmpty();
    }

    @Test
    void lessonEventsAreStoredAndUnknownOnesRejected() {
        Fixture f = fixture();

        events.save(TutorLessonEvent.of(f.user, f.lesson, "toggle_off", Instant.now()));

        assertThat(jdbc.queryForObject("SELECT count(*) FROM tutor_lesson_events WHERE user_id = ? AND event = 'toggle_off'",
                Integer.class, f.user)).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> TutorLessonEvent.of(f.user, f.lesson, "sideways", Instant.now()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private Fixture fixture() {
        UUID user = userAccountService.createLocal("tutor-p-" + UUID.randomUUID() + "@x.com", "Tutor", "t").id();
        String tag = UUID.randomUUID().toString().substring(0, 8);
        Topic topic = new Topic();
        topic.setSlug("tutor-pt-" + tag);
        topic.setName("tutor topic");
        topic = topics.save(topic);
        Lesson lesson = new Lesson();
        lesson.setTopic(topic);
        lesson.setSlug("tutor-p-" + tag);
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
