package com.lingualoop.backend.lesson.service;

import java.util.UUID;

/**
 * Gỡ và xuất bản lại bài học theo quyết định xử lý báo cáo (UC-XL-04, UC-XL-05). Chỉ feature {@code report} gọi; quyền
 * do feature đó kiểm.
 */
public interface LessonModerationService {

    /**
     * Đưa bài học thư viện Đã xuất bản về Nháp kèm lý do gỡ hiện cho giáo viên chủ (BR-XL-13). Bài đã là Nháp hoặc đã
     * xóa thì không đổi gì (UC-XL-04 nhánh 2a).
     */
    void unpublishForReport(UUID lessonId, String reason);

    /**
     * Xuất bản bài học sau khi quản trị viên duyệt (UC-XL-05). Bài không tồn tại hoặc đã xóa ném
     * {@code LESSON_NOT_FOUND}; chưa đạt BR-BH-11 ném {@code LESSON_NOT_PUBLISHABLE} kèm {@code details.noSentences} và
     * {@code details.missingTranslation} (thứ tự các câu thiếu bản dịch).
     */
    void publishApproved(UUID lessonId);

    /**
     * Ghi bản sửa đề xuất của học viên vào một trường của câu chưa xóa (UC-XL-02 nhánh 2a, BR-XL-10); quyền chủ bài do
     * feature {@code report} kiểm. {@code column} là {@code text_en}, {@code ipa_us}, {@code ipa_uk} hoặc
     * {@code text_vi}. Câu đã xóa ném {@code REPORT_TARGET_NOT_FOUND}. Trả về giá trị cũ của trường.
     */
    String applyReportFix(UUID sentenceId, String column, String value);
}
