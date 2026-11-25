package com.lingualoop.backend.lesson.dto;

import java.time.Instant;
import java.util.List;
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

    /** Số bài đã lưu theo từng chủ đề. */
    public record TopicCount(String name, long count) {
    }

    /** Thống kê tổng quan toàn bộ danh sách Bài đã lưu của học viên. */
    public record Summary(long total, long todo, long doing, long done, long totalDurationSec,
            List<TopicCount> topics) {
        public Summary {
            topics = List.copyOf(topics);
        }
    }

    /** Kết quả bỏ lưu hàng loạt các bài đã hoàn thành. */
    public record Cleared(int removedCount, List<UUID> removedIds) {
        public Cleared {
            removedIds = List.copyOf(removedIds);
        }
    }
}
