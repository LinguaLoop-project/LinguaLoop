package com.lingualoop.backend.lesson.transcript;

import java.util.List;

import com.lingualoop.backend.lesson.youtube.YouTubeVideoInfo;

/**
 * Lấy lời thoại tiếng Anh của video thành các câu có mốc thời gian (UC-BH-03 Bước 7). Bản thật lấy phụ đề YouTube qua
 * TranscriptAPI (ADR 0012).
 * <p>
 * Không nhận được câu nào thì trả danh sách rỗng (7a). Lỗi dịch vụ ném {@code LESSON_TRANSCRIPT_UNAVAILABLE} (7b).
 */
public interface VideoTranscriber {

    List<TranscriptSegment> transcribe(YouTubeVideoInfo video);
}
