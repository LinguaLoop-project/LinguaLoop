package com.lingualoop.backend.vocab.repository;

/** Đoạn SQL dùng chung cho các truy vấn thẻ. Bí danh: {@code c} là thẻ, {@code p} là tiến độ, {@code d} là bộ. */
final class CardSql {

    /**
     * Trạng thái thẻ suy từ tiến độ (BR-HT-08, V1): chưa có dòng là Mới; khoảng ôn từ 21 ngày là Đã thuộc; nhớ liên tiếp
     * dưới 2 lần là Đang học; còn lại là Đang ôn.
     */
    static final String STATUS = """
            CASE WHEN p.card_id IS NULL THEN 'new'
                 WHEN p.interval_days >= 21 THEN 'mastered'
                 WHEN p.repetitions < 2 THEN 'learning'
                 ELSE 'reviewing' END""";

    /** Bộ học viên được học: bộ thư viện đã xuất bản, hoặc bộ của chính họ (cá nhân, "Từ đã lưu"). */
    static final String DECK_VISIBLE = """
            d.deleted_at IS NULL
            AND ((d.kind = 'library' AND d.status = 'published') OR d.owner_id = :user)""";

    /**
     * Đến hạn: đã học và có lịch ôn không muộn hơn bây giờ (kể cả thẻ Đã thuộc), hoặc là thẻ Mới của bộ "Từ đã lưu" (từ
     * vừa lưu đến hạn ngay vì bộ này không có bước học từ mới).
     */
    static final String IS_DUE = """
            ((p.card_id IS NOT NULL AND p.due_at <= now()) OR (d.kind = 'saved' AND p.card_id IS NULL))""";

    private CardSql() {
    }
}
