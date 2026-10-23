-- =============================================================================
-- Ghi chú câu: mỗi người dùng chỉ có một ghi chú cho một câu, dài 1..1000 ký tự (BR-DICT-17).
-- =============================================================================

DELETE FROM sentence_notes n
USING sentence_notes newer
WHERE n.user_id = newer.user_id AND n.sentence_id = newer.sentence_id
  AND (n.updated_at, n.id) < (newer.updated_at, newer.id);

DROP INDEX ix_sentence_notes_user;
CREATE UNIQUE INDEX uq_sentence_notes_user_sentence ON sentence_notes(user_id, sentence_id);

ALTER TABLE sentence_notes ADD CONSTRAINT chk_sentence_note_content CHECK (char_length(content) BETWEEN 1 AND 1000);
