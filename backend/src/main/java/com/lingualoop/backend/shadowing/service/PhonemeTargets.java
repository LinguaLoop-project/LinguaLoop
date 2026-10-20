package com.lingualoop.backend.shadowing.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.shadowing.azure.ExpectedPhonemes;
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

    /** Âm không chuyển được không được lưu nhưng vị trí vẫn giữ: số âm Azure báo là vị trí lớn nhất + 1. */
    static int heardCount(List<AttemptPhoneme> stored) {
        return stored.stream().mapToInt(p -> p.getPosition() + 1).max().orElse(0);
    }
}
