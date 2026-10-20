package com.lingualoop.backend.dictation.service.grading;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.dictation.service.token.SentenceToken;
import com.lingualoop.backend.dictation.service.token.SentenceTokenService;

/** Chấm một lượt nghe chép: cả câu (Normal/Hard) hoặc các ô trống (Easy). Java thuần, không đụng DB. */
@Component
public class DictationGrader {

    private final SentenceTokenService tokens;
    private final WordAligner aligner;
    private final OutcomeResolver resolver;
    private final HomophoneTable homophones;

    public DictationGrader(SentenceTokenService tokens, WordAligner aligner, OutcomeResolver resolver,
            HomophoneTable homophones) {
        this.tokens = tokens;
        this.aligner = aligner;
        this.resolver = resolver;
        this.homophones = homophones;
    }

    /**
     * Normal/Hard: căn chỉnh cả câu với chữ đã gõ. Điểm = số từ đúng / (số từ trong câu + số từ thừa).
     * revealedPositions là các từ đã mở: tính là sai.
     */
    public GradedAttempt gradeFull(String sentenceText, String typedText, Set<Integer> revealedPositions) {
        List<SentenceToken> gradable = tokens.tokenize(sentenceText).stream()
                .filter(t -> !t.normalized().isEmpty())
                .toList();
        List<String> expected = gradable.stream().map(SentenceToken::normalized).toList();
        Set<Integer> revealed = revealedPositions == null ? Set.of() : revealedPositions;

        List<GradedWord> words = new ArrayList<>();
        long correct = 0;
        long inserted = 0;
        for (AlignedPair pair : aligner.align(expected, Normalizer.words(typedText))) {
            if (pair.expectedIndex() == null) {
                words.add(new GradedWord(null, null, null, pair.actual(), null, WordOutcome.inserted, false));
                inserted++;
                continue;
            }
            SentenceToken token = gradable.get(pair.expectedIndex());
            WordOutcome outcome;
            if (revealed.contains(token.position())) {
                outcome = WordOutcome.revealed;
            } else if (pair.matched()) {
                outcome = WordOutcome.correct;
            } else {
                outcome = resolver.resolve(token.normalized(), pair.actual(), token.wordClass());
            }
            if (outcome == WordOutcome.correct) {
                correct++;
            }
            words.add(word(token, pair.actual(), outcome));
        }
        return new GradedAttempt(percent(correct, gradable.size() + inserted), words);
    }

    /**
     * Easy: chỉ chấm các ô trống, theo thứ tự vị trí.
     * Điểm = số ô đúng / số ô.
     */
    public GradedAttempt gradeBlanks(String sentenceText, Map<Integer, String> blankValues,
            Set<Integer> revealedPositions) {
        Map<Integer, SentenceToken> byPosition = new HashMap<>();
        for (SentenceToken token : tokens.tokenize(sentenceText)) {
            byPosition.put(token.position(), token);
        }
        Set<Integer> revealed = revealedPositions == null ? Set.of() : revealedPositions;

        List<GradedWord> words = new ArrayList<>();
        long correct = 0;
        for (Map.Entry<Integer, String> blank : new TreeMap<>(blankValues == null ? Map.<Integer, String>of()
                : blankValues).entrySet()) {
            SentenceToken token = byPosition.get(blank.getKey());
            if (token == null || token.normalized().isEmpty()) {
                throw new IllegalArgumentException("Invalid blank position: " + blank.getKey());
            }
            String typed = String.join(" ", Normalizer.words(blank.getValue()));
            String actual = typed.isEmpty() ? null : typed;
            WordOutcome outcome = revealed.contains(token.position()) ? WordOutcome.revealed
                    : resolver.resolve(token.normalized(), actual, token.wordClass());
            if (outcome == WordOutcome.correct) {
                correct++;
            }
            words.add(word(token, actual, outcome));
        }
        return new GradedAttempt(percent(correct, words.size()), words);
    }

    private GradedWord word(SentenceToken token, String actual, WordOutcome outcome) {
        boolean homophone = outcome == WordOutcome.misspelled && actual != null
                && homophones.sameGroup(token.normalized(), actual);
        return new GradedWord(token.position(), token.display(), token.normalized(), actual, token.wordClass(),
                outcome, homophone);
    }

    private static BigDecimal percent(long correct, long denominator) {
        if (denominator == 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return BigDecimal.valueOf(correct * 100L).divide(BigDecimal.valueOf(denominator), 2, RoundingMode.HALF_UP);
    }
}
