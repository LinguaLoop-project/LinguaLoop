package com.lingualoop.backend.lesson.dto.response;

import java.util.UUID;

/**
 * Kết quả tạo bài từ YouTube (UC-BH-03 Bước 9): bài Nháp vừa tạo. Bản dịch để trống; giáo viên tự nhập hoặc tạo gợi ý
 * (UC-BH-10) nên tạo bài không trừ credit.
 *
 * @param ipaCount   số câu có IPA Mỹ (dùng chấm Shadowing)
 * @param ipaUkCount số câu có IPA Anh (chỉ để hiển thị)
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
        int ipaUkCount) {
}
