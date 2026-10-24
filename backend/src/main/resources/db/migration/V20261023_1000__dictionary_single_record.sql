-- 1. user_saved_words: bỏ khoá ngoại tới dictionary_meanings, lưu số thứ tự nghĩa (meaning_no) thay cho meaning_id
DROP VIEW IF EXISTS v_user_saved_word_meanings;

ALTER TABLE user_saved_words ADD COLUMN meaning_no integer;
UPDATE user_saved_words s
   SET meaning_no = m.meaning_no
  FROM dictionary_meanings m
 WHERE m.id = s.meaning_id;

DROP INDEX uq_user_saved_whole;
DROP INDEX uq_user_saved_meaning;
ALTER TABLE user_saved_words DROP CONSTRAINT fk_saved_meaning_word;
ALTER TABLE user_saved_words DROP COLUMN meaning_id;

CREATE UNIQUE INDEX uq_user_saved_whole   ON user_saved_words(user_id, word_id)             WHERE meaning_no IS NULL;
CREATE UNIQUE INDEX uq_user_saved_meaning ON user_saved_words(user_id, word_id, meaning_no) WHERE meaning_no IS NOT NULL;

-- 2. bỏ các bảng con của từ điển
DROP TABLE dictionary_word_forms;
DROP TABLE dictionary_pronunciations;
DROP TABLE dictionary_meanings;

-- 3. dictionary_words: thêm phát âm, nghĩa, từ gốc
ALTER TABLE dictionary_words
    ADD COLUMN lemma_id           uuid REFERENCES dictionary_words(id) DEFERRABLE INITIALLY DEFERRED,
    ADD COLUMN ipa_uk             text,
    ADD COLUMN ipa_us             text,
    ADD COLUMN audio_uk           text,
    ADD COLUMN audio_us           text,
    ADD COLUMN pos_pronunciations jsonb,
    ADD COLUMN meanings           jsonb   NOT NULL DEFAULT '[]',
    ADD COLUMN source             text    NOT NULL DEFAULT 'tflat';

COMMENT ON COLUMN dictionary_words.headword      IS 'lowercase, trim';
COMMENT ON COLUMN dictionary_words.cefr_level    IS 'NULL nếu không có trong nguồn CEFR';
COMMENT ON COLUMN dictionary_words.lemma_id      IS 'dạng chia trỏ về từ gốc ("dogs" -> "dog", "went" -> "go"); NULL với từ gốc';
COMMENT ON COLUMN dictionary_words.audio_uk      IS 'đường dẫn tương đối, vd audio/hello-uk.mp3; NULL nếu chưa có';

CREATE INDEX ix_dictionary_words_lemma ON dictionary_words (lemma_id);
