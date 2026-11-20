package com.lingualoop.backend.lesson.dto.response;

/**
 * Thông tin video hiện trước khi tạo bài (UC-BH-03 Bước 3): giáo viên dán link thì thấy ảnh, tên và thời lượng video,
 * rồi mới chọn chủ đề, trình độ và bắt đầu tạo.
 *
 * @param title tên video cắt còn tối đa 100 ký tự, dùng làm tiêu đề bài mặc định (AC-BH-15)
 */
public record YouTubePreviewResponse(String youtubeId, String title, int durationSec) {
}
