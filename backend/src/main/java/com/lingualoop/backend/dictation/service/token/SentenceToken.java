package com.lingualoop.backend.dictation.service.token;

public record SentenceToken(int position, String display, String normalized, WordClass wordClass) {
}
