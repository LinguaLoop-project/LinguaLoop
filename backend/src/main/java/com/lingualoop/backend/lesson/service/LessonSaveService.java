package com.lingualoop.backend.lesson.service;

import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.lingualoop.backend.lesson.dto.SavedLessonView;
import com.lingualoop.backend.lesson.enums.LessonState;

/** Bài đã lưu (UC-TC-05): lưu hoặc bỏ lưu một bài học để luyện sau và xem lại danh sách. */
public interface LessonSaveService {

    /** Điều kiện lọc và sắp xếp cho danh sách Bài đã lưu. */
    record Filter(String q, LessonState state, Set<String> cefrLevels, String topic, Boolean freeOnly,
            Integer maxDurationSec, String sort) {
    }

    /** Lưu bài; bài phải còn hiển thị và học viên gói Free không lưu được bài Pro. Đã lưu thì giữ nguyên. */
    SavedLessonView.Saved save(UUID userId, UUID lessonId);

    /** Bỏ lưu; bài chưa lưu thì không làm gì. Bỏ lưu được cả bài đã gỡ hoặc xóa. */
    SavedLessonView.Saved unsave(UUID userId, UUID lessonId);

    /** Bỏ lưu toàn bộ bài đã hoàn thành của học viên. */
    SavedLessonView.Cleared clearCompleted(UUID userId);

    /** Thống kê tổng quan (tổng số bài theo tiến độ, tổng thời lượng, danh sách chủ đề) của học viên. */
    SavedLessonView.Summary summary(UUID userId);

    /** Bài đã lưu của học viên theo điều kiện lọc, sắp xếp và phân trang. */
    Page<SavedLessonView> list(UUID userId, Filter filter, Pageable pageable);
}
