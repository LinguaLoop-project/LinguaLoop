package com.lingualoop.backend.dictation.service.token;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.dictation.service.grading.Normalizer;

@Service
class SentenceTokenServiceImpl implements SentenceTokenService {

    private static final Pattern SENTENCE_END = Pattern.compile(".*[.!?][\"'”’)]*$");

    private final WordClassifier classifier = new WordClassifier();

    @Override
    public List<SentenceToken> tokenize(String sentenceText) {
        if (sentenceText == null || sentenceText.isBlank()) {
            return List.of();
        }
        List<SentenceToken> tokens = new ArrayList<>();
        boolean sentenceInitial = true;
        int position = 0;
        for (String chunk : sentenceText.trim().split("\s+")) {
            String normalized = Normalizer.normalize(chunk);
            tokens.add(new SentenceToken(position++, chunk, normalized,
                    classifier.classify(normalized, chunk, sentenceInitial)));
            if (!normalized.isEmpty()) {
                sentenceInitial = SENTENCE_END.matcher(chunk).matches();
            }
        }
        return tokens;
    }
}
