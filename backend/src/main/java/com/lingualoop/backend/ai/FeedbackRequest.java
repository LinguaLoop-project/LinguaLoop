package com.lingualoop.backend.ai;

import java.util.List;
import java.util.Map;

/**
 * Dữ liệu một lượt shadowing đưa cho AI viết nhận xét: chỉ chữ và điểm, không có âm thanh. Âm vị theo ký hiệu của
 * bảng {@code phonemes}.
 *
 * @param previous lượt trước của cùng câu (để so sánh tiến bộ); null nếu đây là lượt đầu
 * @param tips     mẹo khẩu hình theo ký hiệu âm, chỉ cho các âm yếu của lượt này; do hệ thống gắn vào nhận xét, AI không tự viết
 */
public record FeedbackRequest(String sentenceText, double score, Double accuracy, Double fluency,
        Double completeness, Double prosody, List<Word> words, Previous previous, Map<String, String> tips) {

    /** Lượt không có lượt trước và không có mẹo. */
    public FeedbackRequest(String sentenceText, double score, Double accuracy, Double fluency, Double completeness,
            Double prosody, List<Word> words) {
        this(sentenceText, score, accuracy, fluency, completeness, prosody, words, null, Map.of());
    }

    /** {@code outcome}: correct, mispronounced, omitted hoặc inserted. */
    public record Word(String text, double accuracy, String outcome, List<Phoneme> weakPhonemes) {
    }

    /** {@code expected}: âm mẫu khi khác {@code symbol}; null nếu trùng hoặc không biết. */
    public record Phoneme(String symbol, String expected, double accuracy) {
    }

    /** Điểm tổng và điểm từng từ (khóa chữ thường) của lượt trước. */
    public record Previous(double score, Map<String, Double> wordScores) {
    }
}
