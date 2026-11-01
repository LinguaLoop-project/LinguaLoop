-- =============================================================================
-- Phiên âm của câu theo hai giọng, và bảng phonemes chuyển sang âm giọng Mỹ (ADR 0007).
-- Giọng chấm luôn là en-US: ipa_us là nguồn của âm đích, ipa_uk chỉ để hiển thị.
-- =============================================================================

ALTER TABLE sentences RENAME COLUMN ipa TO ipa_us;
ALTER TABLE sentences ADD COLUMN ipa_uk text;

COMMENT ON COLUMN sentences.ipa_us IS
    'Phiên âm Mỹ, nguồn của âm đích khi chấm. Mỗi từ một cụm, cách nhau một dấu cách, không có / hay dấu câu; NULL nếu thiếu phiên âm của một từ.';
COMMENT ON COLUMN sentences.ipa_uk IS
    'Phiên âm Anh chỉ để hiển thị, không dùng để chấm. Cùng định dạng với ipa_us; NULL nếu thiếu phiên âm của một từ.';

-- -----------------------------------------------------------------------------
-- phonemes: từ 44 âm Anh-Anh sang 44 âm giọng Mỹ, ký hiệu giống Azure en-US trả về.
-- Đổi ký hiệu tại chỗ (giữ nguyên id) nên mẹo, video khẩu hình, thống kê và các lượt đã lưu đi theo âm tương ứng.
-- -----------------------------------------------------------------------------

-- Giọng Mỹ không tách ɒ (hot) khỏi ɑː (father): gộp ɒ vào ɑː rồi bỏ hàng ɒ.
-- chk_phoneme_produced không cho "âm khác" trùng cách đọc Azure báo, nên xoá ứng viên khác sẽ trùng sau khi gộp.
UPDATE sentence_attempt_phonemes
SET produced_phoneme_id = NULL, produced_score = NULL
WHERE produced_phoneme_id = (SELECT id FROM phonemes WHERE symbol = 'ɒ')
   OR (phoneme_id = (SELECT id FROM phonemes WHERE symbol = 'ɒ')
       AND produced_phoneme_id = (SELECT id FROM phonemes WHERE symbol = 'ɑː'));

UPDATE sentence_attempt_phonemes SET phoneme_id = (SELECT id FROM phonemes WHERE symbol = 'ɑː')
WHERE phoneme_id = (SELECT id FROM phonemes WHERE symbol = 'ɒ');
UPDATE sentence_attempt_phonemes SET target_phoneme_id = (SELECT id FROM phonemes WHERE symbol = 'ɑː')
WHERE target_phoneme_id = (SELECT id FROM phonemes WHERE symbol = 'ɒ');
UPDATE tutor_session_words SET focus_phoneme_id = (SELECT id FROM phonemes WHERE symbol = 'ɑː')
WHERE focus_phoneme_id = (SELECT id FROM phonemes WHERE symbol = 'ɒ');

-- Mẹo (phoneme_confusions) và cặp tối thiểu (minimal_pairs) của ɒ bị xoá theo (ON DELETE CASCADE)
DELETE FROM phonemes WHERE symbol = 'ɒ';

-- Ký hiệu mới không trùng ký hiệu nào đang có nên đổi một lượt được. Phụ âm giữ nguyên, kể cả g (Azure trả cả g lẫn ɡ).
UPDATE phonemes p SET symbol = m.us
FROM (VALUES
    ('iː', 'i'),  ('uː', 'u'),  ('e', 'ɛ'),   ('ɑː', 'ɑ'),  ('ɔː', 'ɔ'),  ('ɜː', 'ɝ'),
    ('əʊ', 'oʊ'), ('ɪə', 'ɪɹ'), ('eə', 'ɛɹ'),  ('ʊə', 'ʊɹ'),  ('r', 'ɹ')
) AS m(uk, us)
WHERE p.symbol = m.uk;

-- Âm r-hoá không nhấn (teacher, deliver). Trước đây gộp vào ə nên ô âm hiện sai so với phiên âm Mỹ của câu.
-- Chưa có video khẩu hình: mouth_video_url để NULL, giao diện tự ẩn nút video.
INSERT INTO phonemes (symbol, kind, example_word) VALUES ('ɚ', 'vowel', 'teacher');
