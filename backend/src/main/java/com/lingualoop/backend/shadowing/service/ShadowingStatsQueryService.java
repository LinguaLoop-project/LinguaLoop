package com.lingualoop.backend.shadowing.service;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.lingualoop.backend.shadowing.dto.PhonemeDetailView;
import com.lingualoop.backend.shadowing.dto.PhonemeStatView;
import com.lingualoop.backend.shadowing.dto.ScorePointView;

/**
 * Số liệu phát âm Shadowing của một học viên cho feature {@code stats} (UC-TH-03). Chỉ đọc. {@code since} là đầu ngày
 * đầu tiên của Khoảng thống kê theo múi giờ {@code zone} của học viên.
 */
public interface ShadowingStatsQueryService {

    /** Số tuần của biểu đồ xu hướng một âm, không phụ thuộc Khoảng thống kê (BR-TH-10). */
    int TREND_WEEKS = 8;

    /** Đủ 44 âm vị theo thứ tự chuẩn, âm chưa gặp có 0 lần (BR-TH-08). */
    List<PhonemeStatView> phonemeMap(UUID userId, Instant since, ZoneId zone);

    /** Điểm Shadowing trung bình theo ngày, hoặc theo tuần khi {@code weekly} (BR-TH-08). */
    List<ScorePointView> scoreTrend(UUID userId, Instant since, boolean weekly);

    /** Chi tiết một âm; rỗng nếu ký hiệu không thuộc bảng 44 âm vị. */
    Optional<PhonemeDetailView> phonemeDetail(UUID userId, String symbol, Instant since, ZoneId zone);

    /** Bài gần nhất học viên từng đọc sai âm đó mà còn mở được với gói hiện tại (BR-TH-10). */
    Optional<UUID> latestOpenLessonWithError(UUID userId, String symbol, boolean pro);
}
