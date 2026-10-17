package com.lingualoop.backend.dictation.service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import com.lingualoop.backend.dictation.service.grading.Normalizer;
import com.lingualoop.backend.dictation.util.WordListLoader;

/** Luật phân loại một từ vào 6 nhóm. */
class WordClassifier {

    private final Set<String> functionWords = load("function-words.txt");
    private final Set<String> numberWords = load("number-words.txt");
    private final Set<String> interjections = load("interjections.txt");
    private final Set<String> inflectionExceptions = load("inflection-exceptions.txt");

    WordClass classify(String normalized, String display, boolean sentenceInitial) {
        if (normalized.isEmpty() || interjections.contains(normalized)) {
            return WordClass.other;
        }
        if (isNumber(normalized)) {
            return WordClass.number;
        }
        if (functionWords.contains(normalized)) {
            return WordClass.function;
        }
        String edgeless = Normalizer.stripEdges(display);
        if (!sentenceInitial && !edgeless.isEmpty() && Character.isUpperCase(edgeless.codePointAt(0))) {
            return WordClass.proper;
        }
        return isInflected(normalized) ? WordClass.inflected : WordClass.content;
    }

    private boolean isNumber(String normalized) {
        if (normalized.codePoints().anyMatch(Character::isDigit)) {
            return true;
        }
        return Arrays.stream(normalized.split("-")).allMatch(numberWords::contains);
    }

    private boolean isInflected(String word) {
        if (inflectionExceptions.contains(word)) {
            return false;
        }
        if (word.endsWith("ing")) {
            return word.length() >= 5;
        }
        if (word.endsWith("ed")) {
            return word.length() >= 4;
        }
        if (word.endsWith("s")) {
            return word.length() >= 4 && !word.endsWith("ss") && !word.endsWith("us") && !word.endsWith("is");
        }
        return false;
    }

    private static Set<String> load(String file) {
        return new HashSet<>(WordListLoader.load("dictation/" + file));
    }
}
