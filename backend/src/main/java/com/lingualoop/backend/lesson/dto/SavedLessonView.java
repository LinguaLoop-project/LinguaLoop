package com.lingualoop.backend.lesson.dto;

import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.lesson.dto.response.ModeProgressResponse;

/** Một bài trong danh sách Bài đã lưu (UC-TC-05). */
public record SavedLessonView(UUID id, String title, String cefrLevel, String youtubeId, Integer durationSec,
        String topicName, boolean pro, Availability availability, long sentenceCount, ModeProgressResponse progress,
        Instant savedAt) {

    /** Bài còn mở được không: {@code available}, {@code unavailable} (đã gỡ hoặc xóa) hoặc {@code pro_required}. */
    public enum Availability {
        available, unavailable, pro_required
    }

    /** Lưu hoặc bỏ lưu xong. */
    public record Saved(boolean saved) {
    }
}
