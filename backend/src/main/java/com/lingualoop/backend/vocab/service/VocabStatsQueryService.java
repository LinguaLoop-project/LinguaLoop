package com.lingualoop.backend.vocab.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.lingualoop.backend.vocab.dto.VocabStatsView;

/**
 * Số liệu học từ vựng của một học viên cho feature {@code stats}. Chỉ đọc; không để lộ entity hay repository của
 * vocab. {@code since} là đầu ngày đầu tiên của Khoảng thống kê theo múi giờ của học viên.
 */
public interface VocabStatsQueryService {

    /** Ngày lịch có ít nhất một câu trả lời thẻ (BR-TH-02). */
    Set<LocalDate> activeDays(UUID userId);

    /** Số câu trả lời thẻ mỗi ngày lịch từ {@code since}, chỉ các ngày có câu trả lời (BR-TH-15). */
    Map<LocalDate, Long> activityByDay(UUID userId, Instant since);

    /** Số thẻ theo trạng thái, hiện trạng không theo khoảng (BR-TH-03, BR-TH-04). */
    VocabStatsView.CardCounts cardCounts(UUID userId);

    VocabStatsView.AnswerStats answerStats(UUID userId, Instant since);

    /** Phiên học hoặc ôn thẻ có câu trả lời, từ mới đến cũ, tối đa {@code limit} dòng. */
    List<VocabStatsView.Session> sessions(UUID userId, Instant since, int limit);

    long countSessions(UUID userId, Instant since);
}
