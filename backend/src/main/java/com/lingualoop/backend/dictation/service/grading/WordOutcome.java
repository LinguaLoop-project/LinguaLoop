package com.lingualoop.backend.dictation.service.grading;

/** Kết quả của một từ; khớp với CHECK của {@code sentence_attempt_words.outcome} (bỏ {@code mispronounced}). */
public enum WordOutcome {
    correct, omitted, inserted, substituted, misspelled, revealed
}
