package com.lingualoop.backend.report.service;

import java.util.UUID;

/**
 * Cho feature soạn nội dung biết bài học hoặc bộ thẻ có đang mang dấu "Bị gỡ do báo cáo" không (BR-XL-13). Nội dung
 * mang dấu không được tự xuất bản, giáo viên phải gửi yêu cầu duyệt (UC-BH-06, UC-BT-05 nhánh 2b).
 */
public interface TakedownQueryService {

    boolean isLessonTakenDown(UUID lessonId);

    boolean isDeckTakenDown(UUID deckId);
}
