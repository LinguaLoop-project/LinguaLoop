package com.lingualoop.backend.vocab.service;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Sinh các bộ hệ thống "Oxford A1" đến "Oxford C2" từ từ điển (BR-VOCAB-04): mỗi mức CEFR một bộ gồm các mục từ gốc
 * có mức đó, xếp theo bảng chữ cái, 20 thẻ một phần, mỗi thẻ lấy nghĩa có số nhỏ nhất của mục từ (thường là nghĩa
 * số 1). Bộ B2, C1, C2 là bộ Pro (BR-VOCAB-05).
 *
 * <p>Chạy lại được nhiều lần: từ nào đã có thẻ trong bộ thì bỏ qua, từ mới của từ điển được nối vào cuối bộ, tên
 * và nội dung của thẻ đã có không bị ghi đè. Từ điển không nằm trong repo nên lệnh này chạy có chủ đích sau khi nạp
 * từ điển (xem {@link VocabCatalogRunner}).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VocabCatalogImporter {

    /** Số thẻ mỗi phần. */
    static final int PART_SIZE = 20;

    private static final List<String> LEVELS = List.of("A1", "A2", "B1", "B2", "C1", "C2");
    private static final Set<String> PRO_LEVELS = Set.of("B2", "C1", "C2");

    /**
     * Mỗi mục từ gốc có nghĩa trong từ điển ở mức đó ({@code picked}), rồi những từ chưa có thẻ trong bộ đánh số thứ
     * tự {@code ord} tiếp nối các thẻ đã có ({@code fresh}); phần của thẻ là {@code ord / 20}.
     */
    private static final String FRESH_WORDS = """
            WITH picked AS (
                SELECT w.id AS word_id, w.headword, m.elem
                FROM dictionary_words w
                CROSS JOIN LATERAL (
                    SELECT e AS elem FROM jsonb_array_elements(w.meanings) AS e ORDER BY (e->>'no')::int LIMIT 1) m
                WHERE w.lemma_id IS NULL AND w.cefr_level = CAST(:level AS cefr_code)
            ),
            fresh AS (
                SELECT p.*, row_number() OVER (ORDER BY p.headword, p.word_id) - 1 + :offset AS ord
                FROM picked p
                WHERE NOT EXISTS (
                    SELECT 1 FROM vocab_cards c JOIN vocab_groups g ON g.id = c.group_id
                    WHERE g.deck_id = :deck AND c.word_id = p.word_id)
            )
            """;

    private final JdbcClient jdbc;
    private final TransactionTemplate transaction;

    /** Nhập cả sáu mức; trả về số thẻ mới thêm. */
    public int importCatalog() {
        UUID categoryId = ensureCategory();
        int added = 0;
        for (int i = 0; i < LEVELS.size(); i++) {
            String level = LEVELS.get(i);
            int order = i;
            Integer levelAdded = transaction.execute(status -> importLevel(level, order, categoryId));
            added += levelAdded == null ? 0 : levelAdded;
        }
        return added;
    }

    private UUID ensureCategory() {
        jdbc.sql("""
                INSERT INTO vocab_deck_categories (slug, name_en, name_vi, sort_order)
                VALUES ('oxford', 'Oxford', 'Oxford', 0) ON CONFLICT (slug) DO NOTHING""").update();
        return jdbc.sql("SELECT id FROM vocab_deck_categories WHERE slug = 'oxford'").query(UUID.class).single();
    }

    private int importLevel(String level, int order, UUID categoryId) {
        UUID deckId = ensureDeck(level, order, categoryId);
        long offset = jdbc.sql("""
                SELECT count(*) FROM vocab_cards c JOIN vocab_groups g ON g.id = c.group_id WHERE g.deck_id = :deck""")
                .param("deck", deckId).query(Long.class).single();

        jdbc.sql(FRESH_WORDS + """
                INSERT INTO vocab_groups (deck_id, name, name_vi, sort_order)
                SELECT :deck, 'Part ' || (i + 1), 'Phần ' || (i + 1), i
                FROM generate_series(0, (SELECT max(ord) / %d FROM fresh)::int) AS i
                ON CONFLICT (deck_id, sort_order) WHERE deleted_at IS NULL DO NOTHING""".formatted(PART_SIZE))
                .param("level", level).param("offset", offset).param("deck", deckId).update();

        int added = jdbc.sql(FRESH_WORDS + """
                INSERT INTO vocab_cards (group_id, word_id, meaning_no, word, pos, translation_vi, example_en,
                                         example_vi, difficulty, sort_order)
                SELECT g.id, f.word_id, (f.elem->>'no')::int, f.headword, nullif(f.elem->>'pos', ''),
                       f.elem->>'translation_vi', f.elem->>'example_en', f.elem->>'example_vi',
                       CAST(:level AS cefr_code), (f.ord %% %d)::int
                FROM fresh f
                JOIN vocab_groups g ON g.deck_id = :deck AND g.sort_order = (f.ord / %d)::int AND g.deleted_at IS NULL
                ON CONFLICT DO NOTHING""".formatted(PART_SIZE, PART_SIZE))
                .param("level", level).param("offset", offset).param("deck", deckId).update();

        insertPhonetics(deckId, "us");
        insertPhonetics(deckId, "uk");
        nameGroups(deckId);
        log.info("Vocab catalog {}: {} new cards", level, added);
        return added;
    }

    private UUID ensureDeck(String level, int order, UUID categoryId) {
        String slug = "oxford-" + level.toLowerCase();
        return jdbc.sql("SELECT id FROM vocab_decks WHERE slug = :slug AND deleted_at IS NULL")
                .param("slug", slug).query(UUID.class).optional()
                .orElseGet(() -> jdbc.sql("""
                        INSERT INTO vocab_decks (category_id, slug, name, name_vi, difficulty, is_pro, visibility,
                                                 status, sort_order, kind)
                        VALUES (:category, :slug, :name, :nameVi, CAST(:level AS cefr_code), :pro, 'system',
                                'APPROVED', :order, 'catalog')
                        RETURNING id""")
                        .param("category", categoryId).param("slug", slug).param("name", "Oxford " + level)
                        .param("nameVi", "Từ vựng Oxford " + level).param("level", level)
                        .param("pro", PRO_LEVELS.contains(level)).param("order", order)
                        .query(UUID.class).single());
    }

    /** Phiên âm và âm thanh chép từ từ điển, theo loại từ của thẻ (như {@code WordViewMapper#toSnapshot}). */
    private void insertPhonetics(UUID deckId, String accent) {
        jdbc.sql("""
                INSERT INTO vocab_card_phonetics (card_id, accent, ipa, audio_url)
                SELECT c.id, :accent, x.ipa, x.audio
                FROM vocab_cards c
                JOIN vocab_groups g ON g.id = c.group_id AND g.deck_id = :deck
                JOIN dictionary_words w ON w.id = c.word_id
                CROSS JOIN LATERAL (
                    SELECT CASE WHEN jsonb_exists(w.pos_pronunciations, c.pos)
                                THEN w.pos_pronunciations->c.pos->>('ipa_' || :accent)
                                ELSE CASE :accent WHEN 'us' THEN w.ipa_us ELSE w.ipa_uk END END AS ipa,
                           CASE WHEN jsonb_exists(w.pos_pronunciations, c.pos)
                                THEN w.pos_pronunciations->c.pos->>('audio_' || :accent)
                                ELSE CASE :accent WHEN 'us' THEN w.audio_us ELSE w.audio_uk END END AS audio) x
                WHERE c.deleted_at IS NULL AND (x.ipa IS NOT NULL OR x.audio IS NOT NULL)
                ON CONFLICT (card_id, accent) DO NOTHING""")
                .param("deck", deckId).param("accent", accent).update();
    }

    /** Tên phần theo từ đầu và từ cuối, vd "Phần 1 · a – airport"; tính lại vì từ mới có thể nối vào phần cuối. */
    private void nameGroups(UUID deckId) {
        jdbc.sql("""
                UPDATE vocab_groups g SET name = r.en, name_vi = r.vi
                FROM (
                    SELECT c.group_id,
                           'Part ' || (gg.sort_order + 1) || ' · ' || (array_agg(c.word ORDER BY c.sort_order))[1]
                               || ' – ' || (array_agg(c.word ORDER BY c.sort_order DESC))[1] AS en,
                           'Phần ' || (gg.sort_order + 1) || ' · ' || (array_agg(c.word ORDER BY c.sort_order))[1]
                               || ' – ' || (array_agg(c.word ORDER BY c.sort_order DESC))[1] AS vi
                    FROM vocab_cards c
                    JOIN vocab_groups gg ON gg.id = c.group_id AND gg.deck_id = :deck
                    WHERE c.deleted_at IS NULL
                    GROUP BY c.group_id, gg.sort_order) r
                WHERE g.id = r.group_id AND (g.name IS DISTINCT FROM r.en OR g.name_vi IS DISTINCT FROM r.vi)""")
                .param("deck", deckId).update();
    }
}
