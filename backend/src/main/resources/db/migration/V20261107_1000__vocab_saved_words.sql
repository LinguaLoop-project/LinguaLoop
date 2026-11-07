-- Từ đã lưu là thẻ trong bộ "Từ đã lưu" riêng của mỗi học viên (ADR 0008); nội dung thẻ chép từ từ điển lúc tạo (ADR 0009).

-- 1. Bộ "Từ đã lưu": mỗi học viên một bộ loại 'saved', ẩn khỏi danh sách bộ; bộ hệ thống và bộ tự tạo là 'catalog'
ALTER TABLE vocab_decks
    ADD COLUMN kind text NOT NULL DEFAULT 'catalog' CHECK (kind IN ('catalog', 'saved')),
    ADD CONSTRAINT chk_vocab_decks_saved_owner CHECK (kind <> 'saved' OR owner_id IS NOT NULL);
CREATE UNIQUE INDEX uq_vocab_decks_saved_per_owner ON vocab_decks (owner_id) WHERE kind = 'saved';

-- 2. Thẻ nhớ mình lấy từ mục từ và nghĩa nào (để hiện "Đã lưu" và không tạo trùng), kèm câu gốc nếu lưu từ bài học.
--    Chỉ là bản chép: từ điển nhập lại thì thẻ không đổi theo, nên không có khoá ngoại ràng buộc nghĩa.
ALTER TABLE vocab_cards
    ADD COLUMN word_id    uuid REFERENCES dictionary_words (id) ON DELETE SET NULL,
    ADD COLUMN meaning_no integer,
    ADD COLUMN context_en text,
    ADD COLUMN context_vi text;
COMMENT ON COLUMN vocab_cards.word_id    IS 'Mục từ gốc trong từ điển; NULL với thẻ tự nhập';
COMMENT ON COLUMN vocab_cards.meaning_no IS 'Số thứ tự nghĩa trong mục từ (dictionary_words.meanings[].no)';
COMMENT ON COLUMN vocab_cards.context_en IS 'Câu gốc trong bài học khi thẻ được lưu từ bài học';
CREATE UNIQUE INDEX uq_vocab_cards_source ON vocab_cards (group_id, word_id, meaning_no)
    WHERE word_id IS NOT NULL AND meaning_no IS NOT NULL;

-- 3. Mỗi từ đã lưu trỏ tới thẻ của nó
ALTER TABLE user_saved_words
    ADD COLUMN card_id uuid REFERENCES vocab_cards (id) ON DELETE CASCADE;
CREATE INDEX ix_user_saved_words_card ON user_saved_words (card_id);
