package com.lingualoop.backend.user.service;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.stats.StatsService;
import com.lingualoop.backend.stats.dto.StatsOverviewView;
import com.lingualoop.backend.user.repository.NotificationRepository;
import com.lingualoop.backend.user.repository.NotificationRepository.LocalReminderTarget;
import com.lingualoop.backend.vocab.service.VocabReviewService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Nhắc học viên buổi tối theo giờ địa phương của họ (BR-TK-23): thẻ từ vựng đến hạn ôn và chuỗi ngày học sắp đứt. Mỗi
 * loại chỉ gửi một lần mỗi ngày địa phương (khóa chống trùng), nên máy chủ ngủ rồi chạy trễ vẫn gửi đúng và chạy lặp không
 * gửi trùng. Học viên tắt loại nào thì bỏ qua loại đó ngay từ đầu để khỏi tính toán thừa.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LearningReminderService {

    /** Nhắc ôn thẻ từ 17 giờ đến hết 21 giờ địa phương. */
    static final int REVIEW_FROM_HOUR = 17;
    static final int REVIEW_TO_HOUR = 21;
    /** Nhắc chuỗi ngày từ 20 giờ đến hết 23 giờ địa phương, khi hôm nay vẫn chưa học. */
    static final int STREAK_FROM_HOUR = 20;
    static final int STREAK_TO_HOUR = 23;
    /** Chuỗi ngắn hơn mức này không đáng nhắc. */
    static final int MIN_STREAK_DAYS = 3;

    private static final String REVIEW_LINK = "/student/review/daily";
    private static final String STREAK_LINK = "/student";

    private final NotificationRepository repository;
    private final NotificationService notifications;
    private final StatsService stats;
    private final VocabReviewService vocabReview;

    /** Gửi mọi nhắc đến hạn tại thời điểm {@code now}; trả số thông báo mới gửi. */
    public int run(Instant now) {
        int sent = 0;
        for (LocalReminderTarget target : repository.studentsInLocalHours(now, REVIEW_FROM_HOUR, STREAK_TO_HOUR)) {
            try {
                sent += remind(target, now);
            } catch (RuntimeException e) {
                // Một học viên lỗi (múi giờ hỏng, dữ liệu thiếu) không được chặn các học viên còn lại.
                log.warn("Không nhắc được học viên {}: {}", target.userId(), e.getMessage());
            }
        }
        return sent;
    }

    private int remind(LocalReminderTarget target, Instant now) {
        ZoneId zone;
        try {
            zone = ZoneId.of(target.timezone());
        } catch (DateTimeException e) {
            return 0;
        }
        int hour = now.atZone(zone).getHour();
        LocalDate today = now.atZone(zone).toLocalDate();
        int sent = 0;
        if (hour >= REVIEW_FROM_HOUR && hour <= REVIEW_TO_HOUR && remindReview(target, today)) {
            sent++;
        }
        if (hour >= STREAK_FROM_HOUR && hour <= STREAK_TO_HOUR && remindStreak(target, today)) {
            sent++;
        }
        return sent;
    }

    private boolean remindReview(LocalReminderTarget target, LocalDate today) {
        String key = "review-due:" + today;
        if (skip(target, NotificationType.REVIEW_DUE, key)) {
            return false;
        }
        int due = vocabReview.dueSummary(target.userId()).dueTotal();
        if (due <= 0) {
            return false;
        }
        return notifications.send(target.userId(), NotificationType.REVIEW_DUE,
                "Bạn có " + due + " thẻ từ vựng đến hạn ôn hôm nay.", REVIEW_LINK,
                Map.of("count", Integer.toString(due)), key);
    }

    private boolean remindStreak(LocalReminderTarget target, LocalDate today) {
        String key = "streak-at-risk:" + today;
        if (skip(target, NotificationType.STREAK_AT_RISK, key)) {
            return false;
        }
        StatsOverviewView.Streak streak = stats.streak(target.userId());
        if (streak.studiedToday() || streak.current() < MIN_STREAK_DAYS) {
            return false;
        }
        return notifications.send(target.userId(), NotificationType.STREAK_AT_RISK,
                "Chuỗi " + streak.current() + " ngày học của bạn sẽ đứt nếu hôm nay bạn chưa học. "
                        + "Luyện nhanh vài phút để giữ chuỗi.", STREAK_LINK,
                Map.of("days", Integer.toString(streak.current())), key);
    }

    /** Đã nhắc trong ngày hoặc học viên đã tắt loại này thì bỏ qua. */
    private boolean skip(LocalReminderTarget target, NotificationType type, String key) {
        return !repository.isEnabled(target.userId(), type.name()) || repository.hasKey(target.userId(), key);
    }
}
