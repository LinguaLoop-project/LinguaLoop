package com.lingualoop.backend.vocab.dto;

import java.time.Instant;
import java.util.UUID;

/** Số liệu học từ vựng cho Thống kê học tập (UC-TH-01, UC-TH-02). */
public final class VocabStatsView {

    private VocabStatsView() {
    }

    /**
     * Số thẻ theo Trạng thái thẻ (BR-HT-08) trong các bộ học viên đã bắt đầu học; thẻ Mới của bộ chưa bắt đầu không
     * được tính (BR-TH-04).
     */
    public record CardCounts(long newCount, long learning, long reviewing, long mastered) {
    }

    /** Số lần trả lời đúng trên tổng số lần trả lời trong một khoảng, gộp mọi cách học (BR-TH-04). */
    public record AnswerStats(long correct, long total) {
    }

    /**
     * Một phiên học hoặc ôn thẻ đã có ít nhất một câu trả lời, là một dòng của Lịch sử luyện tập.
     *
     * @param deckName      null với phiên ôn chung nhiều bộ
     * @param deckKind      {@code library}, {@code personal} hoặc {@code saved} ("Từ đã lưu"); null với phiên ôn chung
     * @param deckAvailable bộ còn mở được (chưa xóa; bộ thư viện còn xuất bản)
     * @param kind          {@code learn} hoặc {@code review}
     */
    public record Session(UUID sessionId, UUID deckId, String deckName, String deckKind, boolean deckAvailable,
            String kind, Instant startedAt, int answered, int correct) {
    }
}
