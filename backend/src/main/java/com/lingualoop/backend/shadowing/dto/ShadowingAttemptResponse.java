package com.lingualoop.backend.shadowing.dto;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.subscription.dto.FeatureUsage;

/**
 * Kết quả chấm một Lượt shadowing. Ký hiệu âm vị giữ như Azure trả (ADR 0004), khác với ký hiệu lưu trong DB.
 */
public record ShadowingAttemptResponse(
        long attemptId,
        UUID sentenceId,
        double score,
        double accuracy,
        double fluency,
        double completeness,
        Double prosody,
        String recognizedText,
        List<WordResult> words,
        FeatureUsage usage) {

    /** {@code outcome}: correct, mispronounced, omitted hoặc inserted. */
    public record WordResult(int position, String word, double accuracy, String outcome, List<PhonemeResult> phonemes) {
    }

    public record PhonemeResult(String symbol, double accuracy) {
    }
}
