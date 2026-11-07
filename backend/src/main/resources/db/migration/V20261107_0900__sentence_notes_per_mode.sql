-- =============================================================================
-- Ghi chú câu tách theo chế độ luyện (BR-DICT-17, BR-SHADOW-17): mỗi người dùng có tối đa một ghi chú cho một
-- câu ở mỗi chế độ (nghe chép, Shadowing). Ghi chú hiện có đều viết ở nghe chép (Shadowing chưa có ghi chú) nên
-- chuyển thành ghi chú nghe chép.
-- =============================================================================

ALTER TABLE sentence_notes ADD COLUMN mode practice_mode NOT NULL DEFAULT 'dictation';
ALTER TABLE sentence_notes ALTER COLUMN mode DROP DEFAULT;

DROP INDEX uq_sentence_notes_user_sentence;
CREATE UNIQUE INDEX uq_sentence_notes_user_sentence_mode ON sentence_notes(user_id, sentence_id, mode);
