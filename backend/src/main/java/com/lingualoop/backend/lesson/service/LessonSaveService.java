package com.lingualoop.backend.lesson.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.lingualoop.backend.lesson.dto.SavedLessonView;
import com.lingualoop.backend.lesson.enums.LessonState;

/** Bài đã lưu (UC-TC-05): lưu hoặc bỏ lưu một bài học để luyện sau và xem lại danh sách. */
public interface LessonSaveService {

    /** Lưu bài; bài phải còn hiển thị và học viên gói Free không lưu được bài Pro. Đã lưu thì giữ nguyên. */
    SavedLessonView.Saved save(UUID userId, UUID lessonId);

    /** Bỏ lưu; bài chưa lưu thì không làm gì. Bỏ lưu được cả bài đã gỡ hoặc xóa. */
    SavedLessonView.Saved unsave(UUID userId, UUID lessonId);

    /**
     * Bài đã lưu của học viên. {@code q} tìm theo tên bài, {@code state} lọc theo tiến độ, {@code oldestFirst} đảo thứ tự
     * (mặc định mới lưu trước).
     */
    Page<SavedLessonView> list(UUID userId, String q, LessonState state, boolean oldestFirst, Pageable pageable);
}
