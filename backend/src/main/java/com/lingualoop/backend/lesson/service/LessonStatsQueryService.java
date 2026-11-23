package com.lingualoop.backend.lesson.service;

import java.util.UUID;

import com.lingualoop.backend.lesson.dto.LessonStateCounts;

/** Số liệu bài học của một học viên cho feature {@code stats}. Chỉ đọc. */
public interface LessonStatsQueryService {

    /**
     * Số bài đang học (đã có lượt làm nhưng chưa hoàn thành) và đã hoàn thành, tính trên toàn bộ thời gian. Là số liệu
     * hiện trạng, không theo Khoảng thống kê (BR-TH-03).
     */
    LessonStateCounts stateCounts(UUID userId);
}
