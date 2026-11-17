package com.lingualoop.backend.practice.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;

/**
 * Một câu được chọn cho phiên ôn câu: kèm video và mốc thời gian để phát, và điểm lượt gần nhất. {@code lastScore} có
 * thể trống nếu câu chưa có lượt nào (không xảy ra với câu đã ghim).
 */
public record ReviewPlanSentence(UUID sentenceId, PracticeMode mode, UUID lessonId, String lessonTitle, String youtubeId,
        int startMs, int endMs, String text, String textVi, BigDecimal lastScore) {
}
