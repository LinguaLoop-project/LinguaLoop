package com.lingualoop.backend.lesson.dto;

import java.util.List;
import java.util.UUID;

/**
 * Bài học giới thiệu trên trang chủ công khai (BR-TC-20): chỉ thông tin hiển thị của thẻ bài, không có lời thoại hay dữ
 * liệu học viên.
 */
public record ShowcaseView(List<Lesson> lessons, List<String> topics) {

    public ShowcaseView {
        lessons = List.copyOf(lessons);
        topics = List.copyOf(topics);
    }

    public record Lesson(UUID id, String title, String youtubeId, int durationSec, String cefrLevel, String topicName,
            int sentenceCount, boolean pro) {
    }
}
