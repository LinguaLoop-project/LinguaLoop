-- =============================================================================
-- 1. THAM CHIẾU NGỮ ÂM & PHÂN LOẠI LỖI (dữ liệu tĩnh do biên tập, ít thay đổi)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- phonemes
-- CHỨC NĂNG: 44 âm vị tiếng Anh (Anh-Anh): 24 phụ âm, 12 nguyên âm đơn, 8 nguyên âm đôi,
-- kèm từ ví dụ, hướng dẫn phát âm và video khẩu hình.
-- -----------------------------------------------------------------------------
INSERT INTO phonemes (symbol, kind, example_word, description_vi, mouth_video_url, is_pro_content) VALUES
    -- Phụ âm tắc (plosive)
    ('p',  'consonant', 'pen',     'Âm vô thanh. Hai môi mím chặt rồi bật mạnh hơi ra; đặt tờ giấy trước miệng sẽ thấy giấy rung. Ở cuối từ (stop, map) vẫn phải khép môi, không được bỏ.', 'https://youtu.be/AZRREr7DqqM', true),
    ('b',  'consonant', 'bad',     'Âm hữu thanh, cặp với /p/. Hai môi mím rồi mở ra, dây thanh rung, hơi bật nhẹ. Ở cuối từ (job, rub) cần khép môi rõ, tránh đọc thành /p/ hoặc bỏ âm.', 'https://youtu.be/yP7aCKO6bTE', true),
    ('t',  'consonant', 'tea',     'Âm vô thanh. Đầu lưỡi chạm lợi trên (sau răng cửa trên) rồi bật hơi mạnh. Khác "t" tiếng Việt (không bật hơi) — gần với "th" hơn. Không được bỏ /t/ cuối từ (cat, want).', 'https://youtu.be/0T1QYByMxrs', true),
    ('d',  'consonant', 'did',     'Âm hữu thanh, cặp với /t/. Đầu lưỡi chạm lợi trên, dây thanh rung. Khác "đ" tiếng Việt (lưỡi chạm răng, có hút vào). Chú ý /d/ cuối từ và đuôi -ed (played).', 'https://youtu.be/qA5ZYC89oso', true),
    ('k',  'consonant', 'cat',     'Âm vô thanh. Cuống lưỡi chạm ngạc mềm rồi bật hơi mạnh. Ở cuối từ (book, like) phải phát ra rõ, không nuốt âm như "c" cuối tiếng Việt.', 'https://youtu.be/d1jyIpAmLe8', true),
    ('g',  'consonant', 'get',     'Âm hữu thanh, cặp với /k/. Cuống lưỡi chạm ngạc mềm, dây thanh rung, bật hơi nhẹ. Tránh đọc thành "gh" xát của tiếng Việt; cuối từ (big, dog) phải rõ.', 'https://youtu.be/9eAqj9EfeK0', true),

    -- Phụ âm xát (fricative)
    ('f',  'consonant', 'fish',    'Âm vô thanh. Răng cửa trên chạm nhẹ môi dưới, đẩy hơi thoát qua khe hẹp. Ở cuối từ (laugh, life) giữ luồng hơi, đừng bỏ âm.', 'https://youtu.be/vE12RFyH-hY', true),
    ('v',  'consonant', 'van',     'Âm hữu thanh, cặp với /f/. Răng trên chạm môi dưới, dây thanh rung. Ở cuối từ (love, five) vẫn phải rung, không đọc thành /f/ hay bỏ âm.', 'https://youtu.be/mO04G0v5a_c', true),
    ('θ',  'consonant', 'think',   'Âm vô thanh. Đầu lưỡi đặt nhẹ giữa hai hàm răng, thổi hơi qua khe lưỡi-răng. Người Việt hay đọc thành "th" hoặc /t/, /s/ — phải thấy đầu lưỡi thò ra.', 'https://youtu.be/b4Aj3k65HSo', true),
    ('ð',  'consonant', 'this',    'Âm hữu thanh, cặp với /θ/. Đầu lưỡi giữa hai hàm răng, dây thanh rung. Người Việt hay đọc thành "đ" hoặc /d/, /z/ — giữ lưỡi giữa răng và rung cổ họng.', 'https://youtu.be/tu1t3Fn5Lw8', true),
    ('s',  'consonant', 'see',     'Âm vô thanh. Đầu lưỡi gần lợi trên, hơi thoát qua rãnh hẹp tạo tiếng xì. Đặc biệt quan trọng ở đuôi -s số nhiều / ngôi thứ ba (cats, works) — không được bỏ.', 'https://youtu.be/QtH3vRXmvvo', true),
    ('z',  'consonant', 'zoo',     'Âm hữu thanh, cặp với /s/. Vị trí như /s/ nhưng dây thanh rung (như tiếng ong vo ve). Đuôi -s sau âm hữu thanh đọc là /z/ (dogs, plays); tránh đọc thành "d" hay "gi".', 'https://youtu.be/o1ZvmX80t7Q', true),
    ('ʃ',  'consonant', 'she',     'Âm vô thanh. Lưỡi lùi sau lợi, môi hơi tròn và chu ra, thổi hơi (như "suỵt"). Tránh đọc thành /s/; cuối từ (fish, wash) phải giữ luồng hơi.', 'https://youtu.be/NF92RdZC6wE', true),
    ('ʒ',  'consonant', 'vision',  'Âm hữu thanh, cặp với /ʃ/. Vị trí như /ʃ/, môi chu tròn, dây thanh rung. Hay gặp ở -sion, -sure (measure, usual); tránh đọc thành "gi" hay /z/.', 'https://youtu.be/bTxeAiBF61I', true),
    ('h',  'consonant', 'hat',     'Âm vô thanh. Miệng mở sẵn theo nguyên âm sau, đẩy hơi nhẹ từ họng ra. Nhẹ hơn "h" tiếng Việt; câm trong một số từ (hour, honest).', 'https://www.youtube.com/watch?v=QxQUapA-2w4', true),

    -- Phụ âm tắc xát (affricate)
    ('tʃ', 'consonant', 'chair',   'Âm vô thanh. Bắt đầu như /t/ (lưỡi chạm lợi) rồi chuyển ngay sang /ʃ/, môi chu tròn, bật hơi mạnh. Khác "ch" tiếng Việt (không chu môi); cuối từ (watch, much) phải rõ.', 'https://youtu.be/PykxZ5kkrjs', true),
    ('dʒ', 'consonant', 'jam',     'Âm hữu thanh, cặp với /tʃ/. Bắt đầu như /d/ rồi chuyển sang /ʒ/, môi chu, dây thanh rung. Tránh đọc thành "gi" hay "d" tiếng Việt; cuối từ (page, bridge) phải rõ.', 'https://youtu.be/0IeQmGdo7gQ', true),

    -- Phụ âm mũi (nasal)
    ('m',  'consonant', 'man',     'Âm hữu thanh. Hai môi khép, hơi thoát qua mũi. Ở cuối từ (time, come) phải khép môi hẳn.', 'https://www.youtube.com/watch?v=QxQUapA-2w4', true),
    ('n',  'consonant', 'no',      'Âm hữu thanh. Đầu lưỡi chạm lợi trên, hơi thoát qua mũi. Ở cuối từ (nine, sun) đầu lưỡi phải chạm lợi, tránh đọc thành /ŋ/ ("ng").', 'https://www.youtube.com/watch?v=QxQUapA-2w4', true),
    ('ŋ',  'consonant', 'sing',    'Âm hữu thanh, giống "ng" tiếng Việt: cuống lưỡi chạm ngạc mềm, hơi thoát qua mũi. Không bao giờ đứng đầu từ; ở -ing không thêm /k/ hay /g/ phía sau.', 'https://www.youtube.com/watch?v=QxQUapA-2w4', true),

    -- Phụ âm tiếp cận (approximant)
    ('l',  'consonant', 'leg',     'Âm hữu thanh. Đầu lưỡi chạm lợi trên, hơi thoát hai bên lưỡi. Ở cuối từ (feel, ball) là "dark L": cuống lưỡi nâng lên, không được bỏ hay đọc thành "u"/"ô".', 'https://www.youtube.com/watch?v=QxQUapA-2w4', true),
    ('r',  'consonant', 'red',     'Âm hữu thanh. Đầu lưỡi cong lên phía sau nhưng không chạm vòm miệng, môi hơi tròn. Không rung lưỡi như "r" tiếng Việt, không đọc thành "z"/"gi".', 'https://www.youtube.com/watch?v=QxQUapA-2w4', true),
    ('j',  'consonant', 'yes',     'Âm hữu thanh (bán nguyên âm), giống "d" đọc giọng miền Nam: mặt lưỡi nâng gần ngạc cứng rồi lướt nhanh sang nguyên âm sau. Không nhầm ký hiệu với chữ "j" (jam là /dʒ/).', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=4490s', true),
    ('w',  'consonant', 'wet',     'Âm hữu thanh (bán nguyên âm). Môi tròn chu ra như /uː/ rồi mở nhanh sang nguyên âm sau, giống "qu"/"oa" tiếng Việt. Tránh đọc thành /v/ (wine ≠ vine).', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=4367s', true),

    -- Nguyên âm đơn
    ('iː', 'vowel',     'see',     'Nguyên âm dài. Giống "i" tiếng Việt nhưng kéo dài, môi dẹt sang hai bên như đang cười, lưỡi nâng cao. Phân biệt với /ɪ/ ngắn (sheep ≠ ship).', 'https://youtu.be/RZmGzSb-6OM', true),
    ('ɪ',  'vowel',     'sit',     'Nguyên âm ngắn. Giữa "i" và "ê" tiếng Việt, đọc dứt khoát, lưỡi thấp hơn /iː/, môi thả lỏng. Không kéo dài thành /iː/.', 'https://youtu.be/TNFKG0yvDx4', true),
    ('e',  'vowel',     'bed',     'Nguyên âm ngắn. Giống "e" tiếng Việt nhưng miệng hẹp hơn một chút (giữa "e" và "ê"), đọc gọn. Phân biệt với /æ/ (bed ≠ bad).', 'https://youtu.be/hLN1cdSTDo8', true),
    ('æ',  'vowel',     'cat',     'Nguyên âm ngắn. Miệng mở rộng, hàm hạ thấp, môi kéo dẹt sang hai bên, lưỡi thấp; nghe giữa "e" và "a". Tránh đọc thành "e" hoặc "a" tiếng Việt.', 'https://youtu.be/qVhaIHk88a8', true),
    ('ʌ',  'vowel',     'cup',     'Nguyên âm ngắn. Giống "ă" tiếng Việt: miệng mở vừa, lưỡi ở giữa, môi thả lỏng, đọc dứt khoát. Phân biệt với /ɑː/ (cut ≠ cart) và /æ/ (cup ≠ cap).', 'https://youtu.be/PZwKFFp7V50', true),
    ('ɑː', 'vowel',     'car',     'Nguyên âm dài. Giống "a" tiếng Việt kéo dài, miệng mở rộng, lưỡi thấp và lùi về sau. Kiểu Anh-Anh không đọc /r/ sau nó (car, start).', 'https://youtu.be/uDHMuMQdBNw', true),
    ('ɒ',  'vowel',     'hot',     'Nguyên âm ngắn. Giống "o" tiếng Việt nhưng ngắn, miệng mở rộng, môi hơi tròn. Phân biệt với /ɔː/ dài (cot ≠ caught).', 'https://youtu.be/MAk-XtHsyzM', true),
    ('ɔː', 'vowel',     'saw',     'Nguyên âm dài. Giống "o" tiếng Việt kéo dài, môi tròn và chu hơn /ɒ/, lưỡi lùi sau. Không thêm âm lướt phía sau.', 'https://youtu.be/KHllC40_u1Q', true),
    ('ʊ',  'vowel',     'book',    'Nguyên âm ngắn. Giống "ư" pha "u" tiếng Việt, môi hơi tròn nhưng thả lỏng, đọc gọn. Phân biệt với /uː/ dài (full ≠ fool).', 'https://youtu.be/eJ7dM_LU9t4', true),
    ('uː', 'vowel',     'food',    'Nguyên âm dài. Giống "u" tiếng Việt kéo dài, môi tròn và chu ra nhiều, lưỡi nâng cao về sau.', 'https://youtu.be/mnKEGLuEzV4', true),
    ('ɜː', 'vowel',     'bird',    'Nguyên âm dài. Giống "ơ" tiếng Việt kéo dài, lưỡi ở giữa, môi thả lỏng không tròn. Hay gặp ở ir/er/ur (girl, her, turn); không đọc thành "ơ" ngắn.', 'https://youtu.be/zSJJWHymEPw', true),
    ('ə',  'vowel',     'about',   'Âm schwa — nguyên âm yếu, ngắn nhất, giống "ơ" rất nhẹ, miệng và lưỡi thả lỏng. Chỉ xuất hiện ở âm tiết không nhấn (about, teacher, the); đọc rõ nó làm mất nhịp tiếng Anh.', 'https://youtu.be/wg0P0oYkniE', true),

    -- Nguyên âm đôi
    ('eɪ', 'diphthong', 'day',     'Nguyên âm đôi: trượt từ /e/ sang /ɪ/, giống "ây" tiếng Việt. Phải có đủ phần trượt, tránh đọc thành "e" đơn (late ≠ let).', 'https://youtu.be/5FMPlqlFt9g', true),
    ('aɪ', 'diphthong', 'my',      'Nguyên âm đôi: trượt từ "a" mở rộng sang /ɪ/, giống "ai" tiếng Việt. Khi có phụ âm cuối (time, like) phải giữ cả phụ âm cuối.', 'https://youtu.be/Hb8COxAtl14', true),
    ('ɔɪ', 'diphthong', 'boy',     'Nguyên âm đôi: trượt từ /ɔː/ môi tròn sang /ɪ/, giống "oi" tiếng Việt.', 'https://youtu.be/lFRrEI85IcM', true),
    ('aʊ', 'diphthong', 'now',     'Nguyên âm đôi: trượt từ "a" sang /ʊ/, môi tròn dần, giống "ao" tiếng Việt.', 'https://youtu.be/9WDnVMQIaTs', true),
    ('əʊ', 'diphthong', 'go',      'Nguyên âm đôi: trượt từ /ə/ sang /ʊ/, môi tròn dần, giống "âu" tiếng Việt (kiểu Anh-Anh). Tránh đọc thành "ô" đơn (coat ≠ caught).', 'https://youtu.be/r1BRCG0P9C8', true),
    ('ɪə', 'diphthong', 'near',    'Nguyên âm đôi: trượt từ /ɪ/ sang /ə/, giống "ia" tiếng Việt. Kiểu Anh-Anh không đọc /r/ cuối (here, beer).', 'https://youtu.be/vC0h4S0YPJc', true),
    ('eə', 'diphthong', 'hair',    'Nguyên âm đôi: trượt từ /e/ sang /ə/, giống "e-ơ" liền nhau. Kiểu Anh-Anh không đọc /r/ cuối (care, where).', 'https://youtu.be/0J7-5maJJIk', true),
    ('ʊə', 'diphthong', 'tour',    'Nguyên âm đôi: trượt từ /ʊ/ sang /ə/, giống "ua" tiếng Việt. Nhiều người Anh hiện đọc thành /ɔː/ (sure, poor).', 'https://youtu.be/nHSqluHrD-U', true);

-- -----------------------------------------------------------------------------
-- error_categories
-- CHỨC NĂNG: nhóm lỗi dictation đủ 6 loại từ × 3 kiểu lỗi = 18 nhóm, cộng 3 nhóm lỗi phát âm
-- tổng quát cho shadowing. Nhóm 'other' (thán từ, từ đệm...) ít giá trị luyện tập nên tắt sẵn,
-- vẫn giữ để lỗi không bị rơi ra ngoài.
-- -----------------------------------------------------------------------------
INSERT INTO error_categories (code, skill, name_vi, word_class, outcome, is_active) VALUES
    ('dict.function_omitted',      'dictation', 'Bỏ sót từ chức năng (the, a, to, of...)',        'function',  'omitted',     true),
    ('dict.function_substituted',  'dictation', 'Nhầm từ chức năng (a/the, in/on, can/can''t)',   'function',  'substituted', true),
    ('dict.function_misspelled',   'dictation', 'Sai chính tả từ chức năng (their/there...)',      'function',  'misspelled',  true),
    ('dict.content_omitted',       'dictation', 'Bỏ sót từ nội dung',                              'content',   'omitted',     true),
    ('dict.content_substituted',   'dictation', 'Nhầm từ nội dung (đồng âm, gần âm)',              'content',   'substituted', true),
    ('dict.content_misspelled',    'dictation', 'Sai chính tả từ nội dung',                        'content',   'misspelled',  true),
    ('dict.inflected_omitted',     'dictation', 'Bỏ sót từ có biến đổi hình thái',                 'inflected', 'omitted',     true),
    ('dict.inflected_substituted', 'dictation', 'Sai đuôi từ (-s, -ed, -ing)',                     'inflected', 'substituted', true),
    ('dict.inflected_misspelled',  'dictation', 'Sai chính tả dạng biến đổi (stoped, studys...)',  'inflected', 'misspelled',  true),
    ('dict.number_omitted',        'dictation', 'Bỏ sót số',                                       'number',    'omitted',     true),
    ('dict.number_substituted',    'dictation', 'Nghe nhầm số (fifteen/fifty, thirteen/thirty)',   'number',    'substituted', true),
    ('dict.number_misspelled',     'dictation', 'Viết sai số (forty/fourty, ninth/nineth)',        'number',    'misspelled',  true),
    ('dict.proper_omitted',        'dictation', 'Bỏ sót tên riêng',                                'proper',    'omitted',     true),
    ('dict.proper_substituted',    'dictation', 'Nghe nhầm tên riêng',                             'proper',    'substituted', true),
    ('dict.proper_misspelled',     'dictation', 'Viết sai tên riêng',                              'proper',    'misspelled',  true),
    ('dict.other_omitted',         'dictation', 'Bỏ sót từ khác (thán từ, từ đệm)',                'other',     'omitted',     false),
    ('dict.other_substituted',     'dictation', 'Nhầm từ khác (thán từ, từ đệm)',                  'other',     'substituted', false),
    ('dict.other_misspelled',      'dictation', 'Sai chính tả từ khác (thán từ, từ đệm)',          'other',     'misspelled',  false);
INSERT INTO error_categories (code, skill, name_vi) VALUES
    ('pron.final_consonant',        'shadowing', 'Rụng phụ âm cuối'),
    ('pron.consonant_substitution', 'shadowing', 'Thay phụ âm bằng âm khác'),
    ('pron.vowel_substitution',     'shadowing', 'Nhầm nguyên âm (dài/ngắn, mở/khép)');


-- =============================================================================
-- 2. GÓI FREE/PRO VÀ GIỚI HẠN SỬ DỤNG
-- =============================================================================

-- -----------------------------------------------------------------------------
-- plan_limits
-- CHỨC NĂNG: hạn mức theo gói và tính năng (NULL = không giới hạn, 0 = không được dùng).
-- GIÁ TRỊ TẠM, cần chỉnh theo chi phí Azure/LLM thực tế.
-- -----------------------------------------------------------------------------
INSERT INTO plan_limits (plan, feature, period, limit_value) VALUES
    ('free', 'shadowing_assess', 'day',  5),
    ('free', 'ai_feedback',      'day',  0),
    ('free', 'mouth_video',      'none', 0),
    ('free', 'weakness_full',    'none', 0),
    ('pro',  'shadowing_assess', 'day',  200),
    ('pro',  'ai_feedback',      'day',  100),
    ('pro',  'mouth_video',      'none', NULL),
    ('pro',  'weakness_full',    'none', NULL);
