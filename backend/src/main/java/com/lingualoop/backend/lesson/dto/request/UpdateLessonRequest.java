package com.lingualoop.backend.lesson.dto.request;

import java.util.UUID;

import com.lingualoop.backend.lesson.enums.CefrLevel;

/**
 * Form sửa thông tin bài (UC-BH-04, BR-BH-08). Kiểm ở service vì tiêu đề chỉ có nghĩa sau khi cắt khoảng trắng hai đầu.
 * Link YouTube không sửa được nên không có ở đây.
 */
public record UpdateLessonRequest(String title, UUID topicId, CefrLevel cefrLevel, boolean pro) {
}
