package com.lingualoop.backend.lesson.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Bài học trên màn quản lý của giáo viên và quản trị viên (UC-BH-01, UC-BH-02). */
public final class LessonManageView {

    private LessonManageView() {
    }

    /**
     * Một bài trong danh sách. {@code status} là {@code draft} hoặc {@code published}; bài đã xóa giữ trạng thái trước
     * khi xóa và có {@code deletedAt} (BR-BH-05). {@code unpublishReason} là lý do quản trị viên gỡ xuất bản, hiện cho
     * giáo viên chủ bài (BR-BH-04). {@code ownerName} là tên giáo viên chủ bài, hiện cho quản trị viên.
     */
    public record Item(
            UUID id,
            String title,
            String youtubeId,
            String thumbnailUrl,
            UUID topicId,
            String topicName,
            String cefrLevel,
            boolean pro,
            String status,
            long sentenceCount,
            Instant updatedAt,
            Instant deletedAt,
            String unpublishReason,
            UUID ownerId,
            String ownerName) {
    }

    /**
     * Chi tiết bài (UC-BH-02): thông tin bài và các câu chưa xóa theo thứ tự thời gian. {@code structureLocked}: bài đã
     * từng xuất bản nên không thêm (tách) câu được nữa (BR-BH-13).
     */
    public record Detail(
            UUID id,
            String title,
            String youtubeId,
            String youtubeUrl,
            String thumbnailUrl,
            int durationSec,
            UUID topicId,
            String topicName,
            String cefrLevel,
            boolean pro,
            String status,
            long sentenceCount,
            Instant createdAt,
            Instant updatedAt,
            String unpublishReason,
            UUID ownerId,
            String ownerName,
            boolean structureLocked,
            List<Sentence> sentences) {

        public Detail {
            sentences = List.copyOf(sentences);
        }
    }

    /** Một câu; {@code position} đánh từ 1 theo mốc bắt đầu. */
    public record Sentence(
            UUID id,
            int position,
            int startMs,
            int endMs,
            String textEn,
            String ipaUs,
            String ipaUk,
            String textVi) {
    }
}
