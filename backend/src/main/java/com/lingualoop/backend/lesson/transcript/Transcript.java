package com.lingualoop.backend.lesson.transcript;

import java.util.List;

/**
 * Lời thoại lấy được của video.
 *
 * @param segments các câu có mốc thời gian; rỗng khi không có lời thoại tiếng Anh (UC-BH-03 7a)
 * @param billed   dịch vụ lấy phụ đề đã tính phí lần lấy này: lỗi về sau vẫn phải ghi chi phí (BR-GA-12)
 */
public record Transcript(List<TranscriptSegment> segments, boolean billed) {

    public Transcript {
        segments = List.copyOf(segments);
    }

    /** Video không có phụ đề tiếng Anh: dịch vụ báo không tìm thấy và không tính phí. */
    public static Transcript none() {
        return new Transcript(List.of(), false);
    }
}
