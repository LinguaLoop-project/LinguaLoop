package com.lingualoop.backend.stats.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Thống kê một bài học của giáo viên (UC-TN-02) trong khoảng đã chọn, theo cách tính BR-TN-02. Hai danh sách câu khó
 * nhất, mỗi chế độ một danh sách, chỉ gồm câu đủ dữ liệu ở chế độ đó (BR-TN-04).
 */
public record TeacherLessonStatsView(
        Instant computedAt,
        StatsPeriod period,
        UUID lessonId,
        String title,
        String status,
        long learnersStarted,
        long learnersCompleted,
        BigDecimal completionRatePct,
        long dictationAttempts,
        long shadowingAttempts,
        BigDecimal dictationAvgScore,
        BigDecimal shadowingAvgScore,
        DailySeries daily,
        List<HardSentence> hardestDictation,
        List<HardSentence> hardestShadowing) {

    public static final String SERIES_DICTATION = "dictation";
    public static final String SERIES_SHADOWING = "shadowing";

    public TeacherLessonStatsView {
        hardestDictation = List.copyOf(hardestDictation);
        hardestShadowing = List.copyOf(hardestShadowing);
    }

    /** Một câu khó: {@code order} là thứ tự câu trong bài; số lượt và điểm trung bình tính ở một chế độ. */
    public record HardSentence(UUID id, int order, String text, long attempts, BigDecimal avgScore) {
    }
}
