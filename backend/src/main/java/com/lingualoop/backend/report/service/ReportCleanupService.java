package com.lingualoop.backend.report.service;

import java.util.UUID;

/**
 * Tự đóng báo cáo khi nội dung bị báo bị xóa riêng (UC-XL-06 nhánh 1a, BR-XL-08). Feature soạn nội dung gọi trong cùng
 * giao dịch xóa; người thực hiện ghi là "Hệ thống".
 */
public interface ReportCleanupService {

    /** Đóng mọi báo cáo đang mở về thẻ này, ở cả hai luồng. */
    void closeForDeletedCard(UUID cardId);

    /** Đóng mọi báo cáo đang mở về các thẻ của nhóm thẻ này. */
    void closeForDeletedGroup(UUID groupId);

    /** Đóng mọi báo cáo đang mở về câu này. */
    void closeForDeletedSentence(UUID sentenceId);
}
