-- =============================================================================
-- Mẹo sửa phát âm cho 30 âm còn lại (14 âm đầu ở V20261019_1400), nên bảng mẹo phủ đủ 44 âm của bảng phonemes.
-- Soạn từ description_vi ở V2__seed_reference_data.sql, rút còn một hai câu và BỎ các câu nói riêng về giọng Anh
-- ("Kiểu Anh-Anh không đọc /r/ ...") vì có thể trái với bài giọng Mỹ (ADR 0005). Mỗi mẹo là mẹo chung theo ÂM ĐÍCH
-- (produced_phoneme_id NULL), gán nhóm lỗi gần nhất.
-- CẦN NGƯỜI CÓ CHUYÊN MÔN NGỮ ÂM DUYỆT TRƯỚC KHI DÙNG CHO NGƯỜI HỌC (nội dung do AI rút gọn).
-- =============================================================================

INSERT INTO phoneme_confusions (l1, target_phoneme_id, produced_phoneme_id, category_id, tip_vi)
SELECT 'vi', p.id, NULL, c.id, t.tip_vi
FROM (VALUES
    -- Phụ âm: âm cuối hay bị bỏ
    ('p',  'pron.final_consonant',        'Ở cuối từ (stop, map) vẫn phải khép môi rồi bật nhẹ hơi, đừng bỏ âm.'),
    ('b',  'pron.final_consonant',        'Hai môi mím rồi mở ra và rung dây thanh; ở cuối từ (job, rub) đừng đọc thành /p/ hay bỏ âm.'),
    ('k',  'pron.final_consonant',        'Cuống lưỡi chạm ngạc mềm rồi bật hơi rõ; ở cuối từ (book, like) đừng nuốt âm như "c" cuối tiếng Việt.'),
    ('g',  'pron.final_consonant',        'Cuống lưỡi chạm ngạc mềm và rung dây thanh, đừng đọc thành "gh" xát; ở cuối từ (big, dog) phải rõ.'),
    ('m',  'pron.final_consonant',        'Hai môi khép hẳn, hơi thoát qua mũi; ở cuối từ (time, come) phải khép môi.'),
    ('n',  'pron.final_consonant',        'Đầu lưỡi chạm lợi trên, hơi thoát qua mũi; ở cuối từ (nine, sun) đừng đọc thành /ŋ/ ("ng").'),
    ('ŋ',  'pron.final_consonant',        'Giống "ng" tiếng Việt: cuống lưỡi chạm ngạc mềm, hơi thoát qua mũi; ở -ing đừng thêm /k/ hay /g/ phía sau.'),
    -- Phụ âm: dễ bị thay bằng âm khác
    ('f',  'pron.consonant_substitution', 'Răng cửa trên chạm nhẹ môi dưới rồi đẩy hơi ra, không rung dây thanh; đừng đọc thành /v/ và ở cuối từ (laugh, life) đừng bỏ âm.'),
    ('h',  'pron.consonant_substitution', 'Miệng mở sẵn theo nguyên âm sau rồi đẩy hơi nhẹ từ họng ra, nhẹ hơn "h" tiếng Việt.'),
    ('tʃ', 'pron.consonant_substitution', 'Bắt đầu như /t/ rồi chuyển ngay sang /ʃ/, môi chu tròn; khác "ch" tiếng Việt, và ở cuối từ (watch, much) phải rõ.'),
    ('dʒ', 'pron.consonant_substitution', 'Bắt đầu như /d/ rồi chuyển sang /ʒ/, môi chu và rung dây thanh; đừng đọc thành "gi" hay "d" tiếng Việt.'),
    ('j',  'pron.consonant_substitution', 'Mặt lưỡi nâng gần ngạc cứng rồi lướt nhanh sang nguyên âm sau; đừng nhầm với "j" của jam (là /dʒ/).'),
    ('w',  'pron.consonant_substitution', 'Môi tròn chu ra như /uː/ rồi mở nhanh sang nguyên âm sau, giống "qu" hay "oa"; đừng đọc thành /v/ (wine khác vine).'),
    -- Nguyên âm đơn
    ('e',  'pron.vowel_substitution',     'Giống "e" tiếng Việt nhưng miệng hẹp hơn một chút, đọc gọn; phân biệt với /æ/ (bed khác bad).'),
    ('ʌ',  'pron.vowel_substitution',     'Giống "ă" tiếng Việt: miệng mở vừa, môi thả lỏng, đọc dứt khoát; phân biệt với /ɑː/ (cut khác cart) và /æ/ (cup khác cap).'),
    ('ɑː', 'pron.vowel_substitution',     'Giống "a" tiếng Việt kéo dài, miệng mở rộng, lưỡi thấp và lùi về sau.'),
    ('ɒ',  'pron.vowel_substitution',     'Giống "o" tiếng Việt nhưng ngắn, miệng mở rộng, môi hơi tròn; phân biệt với /ɔː/ dài (cot khác caught).'),
    ('ɔː', 'pron.vowel_substitution',     'Giống "o" tiếng Việt kéo dài, môi tròn và chu hơn /ɒ/, lưỡi lùi sau; không thêm âm lướt phía sau.'),
    ('ʊ',  'pron.vowel_substitution',     'Giống "ư" pha "u" tiếng Việt, môi hơi tròn nhưng thả lỏng, đọc gọn; phân biệt với /uː/ dài (full khác fool).'),
    ('uː', 'pron.vowel_substitution',     'Giống "u" tiếng Việt kéo dài, môi tròn và chu ra nhiều, lưỡi nâng cao về sau.'),
    ('ɜː', 'pron.vowel_substitution',     'Giống "ơ" tiếng Việt kéo dài, môi thả lỏng không tròn; hay gặp ở ir, er, ur (girl, her, turn).'),
    ('ə',  'pron.vowel_substitution',     'Âm yếu và ngắn nhất, giống "ơ" rất nhẹ, miệng thả lỏng; chỉ ở âm tiết không nhấn (about, teacher), đừng đọc rõ như nguyên âm đầy đủ.'),
    -- Nguyên âm đôi
    ('eɪ', 'pron.vowel_substitution',     'Trượt từ /e/ sang /ɪ/, giống "ây" tiếng Việt; phải có đủ phần trượt, đừng đọc thành "e" đơn (late khác let).'),
    ('aɪ', 'pron.vowel_substitution',     'Trượt từ "a" mở rộng sang /ɪ/, giống "ai" tiếng Việt; khi có phụ âm cuối (time, like) vẫn giữ phụ âm cuối.'),
    ('ɔɪ', 'pron.vowel_substitution',     'Trượt từ /ɔː/ môi tròn sang /ɪ/, giống "oi" tiếng Việt.'),
    ('aʊ', 'pron.vowel_substitution',     'Trượt từ "a" sang /ʊ/, môi tròn dần, giống "ao" tiếng Việt.'),
    ('əʊ', 'pron.vowel_substitution',     'Trượt từ /ə/ sang /ʊ/, môi tròn dần, giống "âu" tiếng Việt; đừng đọc thành "ô" đơn (coat khác caught).'),
    ('ɪə', 'pron.vowel_substitution',     'Trượt từ /ɪ/ sang /ə/, giống "ia" tiếng Việt.'),
    ('eə', 'pron.vowel_substitution',     'Trượt từ /e/ sang /ə/, giống "e-ơ" liền nhau.'),
    ('ʊə', 'pron.vowel_substitution',     'Trượt từ /ʊ/ sang /ə/, giống "ua" tiếng Việt.')
) AS t(symbol, category_code, tip_vi)
JOIN phonemes p ON p.symbol = t.symbol
JOIN error_categories c ON c.code = t.category_code
ON CONFLICT DO NOTHING;
