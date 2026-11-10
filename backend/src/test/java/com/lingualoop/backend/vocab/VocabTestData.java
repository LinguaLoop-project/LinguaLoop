package com.lingualoop.backend.vocab;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Dữ liệu mẫu cho test học từ vựng: bộ hệ thống, phần và thẻ chèn bằng SQL. Cơ sở dữ liệu của test dùng chung nên mỗi
 * test truyền một tiền tố riêng vào {@code prefix} để slug và từ không đụng nhau.
 */
@Component
@RequiredArgsConstructor
public class VocabTestData {

    private final JdbcTemplate jdbc;

    public UUID category(String prefix, int order) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO vocab_deck_categories (id, slug, name_en, name_vi, sort_order) VALUES (?, ?, ?, ?, ?)",
                id, prefix + "-cat", "Category", "Danh mục", order);
        return id;
    }

    public UUID deck(String prefix, boolean pro) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO vocab_decks (id, owner_id, category_id, slug, name, name_vi, difficulty, is_pro,
                                         visibility, status, sort_order)
                VALUES (?, NULL, ?, ?, ?, ?, CAST('B1' AS cefr_code), ?, 'system', 'APPROVED', 1)""",
                id, category(prefix, 200), prefix, "Deck " + prefix, "Bộ " + prefix, pro);
        return id;
    }

    /** Phần đánh số từ 1 như seed. */
    public UUID group(UUID deck, int sortOrder) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO vocab_groups (id, deck_id, name, name_vi, sort_order) VALUES (?, ?, ?, ?, ?)",
                id, deck, "Topic " + sortOrder, "Chủ đề " + sortOrder, sortOrder);
        return id;
    }

    public UUID card(UUID group, int sortOrder, String word) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO vocab_cards (id, group_id, word, pos, translation_vi, explanation_en, explanation_vi,
                                         example_en, example_vi, image_url, sort_order)
                VALUES (?, ?, ?, 'noun', ?, 'an explanation', 'giải thích', ?, 'ví dụ', 'https://cdn.example.com/i.webp', ?)""",
                id, group, word, "nghĩa " + word, "I like " + word + ".", sortOrder);
        jdbc.update("INSERT INTO vocab_card_phonetics (card_id, accent, ipa, audio_url) VALUES (?, 'uk', '/uk/', 'https://cdn.example.com/uk.mp3')", id);
        jdbc.update("INSERT INTO vocab_card_phonetics (card_id, accent, ipa, audio_url) VALUES (?, 'us', '/us/', 'https://cdn.example.com/us.mp3')", id);
        return id;
    }

    /** Bộ có {@code groups} phần, mỗi phần {@code perGroup} thẻ; trả các thẻ theo thứ tự. */
    public List<UUID> fill(UUID deck, int groups, int perGroup, String prefix) {
        List<UUID> cards = new ArrayList<>();
        for (int g = 1; g <= groups; g++) {
            UUID group = group(deck, g);
            for (int c = 1; c <= perGroup; c++) {
                cards.add(card(group, c, prefix + "w" + g + "x" + c));
            }
        }
        return cards;
    }

    public void progress(UUID user, UUID card, String status, int repetitions, int intervalDays, String nextReviewSql) {
        jdbc.update("INSERT INTO user_card_progress (user_id, card_id, status, repetitions, interval_days, next_review_at) "
                + "VALUES (?, ?, ?, ?, ?, " + nextReviewSql + ")", user, card, status, repetitions, intervalDays);
    }
}
