package com.lingualoop.backend.shadowing.azure;

import java.util.List;

/**
 * Kết quả chấm phát âm của một bản ghi, độc lập với nhà cung cấp. Điểm 0–100. Ký hiệu âm vị giữ nguyên
 * như nhà cung cấp trả (Azure en-US dùng IPA giọng Mỹ).
 */
public record PronunciationAssessment(
        String recognizedText,
        double pronunciationScore,
        double accuracyScore,
        double fluencyScore,
        double completenessScore,
        Double prosodyScore,
        List<WordResult> words) {

    public PronunciationAssessment {
        words = words == null ? List.of() : List.copyOf(words);
    }

    /**
     * Điểm tổng của hệ thống (BR-SH-23), thay cho {@link #pronunciationScore()} của Azure vì Azure không công bố cách gộp
     * nên học viên không đối chiếu được. Trung bình có trọng số 50% chính xác, 30% trôi chảy, 20% ngữ điệu rồi nhân tỉ lệ đầy
     * đủ: đọc thiếu câu thì điểm giảm theo, dù phần đã đọc rất hay. Azure không trả ngữ điệu thì chia lại 60/40.
     */
    public double overallScore() {
        return overall(accuracyScore, fluencyScore, completenessScore, prosodyScore);
    }

    public static double overall(double accuracy, double fluency, double completeness, Double prosody) {
        double base = prosody == null
                ? 0.6 * accuracy + 0.4 * fluency
                : 0.5 * accuracy + 0.3 * fluency + 0.2 * prosody;
        double score = base * Math.max(0, Math.min(100, completeness)) / 100;
        return Math.round(Math.max(0, Math.min(100, score)) * 100) / 100.0;
    }

    public enum ErrorType {
        NONE, MISPRONUNCIATION, OMISSION, INSERTION;

        /** Giá trị {@code ErrorType} trong JSON của Azure; giá trị lạ (ngắt, đơn điệu…) coi như không lỗi. */
        public static ErrorType fromAzure(String value) {
            if (value == null) {
                return NONE;
            }
            return switch (value) {
                case "Mispronunciation" -> MISPRONUNCIATION;
                case "Omission" -> OMISSION;
                case "Insertion" -> INSERTION;
                default -> NONE;
            };
        }
    }

    public record WordResult(String word, double accuracyScore, ErrorType errorType, List<PhonemeResult> phonemes) {

        public WordResult {
            phonemes = phonemes == null ? List.of() : List.copyOf(phonemes);
        }
    }

    /**
     * {@code alternatives}: ứng viên âm (NBestPhonemes) kèm điểm, rỗng nếu Azure không trả.
     */
    public record PhonemeResult(String symbol, double accuracyScore, List<Candidate> alternatives) {

        public PhonemeResult {
            alternatives = alternatives == null ? List.of() : List.copyOf(alternatives);
        }

        public PhonemeResult(String symbol, double accuracyScore) {
            this(symbol, accuracyScore, List.of());
        }
    }

    public record Candidate(String symbol, double score) {
    }
}
