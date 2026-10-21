package com.lingualoop.backend.dictation.service.exercise;

import java.util.List;
import java.util.OptionalInt;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.dictation.service.token.SentenceToken;
import com.lingualoop.backend.dictation.service.grading.Normalizer;
import com.lingualoop.backend.dictation.service.grading.OutcomeResolver;
import com.lingualoop.backend.dictation.service.grading.WordOutcome;

/**
 * Tìm từ cần lộ cho gợi ý ở Normal/Hard: từ đầu tiên của câu mà chữ học viên gõ chưa đúng, tính theo vị trí
 * (từ thứ k của câu so với từ thứ k đã gõ). Từ gần đúng chính tả vẫn tính là chưa đúng để người học sửa lại.
 */
@Component
public class NextWordFinder {

    private final OutcomeResolver resolver;

    public NextWordFinder(OutcomeResolver resolver) {
        this.resolver = resolver;
    }

    /** Từ cần lộ là từ thứ mấy trong danh sách các từ chấm được của câu (theo thứ tự); rỗng nếu đã đúng hết. */
    public OptionalInt firstUnmatchedIndex(List<SentenceToken> gradable, String typedText) {
        List<String> typed = Normalizer.words(typedText);
        for (int i = 0; i < gradable.size(); i++) {
            SentenceToken token = gradable.get(i);
            String actual = i < typed.size() ? typed.get(i) : null;
            if (resolver.resolve(token.normalized(), actual, token.wordClass()) != WordOutcome.correct) {
                return OptionalInt.of(i);
            }
        }
        return OptionalInt.empty();
    }
}
