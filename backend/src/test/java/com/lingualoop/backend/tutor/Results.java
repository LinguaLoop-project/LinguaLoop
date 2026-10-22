package com.lingualoop.backend.tutor;

import java.util.List;

/** Dựng kết quả chấm giả cho test của Phiên gia sư. */
final class Results {

    private Results() {
    }

    static SentenceResult sentence(SentenceResult.Word... words) {
        return new SentenceResult(90, List.of(words));
    }

    static SentenceResult.Word word(String text, double accuracy, SentenceResult.Phoneme... phonemes) {
        return new SentenceResult.Word(text, accuracy, "correct", List.of(phonemes));
    }

    static SentenceResult.Word word(String text, double accuracy, String outcome) {
        return new SentenceResult.Word(text, accuracy, outcome, List.of());
    }

    /** Âm có điểm; cần sửa khi dưới 60 (như PhonemeRules). */
    static SentenceResult.Phoneme ph(String symbol, double accuracy) {
        return new SentenceResult.Phoneme(symbol, accuracy, accuracy < 60, false);
    }

    /** Âm điểm cao nhưng Azure báo một phụ âm khác âm đích (vd cần f, báo v). */
    static SentenceResult.Phoneme mismatch(String target, double accuracy) {
        return new SentenceResult.Phoneme(target, accuracy, true, true);
    }

    /** Câu đọc tốt, không có âm cần sửa. */
    static SentenceResult clean() {
        return sentence(word("good", 95, ph("g", 95), ph("ʊ", 94), ph("d", 96)));
    }

    /** Câu có một âm cần sửa nhưng từ vẫn trên ngưỡng mời. */
    static SentenceResult withPhonemeError(String phoneme) {
        return sentence(word("word", 70, ph(phoneme, 40), ph("ɜː", 90), ph("d", 90)));
    }
}
