package com.lingualoop.backend.lesson.service;

import java.util.UUID;

import com.lingualoop.backend.lesson.dto.request.CreateLessonFromYouTubeRequest;
import com.lingualoop.backend.lesson.dto.response.CreatedLessonResponse;
import com.lingualoop.backend.lesson.dto.response.YouTubePreviewResponse;

/** Giáo viên tạo bài học từ link YouTube (UC-BH-03). */
public interface TeacherLessonImportService {

    /**
     * Kiểm tra link và thông tin bài, đọc thông tin video, lấy phụ đề tiếng Anh thành câu có mốc thời gian, tạo IPA, rồi
     * lưu bài ở trạng thái Nháp; bản dịch để trống.
     */
    CreatedLessonResponse createFromYouTube(UUID teacherId, CreateLessonFromYouTubeRequest request);

    /**
     * Xem trước video khi giáo viên dán link (UC-BH-03 Bước 3): kiểm link (5a), video chưa có bài (5d) và thông tin video
     * (6a, 6c, 6d) như lúc tạo, nhưng chưa gọi AI và chưa lưu gì.
     */
    YouTubePreviewResponse previewYouTube(UUID teacherId, String youtubeUrl);
}
