package com.lingualoop.backend.practice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Một Buổi luyện: mọi lượt làm của học viên trên một bài, ở một chế độ, trong một ngày lịch theo múi giờ của họ. Là
 * một dòng của Lịch sử luyện tập (BR-TH-06), không phải bản ghi được lưu.
 *
 * @param averageBestScore điểm trung bình của điểm cao nhất mỗi câu trong buổi, nên lượt bỏ cuộc không kéo điểm xuống
 *                         khi câu đó có lượt tốt hơn
 * @param retries          số lượt làm lại (không tính lượt bỏ cuộc)
 * @param gaveUps          số lượt bỏ cuộc
 * @param lastAt           thời điểm nộp lượt cuối của buổi
 * @param available        bài còn xuất bản và chưa xóa, mở lại được
 */
public record PracticeSessionView(UUID lessonId, String lessonTitle, boolean available, String mode, LocalDate day,
        int sentences, BigDecimal averageBestScore, int retries, int gaveUps, Instant lastAt) {
}
