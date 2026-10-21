package com.lingualoop.backend.lesson.dto.response;

import java.util.UUID;

public record SentenceResponse(
    UUID id,
    String text,
    String textVi,
    String ipa,
    Integer startMs,
    Integer endMs,
    String cefrLevel,
    BestScores myBestScore
) {

    /** Điểm cao nhất của người học cho câu, tách theo chế độ; chế độ chưa có điểm thì null (và không xuất hiện trong JSON). */
    public record BestScores(Integer dictation, Integer shadowing) {}
}
