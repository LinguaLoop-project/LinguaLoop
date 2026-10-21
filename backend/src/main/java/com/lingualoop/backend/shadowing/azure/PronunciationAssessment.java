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

    public record PhonemeResult(String symbol, double accuracyScore) {
    }
}
