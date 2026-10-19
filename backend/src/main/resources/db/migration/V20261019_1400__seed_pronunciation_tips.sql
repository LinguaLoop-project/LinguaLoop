-- =============================================================================
-- Mẹo sửa phát âm cho người Việt (shadowing, lát B).
-- Mỗi dòng là một mẹo theo ÂM ĐÍCH (produced_phoneme_id NULL): khi học viên đọc âm đó dưới 60 điểm thì
-- hiện mẹo này. Nội dung lấy từ TipCatalog của azure-pronunciation-demo, khoá chuyển từ ký hiệu IPA của Azure
-- sang ký hiệu của bảng phonemes (ADR 0004): i -> iː, ɹ -> r.
-- Chưa có mẹo riêng cho cặp "đọc A thành B": Azure không trả âm bị nhầm thành gì.
-- =============================================================================

INSERT INTO phoneme_confusions (l1, target_phoneme_id, produced_phoneme_id, category_id, tip_vi)
SELECT 'vi', p.id, NULL, c.id, t.tip_vi
FROM (VALUES
    ('θ',  'pron.consonant_substitution', 'Đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi ra nhẹ, không bật lưỡi như âm "t" tiếng Việt.'),
    ('ð',  'pron.consonant_substitution', 'Đặt đầu lưỡi giữa hai hàm răng như /θ/ nhưng rung dây thanh, đừng đọc thành "đ".'),
    ('ʃ',  'pron.consonant_substitution', 'Tròn môi, đẩy môi ra trước, lưỡi lùi vào trong rồi thổi hơi: "sh" chứ không phải "x".'),
    ('ʒ',  'pron.consonant_substitution', 'Khẩu hình như /ʃ/ nhưng rung dây thanh, giống "gi" kéo dài và mềm.'),
    ('z',  'pron.consonant_substitution', 'Âm /z/ phải rung dây thanh như tiếng ong "zzz", đừng đọc thành /s/ hay "d".'),
    ('v',  'pron.consonant_substitution', 'Răng trên chạm nhẹ môi dưới rồi rung, đừng đọc thành "d" hay /j/.'),
    ('r',  'pron.consonant_substitution', 'Cong lưỡi lùi vào trong, không chạm vòm miệng và không rung lưỡi như "r" tiếng Việt.'),
    ('s',  'pron.final_consonant',        'Ở cuối từ phải bật rõ hơi "xì" nhẹ, đừng nuốt mất âm cuối.'),
    ('t',  'pron.final_consonant',        'Ở cuối từ phải chạm đầu lưỡi lên lợi trên rồi bật nhẹ, đừng bỏ mất âm cuối.'),
    ('d',  'pron.final_consonant',        'Ở cuối từ phải chạm đầu lưỡi lên lợi trên và rung dây thanh, đừng đọc thành /t/ hay bỏ mất.'),
    ('l',  'pron.final_consonant',        'Ở cuối từ, đầu lưỡi vẫn phải chạm lợi trên, đừng đọc thành "u" hay bỏ mất.'),
    ('ɪ',  'pron.vowel_substitution',     'Âm /ɪ/ ngắn và thả lỏng, miệng hơi mở hơn "i" tiếng Việt: ship khác sheep.'),
    ('iː', 'pron.vowel_substitution',     'Âm /iː/ dài và căng, kéo môi sang hai bên như đang cười: sheep khác ship.'),
    ('æ',  'pron.vowel_substitution',     'Mở miệng rộng, hạ hàm dưới, âm nằm giữa "e" và "a" tiếng Việt.')
) AS t(symbol, category_code, tip_vi)
JOIN phonemes p ON p.symbol = t.symbol
JOIN error_categories c ON c.code = t.category_code
ON CONFLICT DO NOTHING;
