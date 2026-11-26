package com.lingualoop.backend.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.lingualoop.backend.stats.StatsService;
import com.lingualoop.backend.stats.dto.StatsOverviewView.Streak;
import com.lingualoop.backend.user.repository.NotificationRepository;
import com.lingualoop.backend.user.repository.NotificationRepository.LocalReminderTarget;
import com.lingualoop.backend.vocab.dto.ReviewView.DueSummary;
import com.lingualoop.backend.vocab.service.VocabReviewService;

/**
 * Nhắc ôn thẻ và nhắc giữ chuỗi ngày học (BR-TK-23, AC-TK-77): đúng khung giờ địa phương, chỉ khi có việc cần nhắc, một
 * lần mỗi ngày, bỏ qua học viên đã tắt loại đó, và một học viên lỗi không chặn người khác.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LearningReminderServiceTest {

    /** 11:30 UTC = 18:30 giờ Việt Nam. */
    private static final Instant EVENING_VN = Instant.parse("2026-11-26T11:30:00Z");
    /** 14:00 UTC = 21:00 giờ Việt Nam. */
    private static final Instant LATE_EVENING_VN = Instant.parse("2026-11-26T14:00:00Z");

    @Mock private NotificationRepository repository;
    @Mock private NotificationService notifications;
    @Mock private StatsService stats;
    @Mock private VocabReviewService vocabReview;

    private LearningReminderService service;
    private final UUID user = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new LearningReminderService(repository, notifications, stats, vocabReview);
        when(repository.studentsInLocalHours(any(), anyInt(), anyInt()))
                .thenReturn(List.of(new LocalReminderTarget(user, "Asia/Ho_Chi_Minh")));
        when(repository.isEnabled(any(), anyString())).thenReturn(true);
        when(repository.hasKey(any(), anyString())).thenReturn(false);
        when(notifications.send(any(), any(), anyString(), any(), anyMap(), anyString())).thenReturn(true);
        when(vocabReview.dueSummary(user)).thenReturn(new DueSummary(7, null));
        when(stats.streak(user)).thenReturn(streak(5, false));
    }

    private static Streak streak(int current, boolean studiedToday) {
        return new Streak(current, current, studiedToday, List.of(false, false, false, false, false, false, false), 3);
    }

    @Test
    void evening_remindsDueCardsOnceWithCountAndLink_butNotTheStreakBefore20h() {
        assertThat(service.run(EVENING_VN)).isEqualTo(1);

        verify(notifications).send(eq(user), eq(NotificationType.REVIEW_DUE), anyString(), eq("/student/review/daily"),
                eq(java.util.Map.of("count", "7")), eq("review-due:2026-11-26"));
        verify(notifications, never()).send(any(), eq(NotificationType.STREAK_AT_RISK), anyString(), any(), anyMap(),
                anyString());
    }

    @Test
    void after20h_alsoRemindsAStreakAtRisk_withTheStreakLength() {
        assertThat(service.run(LATE_EVENING_VN)).isEqualTo(2);

        verify(notifications).send(eq(user), eq(NotificationType.STREAK_AT_RISK), anyString(), eq("/student"),
                eq(java.util.Map.of("days", "5")), eq("streak-at-risk:2026-11-26"));
    }

    @Test
    void nothingDue_orStreakShortOrAlreadyStudiedToday_sendsNothing() {
        when(vocabReview.dueSummary(user)).thenReturn(new DueSummary(0, null));
        when(stats.streak(user)).thenReturn(streak(2, false));
        assertThat(service.run(LATE_EVENING_VN)).isZero();

        when(stats.streak(user)).thenReturn(streak(10, true));
        assertThat(service.run(LATE_EVENING_VN)).isZero();
    }

    @Test
    void alreadyRemindedToday_orTurnedOff_skipsEvenTheExpensiveChecks() {
        when(repository.hasKey(user, "review-due:2026-11-26")).thenReturn(true);
        when(repository.isEnabled(user, "STREAK_AT_RISK")).thenReturn(false);

        assertThat(service.run(LATE_EVENING_VN)).isZero();

        verify(vocabReview, never()).dueSummary(any());
        verify(stats, never()).streak(any());
    }

    @Test
    void outsideTheEveningWindowOfTheLearnersOwnZone_doesNothing() {
        // 02:00 UTC = 09:00 giờ Việt Nam
        assertThat(service.run(Instant.parse("2026-11-26T02:00:00Z"))).isZero();
        // Học viên ở New York: 11:30 UTC là 06:30 sáng ở đó
        when(repository.studentsInLocalHours(any(), anyInt(), anyInt()))
                .thenReturn(List.of(new LocalReminderTarget(user, "America/New_York")));
        assertThat(service.run(EVENING_VN)).isZero();
        // Nhưng 23:00 UTC là 18:00 ở New York
        assertThat(service.run(Instant.parse("2026-11-26T23:00:00Z"))).isEqualTo(1);
        verify(notifications).send(eq(user), eq(NotificationType.REVIEW_DUE), anyString(), anyString(), anyMap(),
                eq("review-due:2026-11-26"));
    }

    @Test
    void aBrokenLearnerDoesNotBlockTheOthers() {
        UUID broken = UUID.randomUUID();
        UUID badZone = UUID.randomUUID();
        when(repository.studentsInLocalHours(any(), anyInt(), anyInt())).thenReturn(List.of(
                new LocalReminderTarget(badZone, "Not/AZone"),
                new LocalReminderTarget(broken, "Asia/Ho_Chi_Minh"),
                new LocalReminderTarget(user, "Asia/Ho_Chi_Minh")));
        when(vocabReview.dueSummary(broken)).thenThrow(new IllegalStateException("hỏng"));

        assertThat(service.run(EVENING_VN)).isEqualTo(1);
        verify(notifications).send(eq(user), eq(NotificationType.REVIEW_DUE), anyString(), anyString(), anyMap(),
                anyString());
    }
}
