package com.lingualoop.backend.tutor.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.tutor.AttemptTarget;
import com.lingualoop.backend.tutor.SessionOutcome;
import com.lingualoop.backend.tutor.TutorThresholds;
import com.lingualoop.backend.tutor.WordStatus;
import com.lingualoop.backend.tutor.entity.TutorSession.WordSeed;

/** Chuyển trạng thái của Phiên gia sư (không cần DB): từ luyện, Lượt chấm, lạc đề, kết thúc. */
class TutorSessionTest {

    private static final Instant T0 = Instant.parse("2026-10-21T08:00:00Z");

    private static WordSeed seed(String word, double before) {
        return new WordSeed(word, word.toLowerCase(), (short) 1, before);
    }

    private static TutorSession session(WordSeed... seeds) {
        return TutorSession.open(UUID.randomUUID(), 7L, null, "model", T0, List.of(seeds));
    }

    // --- tạo và vòng đời ---

    @Test
    void openStartsOnTheFirstWordInOrder() {
        TutorSession s = session(seed("think", 40), seed("this", 30));

        assertThat(s.getWords()).extracting(TutorSessionWord::getWord).containsExactly("think", "this");
        assertThat(s.getWords()).extracting(w -> (int) w.getPosition()).containsExactly(0, 1);
        assertThat(s.currentWord()).get().extracting(TutorSessionWord::getWord).isEqualTo("think");
        assertThat(s.open()).isTrue();
    }

    @Test
    void anEmptyListIsAllowedAndHasNoCurrentWord() {
        TutorSession s = session();

        assertThat(s.currentWord()).isEmpty();
        assertThatThrownBy(() -> s.prepareAttempt(AttemptTarget.WORD)).hasMessageContaining("switch_word");
    }

    @Test
    void notStartedWithin15SecondsMeansConnectFailed_AC_TUTOR_13() {
        TutorSession s = session(seed("think", 40));

        s.expireIfNotStarted(T0.plusSeconds(14));
        assertThat(s.open()).isTrue();

        s.expireIfNotStarted(T0.plusSeconds(TutorThresholds.START_TIMEOUT_SECONDS));
        assertThat(s.getOutcome()).isEqualTo(SessionOutcome.CONNECT_FAILED);
        assertThat(s.getEndedAt()).isEqualTo(T0.plusSeconds(15)); // thời điểm hết hạn, không phải lúc quét
    }

    @Test
    void aStartedSessionNeverExpiresAndStartIsReportedOnlyOnce_AC_TUTOR_12() {
        TutorSession s = session(seed("think", 40));

        assertThat(s.markStarted(T0.plusSeconds(3))).isTrue();
        assertThat(s.markStarted(T0.plusSeconds(4))).isFalse();
        s.expireIfNotStarted(T0.plusSeconds(600));

        assertThat(s.open()).isTrue();
        assertThat(s.getStartedAt()).isEqualTo(T0.plusSeconds(3));
    }

    @Test
    void chargingNeedsAStartedSession() {
        TutorSession s = session(seed("think", 40));

        assertThatThrownBy(s::markCharged).isInstanceOf(IllegalStateException.class);
        s.markStarted(T0);
        s.markCharged();
        assertThat(s.isCharged()).isTrue();
    }

    @Test
    void aFinishedSessionRejectsEveryChange_AC_TUTOR_17() {
        TutorSession s = session(seed("think", 40));
        s.end(SessionOutcome.LEARNER_EXIT, T0);

        assertThatThrownBy(() -> s.end(SessionOutcome.COMPLETED, T0)).hasMessageContaining("đã kết thúc");
        assertThatThrownBy(() -> s.markStarted(T0)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> s.switchTo("think", () -> seed("think", 40))).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> s.logTopic(true)).isInstanceOf(IllegalStateException.class);
    }

    // --- đổi từ ---

    @Test
    void switchingToAWordNotInTheListAddsItAtTheEnd_AC_TUTOR_15() {
        TutorSession s = session(seed("think", 40));

        TutorSessionWord word = s.switchTo("sing", () -> seed("sing", 90));

        assertThat(word.getPosition()).isEqualTo((short) 1);
        assertThat(s.getCurrentWordKey()).isEqualTo("sing");
        assertThat(s.getWords()).hasSize(2);
    }

    @Test
    void switchingBackAndForthOnAnUnfinishedWordKeepsItsAttempts() {
        TutorSession s = session(seed("think", 40), seed("this", 30));
        s.recordWordAttempt(50); // think: 1 lượt, chưa đạt

        s.switchTo("this", () -> seed("this", 30));
        TutorSessionWord back = s.switchTo("think", () -> seed("think", 40));

        assertThat(back.getAttempts()).isEqualTo((short) 1); // không lách được giới hạn bằng cách đổi qua đổi lại
    }

    @Test
    void comingBackToAnExhaustedWordGivesNewAttemptsAndAPassedWordStaysPassed_AC_TUTOR_19() {
        TutorSession s = session(seed("think", 40), seed("this", 30));
        for (int i = 0; i < 3; i++) {
            s.recordWordAttempt(50);
        }
        TutorSessionWord think = s.getWords().get(0);
        assertThat(think.getStatus()).isEqualTo(WordStatus.NEEDS_PRACTICE);

        s.switchTo("think", () -> seed("think", 40));
        assertThat(think.getAttempts()).isZero();
        assertThat(think.getStatus()).isEqualTo(WordStatus.PENDING);

        s.recordWordAttempt(95);
        s.switchTo("think", () -> seed("think", 40));
        assertThat(think.getStatus()).isEqualTo(WordStatus.PASSED);
        assertThat(think.getAttempts()).isZero();
    }

    // --- Lượt chấm ---

    @Test
    void passingMarksTheWordAndPointsToTheNextPendingOne_AC_TUTOR_18() {
        TutorSession s = session(seed("think", 40), seed("this", 30));

        TutorSession.WordAttempt attempt = s.recordWordAttempt(TutorThresholds.PASS_SCORE);

        assertThat(attempt.passed()).isTrue();
        assertThat(attempt.attemptNumber()).isEqualTo(1);
        assertThat(attempt.word().getStatus()).isEqualTo(WordStatus.PASSED);
        assertThat(attempt.nextPending()).get().extracting(TutorSessionWord::getWordKey).isEqualTo("this");
    }

    @Test
    void thirdFailedAttemptExhaustsTheWordAndTheFourthIsRejected_AC_TUTOR_19() {
        TutorSession s = session(seed("think", 40));

        s.recordWordAttempt(50);
        s.recordWordAttempt(55);
        TutorSession.WordAttempt third = s.recordWordAttempt(52);

        assertThat(third.passed()).isFalse();
        assertThat(third.word().getStatus()).isEqualTo(WordStatus.NEEDS_PRACTICE);
        assertThat(third.nextPending()).isEmpty();
        assertThatThrownBy(() -> s.prepareAttempt(AttemptTarget.WORD)).hasMessageContaining("hết 3 lượt");
    }

    @Test
    void theBestScoreIsKeptAsScoreAfterAndTotalsCountEveryAttempt() {
        TutorSession s = session(seed("think", 40));

        s.recordWordAttempt(70);
        s.recordWordAttempt(60);
        TutorSessionWord word = s.getWords().get(0);

        assertThat(word.best()).isEqualTo(70.0);
        assertThat(word.getTotalAttempts()).isEqualTo((short) 2);
    }

    @Test
    void sentenceAttemptsAreCappedAndDoNotTouchWordResults_AC_TUTOR_20() {
        TutorSession s = session(seed("think", 40));

        assertThat(s.recordSentenceAttempt()).isEqualTo(1);
        assertThat(s.recordSentenceAttempt()).isEqualTo(2);
        assertThat(s.recordSentenceAttempt()).isEqualTo(3);

        assertThatThrownBy(() -> s.prepareAttempt(AttemptTarget.SENTENCE)).hasMessageContaining("cả câu");
        assertThat(s.getWords().get(0).getAttempts()).isZero();
    }

    // --- lạc đề ---

    @Test
    void offTopicStreakCountsInARowAndAnOnTopicTurnResetsIt_AC_TUTOR_25() {
        TutorSession s = session(seed("think", 40));

        assertThat(s.logTopic(false)).isEqualTo(1);
        assertThat(s.logTopic(false)).isEqualTo(2);
        assertThat(s.logTopic(true)).isZero();
        assertThat(s.logTopic(false)).isEqualTo(1);
    }
}
