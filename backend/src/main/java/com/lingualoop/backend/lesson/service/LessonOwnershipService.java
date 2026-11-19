package com.lingualoop.backend.lesson.service;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.lingualoop.backend.lesson.dto.OwnedLessonView;

/**
 * Đổi chủ bài học thư viện khi quản trị viên giao lại nội dung (UC-QT-06, UC-QT-07, BR-QT-07). Chỉ feature {@code user}
 * gọi, trong giao dịch của nó; quyền do feature đó kiểm. Bài cá nhân và bài đã xóa không bao giờ được giao.
 */
public interface LessonOwnershipService {

    /** Khóa và trả các bài thư viện chưa xóa trong {@code ids}; id không còn hợp lệ thì không có trong kết quả. */
    List<OwnedLessonView> lockLibraryLessons(Collection<UUID> ids);

    /** Khóa và trả mọi bài thư viện chưa xóa (Nháp và Đã xuất bản) của giáo viên. */
    List<OwnedLessonView> lockLibraryLessonsOf(UUID ownerId);

    /** Tiêu đề chữ thường của mọi bài chưa xóa của người dùng, để kiểm trùng tên (BR-QT-07). */
    Set<String> activeTitlesLower(UUID ownerId);

    /** Đổi chủ các bài; giữ nguyên trạng thái, câu và tiến độ học. Trả số bài đã đổi. */
    int changeOwner(Collection<UUID> lessonIds, UUID newOwnerId);
}
