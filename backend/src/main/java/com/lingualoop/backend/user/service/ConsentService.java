package com.lingualoop.backend.user.service;

import java.util.UUID;

/**
 * Hợp đồng kiểm tra người dùng đã đồng ý xử lý dữ liệu nhạy cảm (bảng {@code user_consents}, Kế sở hữu).
 * Hiện chỉ có bản tạm {@code StubConsentService} luôn trả "đã đồng ý"; khi làm API {@code /me/consents}
 * thì thay bản tạm bằng bản đọc bảng, giữ nguyên interface này.
 */
public interface ConsentService {

    enum ConsentType {
        /** Cho phép gửi giọng nói tới dịch vụ AI (Azure chấm phát âm, Gemini). */
        AI_PROCESSING,
        /** Cho phép lưu bản ghi giọng nói. */
        VOICE_STORAGE
    }

    boolean hasConsent(UUID userId, ConsentType type);
}
