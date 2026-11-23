package com.lingualoop.backend.lesson.dto.response;

import java.util.UUID;

/**
 * Kết quả tạo bài từ YouTube (UC-BH-03 Bước 9): bài Nháp vừa tạo. Bản dịch để trống; giáo viên tự nhập hoặc tạo gợi ý
 * (UC-BH-10). Tạo bài trừ credit cố định mỗi bài (BR-GA-04, BR-BH-14).
 *
 * @param ipaCount       số câu có IPA Mỹ (dùng chấm Shadowing)
 * @param ipaUkCount     số câu có IPA Anh (chỉ để hiển thị)
 * @param creditsCharged credit vừa trừ cho lượt tạo bài (BR-GA-06)
 * @param creditBalance  số dư credit sau khi trừ (BR-GA-06)
 */
public record CreatedLessonResponse(
        UUID id,
        String title,
        String youtubeId,
        int durationSec,
        String cefrLevel,
        boolean pro,
        String status,
        int sentenceCount,
        int ipaCount,
        int ipaUkCount,
        int creditsCharged,
        int creditBalance) {
}
