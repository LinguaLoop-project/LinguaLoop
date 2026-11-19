package com.lingualoop.backend.lesson.dto;

import java.util.List;
import java.util.UUID;

/** Dữ liệu trả về cho Học thụ động (UC-TC-04). */
public final class WatchView {

    private WatchView() {
    }

    /**
     * Một trang của luồng video. {@code proHidden} cho biết học viên gói Free đang bị ẩn video Pro, để giao diện chèn thẻ
     * mời nâng cấp (AC-TC-32).
     */
    public record Feed(List<Item> items, int page, boolean hasMore, boolean proHidden) {
    }

    /** Một video: một bài học thư viện đã xuất bản kèm lời thoại. */
    public record Item(UUID lessonId, String title, String youtubeId, int durationSec, String cefrLevel,
            String topicName, boolean pro, long likeCount, boolean liked, List<Line> sentences) {
    }

    /** Một câu lời thoại; {@code saved} là câu đang ở danh sách Câu cần ôn chế độ Shadowing. */
    public record Line(UUID id, String textEn, String textVi, String ipaUs, String ipaUk, int startMs, int endMs,
            boolean saved) {
    }

    /** Trạng thái thích sau khi thích hoặc bỏ thích. */
    public record Like(boolean liked, long likeCount) {
    }

    /** Trạng thái lưu câu sau khi lưu hoặc bỏ lưu. */
    public record Saved(boolean saved) {
    }
}
