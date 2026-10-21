package com.lingualoop.backend.shadowing.azure;

/**
 * Chấm phát âm một bản ghi so với câu mẫu. Dùng chung cho shadowing, Phiên gia sư và phần nói của bài
 * kiểm tra trình độ (planning/README.md §4).
 */
public interface PronunciationScoringService {

    /**
     * @param wav           bản ghi WAV PCM 16-bit mono 16 kHz đã được kiểm tra hợp lệ
     * @param referenceText lời mẫu (chữ của câu hoặc từ cần đọc)
     * @throws com.lingualoop.backend.common.exception.BusinessException {@code SHADOWING_NO_SPEECH} khi không
     *         nghe thấy lời nói, {@code SHADOWING_SCORING_UNAVAILABLE} khi dịch vụ lỗi hoặc chưa cấu hình
     */
    PronunciationAssessment assess(byte[] wav, String referenceText);
}
