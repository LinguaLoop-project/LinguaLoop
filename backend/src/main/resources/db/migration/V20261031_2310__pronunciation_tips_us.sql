-- =============================================================================
-- Mẹo sửa âm theo giọng Mỹ (ADR 0007). Bảng phonemes đã chuyển sang ký hiệu Mỹ (V20261031_2300), nên:
--   1. ký hiệu trong lời mẹo đổi theo (/iː/ thành /i/, /e/ thành /ɛ/...);
--   2. mẹo của nguyên âm đôi và âm r soạn theo giọng Anh (không có âm r ở cuối) được viết lại.
-- =============================================================================

UPDATE phoneme_confusions
SET tip_vi = replace(replace(replace(replace(replace(replace(replace(tip_vi,
        '/iː/', '/i/'), '/uː/', '/u/'), '/ɑː/', '/ɑ/'), '/ɔː/', '/ɔ/'), '/ɜː/', '/ɝ/'), '/e/', '/ɛ/'), '/r/', '/ɹ/')
WHERE l1 = 'vi';

UPDATE phoneme_confusions c SET tip_vi = t.tip
FROM phonemes p
JOIN (VALUES
    ('ɝ',  'Giống "ơ" tiếng Việt nhưng uốn lưỡi về phía sau ngay từ đầu âm, không chạm vòm miệng; gặp ở ir, er, ur (bird, her, turn).'),
    ('oʊ', 'Bắt đầu gần "ô" rồi tròn môi dần về /ʊ/, giống "âu" nhưng tròn môi hơn; đừng đọc thành "ô" đơn (coat khác caught).'),
    ('ɪɹ', 'Đọc /ɪ/ rồi uốn lưỡi thành âm r ở cuối, không đọc thành "ia" (near, here).'),
    ('ɛɹ', 'Đọc /ɛ/ rồi uốn lưỡi thành âm r ở cuối, không đọc thành "e-ơ" (hair, care).'),
    ('ʊɹ', 'Đọc /ʊ/ rồi uốn lưỡi thành âm r ở cuối, không đọc thành "ua" (tour, sure).'),
    ('ɑ',  'Giống "a" tiếng Việt kéo dài, miệng mở rộng, lưỡi thấp và lùi về sau (car, father, hot).'),
    ('ɔ',  'Giống "o" tiếng Việt kéo dài, môi tròn, lưỡi lùi về sau (saw, thought); không thêm âm lướt phía sau.'),
    ('ə',  'Âm yếu và ngắn nhất, giống "ơ" rất nhẹ, miệng thả lỏng; chỉ ở âm tiết không nhấn (about, support), đừng đọc rõ như nguyên âm đầy đủ.')
) AS t(symbol, tip) ON t.symbol = p.symbol
WHERE c.target_phoneme_id = p.id AND c.l1 = 'vi' AND c.produced_phoneme_id IS NULL;

INSERT INTO phoneme_confusions (l1, target_phoneme_id, produced_phoneme_id, category_id, tip_vi)
SELECT 'vi', p.id, NULL, ec.id,
       'Âm "ơ" nhẹ có uốn lưỡi, ở âm tiết không nhấn và cuối từ (teacher, deliver); đừng đọc thành "ơ" trơn.'
FROM phonemes p
JOIN error_categories ec ON ec.code = 'pron.vowel_substitution'
WHERE p.symbol = 'ɚ';
