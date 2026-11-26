package com.lingualoop.backend.stats.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Tổng quan thống kê nội dung của một giáo viên (UC-TN-01). Số lượng nội dung là số hiện tại; lượt luyện, học viên,
 * biểu đồ theo ngày và hai danh sách xếp hạng tính trong khoảng đã chọn (BR-TN-03). {@code openReports} là số dòng báo
 * cáo đang chờ giáo viên xử lý, đếm như danh sách "Báo cáo nội dung" (UC-XL-01).
 */
public record TeacherOverviewView(
        Instant computedAt,
        StatsPeriod period,
        ContentCounts content,
        Metric practiceAttempts,
        long learners,
        long openReports,
        DailySeries daily,
        List<TopLesson> topLessons,
        List<TopDeck> topDecks) {

    public static final String SERIES_DICTATION = "dictation";
    public static final String SERIES_SHADOWING = "shadowing";
    public static final String SERIES_REVIEW = "review";

    public TeacherOverviewView {
        topLessons = List.copyOf(topLessons);
        topDecks = List.copyOf(topDecks);
    }

    public TeacherOverviewView withOpenReports(long count) {
        return new TeacherOverviewView(computedAt, period, content, practiceAttempts, learners, count, daily,
                topLessons, topDecks);
    }

    /** Số bài học và bộ thẻ thư viện chưa xóa của giáo viên, theo trạng thái. */
    public record ContentCounts(long publishedLessons, long draftLessons, long publishedDecks, long draftDecks) {

        public boolean isEmpty() {
            return publishedLessons + draftLessons + publishedDecks + draftDecks == 0;
        }
    }

    /** Bài học có nhiều học viên nhất; điểm trung bình trống khi chế độ đó chưa có lượt nào. */
    public record TopLesson(UUID id, String title, long learners, long attempts, BigDecimal dictationAvgScore,
            BigDecimal shadowingAvgScore) {
    }

    /** Bộ thẻ có nhiều học viên ôn nhất. */
    public record TopDeck(UUID id, String name, long learners, long reviews, BigDecimal correctRatePct) {
    }
}
