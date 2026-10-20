package com.lingualoop.backend.practice.service;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;

/**
 * Số liệu luyện tập của một người dùng cho feature lesson hiển thị tiến độ. Chỉ đọc; không để lộ entity
 * hay repository của practice.
 */
public interface PracticeProgressQueryService {

    /**
     * Số câu đã có kết quả nghe chép theo từng bài: câu có ít nhất một lượt dictation, mọi mức, kể cả lượt làm lại
     * và bỏ cuộc. Bài chưa có lượt nào không có mặt trong map.
     */
    Map<UUID, Integer> countDictationSentencesDone(UUID userId, Collection<UUID> lessonIds);

    /** Điểm cao nhất của người dùng cho từng câu, mọi chế độ. Câu chưa có điểm không có mặt trong map. */
    Map<UUID, BigDecimal> bestScores(UUID userId, Collection<UUID> sentenceIds);
}
