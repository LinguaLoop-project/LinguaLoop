package com.lingualoop.backend.stats.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Thống kê một bộ thẻ của giáo viên (UC-TN-03) trong khoảng đã chọn, theo cách tính BR-TN-02. Tỷ lệ trạng thái học là
 * số hiện tại của các học viên đã ôn bộ trong khoảng (BR-TN-03); trống khi chưa có học viên nào. Mỗi nhóm thẻ kèm tối
 * đa 5 thẻ khó nhất, chỉ gồm thẻ đủ dữ liệu (BR-TN-04).
 */
public record TeacherDeckStatsView(
        Instant computedAt,
        StatsPeriod period,
        UUID deckId,
        String name,
        String status,
        long learners,
        long reviews,
        BigDecimal correctRatePct,
        DailySeries daily,
        CardStates cardStates,
        List<GroupRow> groups) {

    public static final String SERIES_REVIEWS = "reviews";
    public static final String SERIES_CORRECT = "correct";

    public TeacherDeckStatsView {
        groups = List.copyOf(groups);
    }

    /** Tỷ lệ phần trăm các cặp (học viên, thẻ) ở từng trạng thái học (BR-HT-08). */
    public record CardStates(BigDecimal newPct, BigDecimal learningPct, BigDecimal reviewingPct,
            BigDecimal masteredPct) {
    }

    /** Một nhóm thẻ theo thứ tự trong bộ, kèm các thẻ khó nhất; rỗng khi chưa thẻ nào đủ dữ liệu. */
    public record GroupRow(UUID id, String name, List<HardCard> hardestCards) {

        public GroupRow {
            hardestCards = List.copyOf(hardestCards);
        }
    }

    /** Một thẻ khó: số lượt ôn và tỷ lệ trả lời đúng trong khoảng. */
    public record HardCard(UUID id, String word, long reviews, BigDecimal correctRatePct) {
    }
}
