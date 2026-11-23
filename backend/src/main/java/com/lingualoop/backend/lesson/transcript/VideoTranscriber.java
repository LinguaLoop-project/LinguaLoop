package com.lingualoop.backend.lesson.transcript;

import com.lingualoop.backend.lesson.youtube.YouTubeVideoInfo;

/**
 * Lấy lời thoại tiếng Anh của video thành các câu có mốc thời gian (UC-BH-03 Bước 7). Bản thật lấy phụ đề YouTube qua
 * TranscriptAPI (ADR 0012).
 * <p>
 * Không nhận được câu nào thì trả lời thoại rỗng (7a), kèm cờ dịch vụ đã tính phí hay chưa. Lỗi dịch vụ ném
 * {@code LESSON_TRANSCRIPT_UNAVAILABLE} (7b).
 */
public interface VideoTranscriber {

    Transcript transcribe(YouTubeVideoInfo video);
}
