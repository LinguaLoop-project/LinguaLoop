-- =============================================================================
-- Mô hình âm đích (ADR 0005). Azure en-US báo CÁCH ĐỌC của từng âm (thường là âm mẫu, nhưng có thể là một biến thể
-- và vẫn chấm cao: "if" đọc thành "iv" Azure báo v được 100), còn âm đích phải lấy từ phiên âm của câu.
--   phoneme_id          cách đọc Azure báo, đã chuyển sang bảng phonemes (NULL nếu chưa chuyển được)
--   azure_symbol        ký hiệu gốc Azure trả, để xử lý lại khi sửa bộ chuyển đổi
--   target_phoneme_id   âm đích ghép từ phiên âm của câu (NULL nếu không ghép được)
--   produced_phoneme_id ứng viên khác cao điểm nhất trong NBestPhonemes của Azure (kèm produced_score)
-- Dòng cũ giữ nguyên: azure_symbol và target rỗng, phoneme_id vẫn có.
-- =============================================================================

ALTER TABLE sentence_attempt_phonemes
    ADD COLUMN azure_symbol      text,
    ADD COLUMN target_phoneme_id smallint REFERENCES phonemes(id) ON DELETE RESTRICT,
    ALTER COLUMN phoneme_id DROP NOT NULL;

ALTER TABLE sentence_attempt_phonemes
    ADD CONSTRAINT chk_phoneme_has_symbol CHECK (phoneme_id IS NOT NULL OR azure_symbol IS NOT NULL);

-- Âm chưa chuyển được (phoneme_id rỗng) vẫn được có ứng viên khác
ALTER TABLE sentence_attempt_phonemes DROP CONSTRAINT chk_phoneme_produced;
ALTER TABLE sentence_attempt_phonemes
    ADD CONSTRAINT chk_phoneme_produced CHECK (produced_phoneme_id IS NULL OR produced_phoneme_id IS DISTINCT FROM phoneme_id);

CREATE INDEX ix_sap_target ON sentence_attempt_phonemes(target_phoneme_id) WHERE target_phoneme_id IS NOT NULL;

-- Thống kê theo âm đích (nếu có). Lỗi: điểm dưới 60, hoặc phụ âm Azure báo khác âm đích dù điểm cao
-- (cùng quy tắc với PhonemeRules.needsFix; nguyên âm lệch nhau thường là rút gọn nên không tính).
CREATE OR REPLACE VIEW v_user_phoneme_stats AS
SELECT a.user_id,
       (a.attempted_at AT TIME ZONE 'UTC')::date                AS day,
       COALESCE(p.target_phoneme_id, p.phoneme_id)              AS phoneme_id,
       count(*)                                                 AS opportunities,
       count(*) FILTER (WHERE p.accuracy_score < 60
                           OR (p.target_phoneme_id IS NOT NULL
                               AND p.phoneme_id IS DISTINCT FROM p.target_phoneme_id
                               AND tgt.kind = 'consonant' AND rep.kind = 'consonant')) AS errors
FROM sentence_attempt_phonemes p
JOIN sentence_attempt_words w ON w.id = p.attempt_word_id
JOIN sentence_attempts a      ON a.id = w.attempt_id
LEFT JOIN phonemes tgt        ON tgt.id = p.target_phoneme_id
LEFT JOIN phonemes rep        ON rep.id = p.phoneme_id
WHERE COALESCE(p.target_phoneme_id, p.phoneme_id) IS NOT NULL
GROUP BY a.user_id, (a.attempted_at AT TIME ZONE 'UTC')::date, COALESCE(p.target_phoneme_id, p.phoneme_id);
