package com.lingualoop.backend.vocab.dto;

import java.time.Instant;
import java.util.UUID;

/** Một bộ trong "Bộ của tôi" (UC-HT-08): {@code dueCount} là số thẻ đến hạn ôn của bộ này. */
public record MyDeckView(UUID id, String name, int cardCount, int dueCount, Instant createdAt) {
}
