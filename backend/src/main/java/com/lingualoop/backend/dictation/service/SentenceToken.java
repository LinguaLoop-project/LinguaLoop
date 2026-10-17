package com.lingualoop.backend.dictation.service;

public record SentenceToken(int position, String display, String normalized, WordClass wordClass) {
}
