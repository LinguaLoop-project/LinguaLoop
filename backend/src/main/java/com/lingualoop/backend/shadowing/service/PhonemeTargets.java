package com.lingualoop.backend.shadowing.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.shadowing.azure.ExpectedPhonemes;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment;
import com.lingualoop.backend.shadowing.entity.AttemptPhoneme;
import com.lingualoop.backend.shadowing.entity.AttemptWord;

/** Âm mẫu của các từ đã lưu của một lượt, tính lại từ phiên âm của câu. */
final class PhonemeTargets {

    private PhonemeTargets() {
    }

    /**
     * @param words các từ của MỘT lượt, theo vị trí
     * @return id từ đã lưu -> âm mẫu của từ đó; thiếu khi câu không có phiên âm hoặc không tách được
     */
    static Map<Long, List<String>> expectedByWordId(SentenceView sentence, List<AttemptWord> words) {
        List<List<String>> reference = sentence == null ? null : ExpectedPhonemes.ofSentence(sentence.text(), sentence.ipa());
        Map<Long, List<String>> result = new HashMap<>();
        int ref = 0;
        for (AttemptWord w : words) {
            if (w.getExpectedWord() == null) {
                continue; // từ thừa không có trong câu mẫu
            }
            List<String> expected = reference != null && ref < reference.size() ? reference.get(ref) : null;
            ref++;
            if (expected != null) {
                result.put(w.getId(), expected);
            }
        }
        return result;
    }

    /**
     * Âm đích theo từng từ của kết quả chấm (cùng thứ tự và cùng số âm với Azure; null ở âm không ghép được).
     * Azure có thể chèn từ thừa nên chỉ đếm các từ không phải từ thừa khi đối chiếu với phiên âm của câu.
     */
    static List<List<String>> forAssessment(SentenceView sentence, PronunciationAssessment assessment) {
        List<List<String>> reference = ExpectedPhonemes.ofSentence(sentence.text(), sentence.ipa());
        List<List<String>> result = new ArrayList<>();
        int ref = 0;
        for (PronunciationAssessment.WordResult word : assessment.words()) {
            List<String> expected = null;
            if (word.errorType() != PronunciationAssessment.ErrorType.INSERTION) {
                expected = reference != null && ref < reference.size() ? reference.get(ref) : null;
                ref++;
            }
            result.add(ExpectedPhonemes.align(expected, word.phonemes().size()));
        }
        return result;
    }

    /** Ký hiệu cách đọc Azure báo: theo bảng phonemes, hoặc ký hiệu gốc khi chưa chuyển được. */
    static String reportedSymbol(AttemptPhoneme p, Map<Short, String> symbolById) {
        if (p.getPhonemeId() != null) {
            return symbolById.getOrDefault(p.getPhonemeId(), "?");
        }
        return p.getAzureSymbol() != null ? p.getAzureSymbol() : "?";
    }

    /**
     * Âm đích của một âm đã lưu: ưu tiên giá trị đã lưu lúc chấm, dòng cũ chưa có thì dùng phần ghép tính lại từ phiên
     * âm hiện tại của câu.
     */
    static String targetSymbol(AttemptPhoneme p, Map<Short, String> symbolById, List<String> recomputed) {
        if (p.getTargetPhonemeId() != null) {
            return symbolById.get(p.getTargetPhonemeId());
        }
        return recomputed.get(p.getPosition());
    }

    /** Âm không chuyển được không được lưu nhưng vị trí vẫn giữ: số âm Azure báo là vị trí lớn nhất + 1. */
    static int heardCount(List<AttemptPhoneme> stored) {
        return stored.stream().mapToInt(p -> p.getPosition() + 1).max().orElse(0);
    }
}
