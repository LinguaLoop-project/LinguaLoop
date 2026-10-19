package com.lingualoop.backend.shadowing.dto;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.subscription.dto.FeatureUsage;

/**
 * Kết quả chấm một Lượt shadowing. Ký hiệu âm vị theo bảng phonemes (ADR 0004), cùng hệ với IPA mẫu của câu; âm chưa
 * chuyển được giữ ký hiệu Azure.
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

    /**
     * {@code tip} và {@code mouthVideo} chỉ có cho âm đọc dưới 60 điểm mà bảng mẹo/video có dữ liệu.
     */
    public record PhonemeResult(String symbol, double accuracy, String tip, MouthVideo mouthVideo) {
    }

    /** Video khẩu hình của một âm (nội dung Pro): Free nhận {@code url} null kèm {@code locked = true}. */
    public record MouthVideo(String url, boolean locked) {
    }
}
