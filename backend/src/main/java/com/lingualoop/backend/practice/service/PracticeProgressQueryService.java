package com.lingualoop.backend.practice.service;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;

/**
 * Số liệu luyện tập của một người dùng cho feature lesson hiển thị tiến độ. Chỉ đọc; không để lộ entity
 * hay repository của practice.
 */
public interface PracticeProgressQueryService {

    /** Điểm cao nhất của người dùng cho từng câu, tách theo chế độ. Câu hay chế độ chưa có điểm thì không có mặt trong map. */
    Map<UUID, Map<PracticeMode, BigDecimal>> bestScores(UUID userId, Collection<UUID> sentenceIds);
}
