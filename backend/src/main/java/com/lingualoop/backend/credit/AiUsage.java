package com.lingualoop.backend.credit;

import java.util.UUID;

/**
 * Khối lượng của một lần dùng tính năng tính credit (BR-GA-06, BR-GA-12).
 *
 * @param quantity số đơn vị nghiệp vụ (lần, phiên, câu, bài); credit trừ = credit mỗi đơn vị × {@code quantity}
 * @param inputUnits số đơn vị xử lý đầu vào mà dịch vụ AI báo về, dùng để tính chi phí thật
 * @param outputUnits số đơn vị xử lý đầu ra, gồm cả phần suy nghĩ nội bộ của model
 * @param model model đã chạy (chính hoặc dự phòng); null nếu không có
 * @param estimated true khi số đơn vị xử lý không do backend tự nhận (phiên giọng nói trực tiếp): chi phí là ước tính
 * @param sessionId phiên giọng nói mà dòng nhật ký thuộc về, để điền chi phí khi phiên đóng; null với tính năng khác
 */
public record AiUsage(int quantity, long inputUnits, long outputUnits, String model, boolean estimated,
        UUID sessionId) {

    public AiUsage {
        if (quantity < 1) {
            throw new IllegalArgumentException("quantity phải >= 1");
        }
        inputUnits = Math.max(0, inputUnits);
        outputUnits = Math.max(0, outputUnits);
    }

    /** Một đơn vị, không có số đơn vị xử lý (tạo bài: chỉ có chi phí cố định). */
    public static AiUsage once() {
        return new AiUsage(1, 0, 0, null, false, null);
    }

    /**
     * Một đơn vị của phiên giọng nói trực tiếp: trình duyệt nối thẳng tới dịch vụ AI nên lúc trừ credit chưa có số đơn
     * vị xử lý; chi phí được điền sau qua {@link CreditService#recordLiveUsage}.
     */
    public static AiUsage live(UUID sessionId) {
        return new AiUsage(1, 0, 0, null, true, sessionId);
    }

    /** Một đơn vị kèm số đơn vị xử lý thật. */
    public static AiUsage tokens(long inputUnits, long outputUnits, String model) {
        return new AiUsage(1, inputUnits, outputUnits, model, false, null);
    }

    /** {@code quantity} đơn vị (ví dụ số câu được gợi ý dịch) kèm tổng số đơn vị xử lý. */
    public static AiUsage units(int quantity, long inputUnits, long outputUnits, String model) {
        return new AiUsage(quantity, inputUnits, outputUnits, model, false, null);
    }
}
