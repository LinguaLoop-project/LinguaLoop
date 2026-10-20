package com.lingualoop.backend.tutor;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Dựng Danh sách từ lỗi theo luật, không để LLM quyết định (BR-TUTOR-03). Mỗi từ lấy âm đích cần sửa nặng nhất; các
 * từ xếp theo: phụ âm khác âm đích, rồi lỗi lặp lại ở các lượt trước, rồi điểm thấp nhất. Từ thừa không có trong câu
 * mẫu nên không bao giờ được luyện.
 */
@Component
@RequiredArgsConstructor
public class PracticeWordSelector {

    private final TipCatalog tipCatalog;

    private record Candidate(String word, String phoneme, double score, boolean mismatch, long repeats) {
    }

    private static final Comparator<Candidate> ORDER = Comparator.comparing(Candidate::mismatch).reversed()
            .thenComparing(Comparator.comparingLong(Candidate::repeats).reversed())
            .thenComparingDouble(Candidate::score);

    /**
     * @param current  kết quả chấm của câu vừa đọc
     * @param previous kết quả của các câu trước trong bài, câu gần nhất đứng đầu
     * @return danh sách rỗng khi câu không có từ nào đáng sửa
     */
    public List<PracticeWord> select(SentenceResult current, List<SentenceResult> previous) {
        List<SentenceResult> history = previous == null ? List.of() : previous;
        Map<String, Candidate> bestByWord = new LinkedHashMap<>();

        for (SentenceResult.Word word : current.words()) {
            String key = Words.normalize(word.text());
            if (key.isEmpty() || word.inserted()) {
                continue;
            }
            for (SentenceResult.Phoneme phoneme : word.phonemes()) {
                if (phoneme.needsFix()) {
                    bestByWord.merge(key, candidate(word, phoneme, history), this::better);
                }
            }
        }

        // Từ điểm thấp nhưng không có âm nào cần sửa (Azure chấm thấp cả từ): lấy âm điểm thấp nhất của từ
        for (SentenceResult.Word word : current.words()) {
            String key = Words.normalize(word.text());
            if (key.isEmpty() || word.inserted() || bestByWord.containsKey(key)
                    || word.accuracy() >= TutorThresholds.LOW_WORD_SCORE) {
                continue;
            }
            // Từ bị bỏ sót hoặc không có âm vị: vẫn luyện được, chấm theo điểm cả từ
            bestByWord.put(key, word.phonemes().stream()
                    .min(Comparator.comparingDouble(SentenceResult.Phoneme::accuracy))
                    .map(p -> candidate(word, p, history))
                    .orElseGet(() -> new Candidate(word.text(), null, word.accuracy(), false, 0)));
        }

        return bestByWord.values().stream()
                .sorted(ORDER)
                .limit(TutorThresholds.MAX_PRACTICE_WORDS)
                .map(c -> new PracticeWord(c.word(), c.phoneme(), c.score(), tipCatalog.tipFor(c.phoneme()).orElse(null)))
                .toList();
    }

    /**
     * Dựng Từ luyện cho một từ người học tự chọn, kể cả từ không bị lỗi: lấy âm cần sửa (nếu có) hoặc âm điểm thấp
     * nhất của từ đó trong kết quả chấm gốc. Không có âm vị (Azure bỏ sót từ) thì chỉ có điểm từ.
     *
     * @param displayWord từ như viết trong câu
     */
    public PracticeWord forWord(SentenceResult sentence, String displayWord) {
        String key = Words.normalize(displayWord);
        Optional<SentenceResult.Word> match = sentence.words().stream()
                .filter(w -> !w.inserted() && Words.normalize(w.text()).equals(key))
                .findFirst();
        if (match.isEmpty()) {
            return new PracticeWord(displayWord, null, 0, null);
        }
        SentenceResult.Word word = match.get();
        return word.phonemes().stream()
                .min(Comparator.comparing(SentenceResult.Phoneme::needsFix).reversed()
                        .thenComparingDouble(SentenceResult.Phoneme::accuracy))
                .map(p -> new PracticeWord(displayWord, p.symbol(), p.accuracy(), tipCatalog.tipFor(p.symbol()).orElse(null)))
                .orElseGet(() -> new PracticeWord(displayWord, null, word.accuracy(), null));
    }

    private Candidate better(Candidate a, Candidate b) {
        return ORDER.compare(a, b) <= 0 ? a : b;
    }

    private Candidate candidate(SentenceResult.Word word, SentenceResult.Phoneme phoneme, List<SentenceResult> history) {
        long repeats = history.stream().filter(r -> r.errorSymbols().contains(phoneme.symbol())).count();
        return new Candidate(word.text(), phoneme.symbol(), phoneme.accuracy(), phoneme.mismatch(), repeats);
    }
}
