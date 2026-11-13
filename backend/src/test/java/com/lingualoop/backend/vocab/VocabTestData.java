package com.lingualoop.backend.vocab;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Dữ liệu mẫu cho test học từ vựng: bộ thư viện, phần và thẻ chèn bằng SQL. Cơ sở dữ liệu của test dùng chung nên mỗi
 * test truyền một tiền tố riêng vào {@code prefix}; id của bộ suy ra từ tiền tố ({@link #idOf}) để test gọi API theo id.
 */
@Component
@RequiredArgsConstructor
public class VocabTestData {

    private final JdbcTemplate jdbc;

    /** Id của bộ tạo bằng {@link #deck(String, boolean)} với tiền tố này. */
    public static UUID idOf(String prefix) {
        return UUID.nameUUIDFromBytes(("deck:" + prefix).getBytes(StandardCharsets.UTF_8));
    }

    public UUID category(String prefix) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO deck_categories (id, name) VALUES (?, ?)", id, prefix + "-cat");
        return id;
    }

    /** Bộ thư viện hệ thống đã xuất bản. */
    public UUID deck(String prefix, boolean pro) {
        UUID id = idOf(prefix);
        jdbc.update("""
                INSERT INTO vocab_decks (id, owner_id, kind, category_id, name, is_pro, status)
                VALUES (?, NULL, 'library', ?, ?, ?, 'published')""",
                id, category(prefix), "Deck " + prefix, pro);
        return id;
    }

    /** Phần thứ {@code order} (từ 1); thứ tự phần theo {@code created_at} nên ghi mốc tăng dần theo {@code order}. */
    public UUID group(UUID deck, int order) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO vocab_groups (id, deck_id, name, created_at)
                VALUES (?, ?, ?, now() - interval '1 day' + make_interval(secs => ?))""",
                id, deck, "Topic " + order, order);
        return id;
    }

    /** Thẻ thứ {@code order} của phần; thứ tự thẻ theo {@code created_at}. */
    public UUID card(UUID group, int order, String word) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO vocab_cards (id, deck_id, group_id, word, pos, meaning_vi, definition_en, definition_vi,
                                         example_en, example_vi, ipa_uk, ipa_us, audio_uk_url, audio_us_url, created_at)
                VALUES (?, (SELECT deck_id FROM vocab_groups WHERE id = ?), ?, ?, 'noun', ?, 'an explanation',
                        'giải thích', ?, 'ví dụ', '/uk/', '/us/', 'https://cdn.example.com/uk.mp3',
                        'https://cdn.example.com/us.mp3', now() - interval '1 day' + make_interval(secs => ?))""",
                id, group, group, word, "nghĩa " + word, "I like " + word + ".", order);
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

    /**
     * Tiến độ của thẻ; trạng thái suy từ {@code repetitions} và {@code intervalDays} (V1) nên không truyền.
     * {@code dueSql} là biểu thức SQL của lịch ôn, ví dụ {@code now() + interval '6 days'}.
     */
    public void progress(UUID user, UUID card, int repetitions, int intervalDays, String dueSql) {
        jdbc.update("INSERT INTO user_card_progress (user_id, card_id, repetitions, interval_days, due_at) "
                + "VALUES (?, ?, ?, ?, " + dueSql + ")", user, card, repetitions, intervalDays);
    }
}
