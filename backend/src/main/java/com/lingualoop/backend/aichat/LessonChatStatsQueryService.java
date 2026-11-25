package com.lingualoop.backend.aichat;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Số liệu phiên Thực hành với AI của một học viên cho feature {@code stats}. Chỉ đọc. Chỉ phiên đã hoàn thành
 * ({@code completed}) mới tính là hoạt động học tập (BR-TH-02) và hiện trong Lịch sử luyện tập (UC-TH-02).
 */
public interface LessonChatStatsQueryService {

    /**
     * Một phiên đã hoàn thành.
     *
     * @param answered        số câu trả lời của học viên trong phiên
     * @param lessonAvailable bài còn xuất bản và chưa xóa
     */
    record Session(UUID sessionId, UUID lessonId, String lessonTitle, boolean lessonAvailable, String mode,
            Instant endedAt, int answered) {
    }

    /** Ngày lịch (theo múi giờ của học viên) có ít nhất một phiên hoàn thành. */
    Set<LocalDate> activeDays(UUID userId);

    /** Số phiên hoàn thành mỗi ngày lịch từ {@code since}, chỉ các ngày có phiên (BR-TH-15). */
    Map<LocalDate, Long> activityByDay(UUID userId, Instant since);

    /** Phiên hoàn thành từ {@code since}, từ mới đến cũ, tối đa {@code limit} dòng. */
    List<Session> sessions(UUID userId, Instant since, int limit);

    long countSessions(UUID userId, Instant since);
}
