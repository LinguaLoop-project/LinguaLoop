package com.lingualoop.backend.ai;

import java.util.List;

/**
 * Dữ liệu một lượt shadowing đưa cho AI viết nhận xét: chỉ chữ và điểm, không có âm thanh. Âm vị theo ký hiệu của
 * bảng {@code phonemes}.
 */
public record FeedbackRequest(String sentenceText, double score, Double accuracy, Double fluency,
        Double completeness, Double prosody, List<Word> words) {

    /** {@code outcome}: correct, mispronounced, omitted hoặc inserted. */
    public record Word(String text, double accuracy, String outcome, List<Phoneme> weakPhonemes) {
    }

    public record Phoneme(String symbol, double accuracy) {
    }
}
