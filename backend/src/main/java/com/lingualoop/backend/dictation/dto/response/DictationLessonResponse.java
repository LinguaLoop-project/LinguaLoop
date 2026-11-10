package com.lingualoop.backend.dictation.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.practice.enums.DictationLevel;

public record DictationLessonResponse(UUID id, String title, String cefrLevel, boolean pro, String youtubeId,
        Integer durationSec, List<SentenceItem> sentences) {

    public DictationLessonResponse {
        sentences = List.copyOf(sentences);
    }

    /** text và textVi chỉ có khi câu đã có kết quả. inReview: câu đang trong Câu cần ôn; note: ghi chú của người học;
     * attemptCount: số lượt đã làm câu này (0 nếu chưa làm). */
    public record SentenceItem(UUID id, int sortOrder, int startMs, int endMs, int wordCount, String text,
            String textVi, LatestResult latest, boolean inReview, String note, int attemptCount) {
    }

    public record LatestResult(long attemptId, DictationLevel level, BigDecimal score, boolean gaveUp,
            boolean retry, Instant attemptedAt) {
    }
}
