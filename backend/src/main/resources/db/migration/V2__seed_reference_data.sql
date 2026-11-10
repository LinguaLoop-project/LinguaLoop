-- =============================================================================
-- Dữ liệu tham chiếu và tài khoản dev (schema MVP).
-- Từ điển và 9 bộ từ hệ thống nạp bằng script riêng (backend/seed), không nằm trong Flyway.
-- =============================================================================

-- 44 âm vị tiếng Anh giọng Mỹ, ký hiệu giống Azure en-US. tip_vi = mẹo sửa cho người Việt.
INSERT INTO phonemes (symbol, kind, example_word, tip_vi, mouth_video_url) VALUES
    ('p', 'consonant', 'pen', 'Ở cuối từ (stop, map) vẫn phải khép môi rồi bật nhẹ hơi, đừng bỏ âm.', 'https://youtu.be/AZRREr7DqqM'),
    ('b', 'consonant', 'bad', 'Hai môi mím rồi mở ra và rung dây thanh; ở cuối từ (job, rub) đừng đọc thành /p/ hay bỏ âm.', 'https://youtu.be/yP7aCKO6bTE'),
    ('t', 'consonant', 'tea', 'Ở cuối từ phải chạm đầu lưỡi lên lợi trên rồi bật nhẹ, đừng bỏ mất âm cuối.', 'https://youtu.be/0T1QYByMxrs'),
    ('d', 'consonant', 'did', 'Ở cuối từ phải chạm đầu lưỡi lên lợi trên và rung dây thanh, đừng đọc thành /t/ hay bỏ mất.', 'https://youtu.be/qA5ZYC89oso'),
    ('k', 'consonant', 'cat', 'Cuống lưỡi chạm ngạc mềm rồi bật hơi rõ; ở cuối từ (book, like) đừng nuốt âm như "c" cuối tiếng Việt.', 'https://youtu.be/d1jyIpAmLe8'),
    ('g', 'consonant', 'get', 'Cuống lưỡi chạm ngạc mềm và rung dây thanh, đừng đọc thành "gh" xát; ở cuối từ (big, dog) phải rõ.', 'https://youtu.be/9eAqj9EfeK0'),
    ('f', 'consonant', 'fish', 'Răng cửa trên chạm nhẹ môi dưới rồi đẩy hơi ra, không rung dây thanh; đừng đọc thành /v/ và ở cuối từ (laugh, life) đừng bỏ âm.', 'https://youtu.be/vE12RFyH-hY'),
    ('v', 'consonant', 'van', 'Răng trên chạm nhẹ môi dưới rồi rung, đừng đọc thành "d" hay /j/.', 'https://youtu.be/mO04G0v5a_c'),
    ('θ', 'consonant', 'think', 'Đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi ra nhẹ, không bật lưỡi như âm "t" tiếng Việt.', 'https://youtu.be/b4Aj3k65HSo'),
    ('ð', 'consonant', 'this', 'Đặt đầu lưỡi giữa hai hàm răng như /θ/ nhưng rung dây thanh, đừng đọc thành "đ".', 'https://youtu.be/tu1t3Fn5Lw8'),
    ('s', 'consonant', 'see', 'Ở cuối từ phải bật rõ hơi "xì" nhẹ, đừng nuốt mất âm cuối.', 'https://youtu.be/QtH3vRXmvvo'),
    ('z', 'consonant', 'zoo', 'Âm /z/ phải rung dây thanh như tiếng ong "zzz", đừng đọc thành /s/ hay "d".', 'https://youtu.be/o1ZvmX80t7Q'),
    ('ʃ', 'consonant', 'she', 'Tròn môi, đẩy môi ra trước, lưỡi lùi vào trong rồi thổi hơi: "sh" chứ không phải "x".', 'https://youtu.be/NF92RdZC6wE'),
    ('ʒ', 'consonant', 'vision', 'Khẩu hình như /ʃ/ nhưng rung dây thanh, giống "gi" kéo dài và mềm.', 'https://youtu.be/bTxeAiBF61I'),
    ('h', 'consonant', 'hat', 'Miệng mở sẵn theo nguyên âm sau rồi đẩy hơi nhẹ từ họng ra, nhẹ hơn "h" tiếng Việt.', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3879s'),
    ('tʃ', 'consonant', 'chair', 'Bắt đầu như /t/ rồi chuyển ngay sang /ʃ/, môi chu tròn; khác "ch" tiếng Việt, và ở cuối từ (watch, much) phải rõ.', 'https://youtu.be/PykxZ5kkrjs'),
    ('dʒ', 'consonant', 'jam', 'Bắt đầu như /d/ rồi chuyển sang /ʒ/, môi chu và rung dây thanh; đừng đọc thành "gi" hay "d" tiếng Việt.', 'https://youtu.be/0IeQmGdo7gQ'),
    ('m', 'consonant', 'man', 'Hai môi khép hẳn, hơi thoát qua mũi; ở cuối từ (time, come) phải khép môi.', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3506s'),
    ('n', 'consonant', 'no', 'Đầu lưỡi chạm lợi trên, hơi thoát qua mũi; ở cuối từ (nine, sun) đừng đọc thành /ŋ/ ("ng").', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3625s'),
    ('ŋ', 'consonant', 'sing', 'Giống "ng" tiếng Việt: cuống lưỡi chạm ngạc mềm, hơi thoát qua mũi; ở -ing đừng thêm /k/ hay /g/ phía sau.', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3750s'),
    ('l', 'consonant', 'leg', 'Ở cuối từ, đầu lưỡi vẫn phải chạm lợi trên, đừng đọc thành "u" hay bỏ mất.', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3945s'),
    ('ɹ', 'consonant', 'red', 'Cong lưỡi lùi vào trong, không chạm vòm miệng và không rung lưỡi như "r" tiếng Việt.', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=4160s'),
    ('j', 'consonant', 'yes', 'Mặt lưỡi nâng gần ngạc cứng rồi lướt nhanh sang nguyên âm sau; đừng nhầm với "j" của jam (là /dʒ/).', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=4490s'),
    ('w', 'consonant', 'wet', 'Môi tròn chu ra như /u/ rồi mở nhanh sang nguyên âm sau, giống "qu" hay "oa"; đừng đọc thành /v/ (wine khác vine).', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=4367s'),
    ('i', 'vowel', 'see', 'Âm /i/ dài và căng, kéo môi sang hai bên như đang cười: sheep khác ship.', 'https://youtu.be/RZmGzSb-6OM'),
    ('ɪ', 'vowel', 'sit', 'Âm /ɪ/ ngắn và thả lỏng, miệng hơi mở hơn "i" tiếng Việt: ship khác sheep.', 'https://youtu.be/TNFKG0yvDx4'),
    ('ɛ', 'vowel', 'bed', 'Giống "e" tiếng Việt nhưng miệng hẹp hơn một chút, đọc gọn; phân biệt với /æ/ (bed khác bad).', 'https://youtu.be/hLN1cdSTDo8'),
    ('æ', 'vowel', 'cat', 'Mở miệng rộng, hạ hàm dưới, âm nằm giữa "e" và "a" tiếng Việt.', 'https://youtu.be/qVhaIHk88a8'),
    ('ʌ', 'vowel', 'cup', 'Giống "ă" tiếng Việt: miệng mở vừa, môi thả lỏng, đọc dứt khoát; phân biệt với /ɑ/ (cut khác cart) và /æ/ (cup khác cap).', 'https://youtu.be/PZwKFFp7V50'),
    ('ɑ', 'vowel', 'car', 'Giống "a" tiếng Việt kéo dài, miệng mở rộng, lưỡi thấp và lùi về sau (car, father, hot).', 'https://youtu.be/DEJGBC4xZzI'),
    ('ɔ', 'vowel', 'saw', 'Giống "o" tiếng Việt kéo dài, môi tròn, lưỡi lùi về sau (saw, thought); không thêm âm lướt phía sau.', 'https://youtu.be/opMab62SybY'),
    ('ʊ', 'vowel', 'book', 'Giống "ư" pha "u" tiếng Việt, môi hơi tròn nhưng thả lỏng, đọc gọn; phân biệt với /u/ dài (full khác fool).', 'https://youtu.be/eJ7dM_LU9t4'),
    ('u', 'vowel', 'food', 'Giống "u" tiếng Việt kéo dài, môi tròn và chu ra nhiều, lưỡi nâng cao về sau.', 'https://youtu.be/mnKEGLuEzV4'),
    ('ɝ', 'vowel', 'bird', 'Giống "ơ" tiếng Việt nhưng uốn lưỡi về phía sau ngay từ đầu âm, không chạm vòm miệng; gặp ở ir, er, ur (bird, her, turn).', 'https://youtu.be/6ppOrwjvslc'),
    ('ə', 'vowel', 'about', 'Âm yếu và ngắn nhất, giống "ơ" rất nhẹ, miệng thả lỏng; chỉ ở âm tiết không nhấn (about, support), đừng đọc rõ như nguyên âm đầy đủ.', 'https://youtu.be/2BmkUa4Mv60'),
    ('eɪ', 'diphthong', 'day', 'Trượt từ /ɛ/ sang /ɪ/, giống "ây" tiếng Việt; phải có đủ phần trượt, đừng đọc thành "e" đơn (late khác let).', 'https://youtu.be/5FMPlqlFt9g'),
    ('aɪ', 'diphthong', 'my', 'Trượt từ "a" mở rộng sang /ɪ/, giống "ai" tiếng Việt; khi có phụ âm cuối (time, like) vẫn giữ phụ âm cuối.', 'https://youtu.be/Hb8COxAtl14'),
    ('ɔɪ', 'diphthong', 'boy', 'Trượt từ /ɔ/ môi tròn sang /ɪ/, giống "oi" tiếng Việt.', 'https://youtu.be/lFRrEI85IcM'),
    ('aʊ', 'diphthong', 'now', 'Trượt từ "a" sang /ʊ/, môi tròn dần, giống "ao" tiếng Việt.', 'https://youtu.be/9WDnVMQIaTs'),
    ('oʊ', 'diphthong', 'go', 'Bắt đầu gần "ô" rồi tròn môi dần về /ʊ/, giống "âu" nhưng tròn môi hơn; đừng đọc thành "ô" đơn (coat khác caught).', 'https://youtu.be/Civ7UBZP99M'),
    ('ɪɹ', 'diphthong', 'near', 'Đọc /ɪ/ rồi uốn lưỡi thành âm r ở cuối, không đọc thành "ia" (near, here).', 'https://youtu.be/ejS939SYYnY'),
    ('ɛɹ', 'diphthong', 'hair', 'Đọc /ɛ/ rồi uốn lưỡi thành âm r ở cuối, không đọc thành "e-ơ" (hair, care).', 'https://youtu.be/WJMwIC1muYs'),
    ('ʊɹ', 'diphthong', 'tour', 'Đọc /ʊ/ rồi uốn lưỡi thành âm r ở cuối, không đọc thành "ua" (tour, sure).', 'https://youtu.be/dLol_Kvv7wc'),
    ('ɚ', 'vowel', 'teacher', 'Âm "ơ" nhẹ có uốn lưỡi, ở âm tiết không nhấn và cuối từ (teacher, deliver); đừng đọc thành "ơ" trơn.', 'https://youtu.be/AzNRoSGBh44');

-- Cấu hình credit: một dòng. Đơn giá để 0 cho tới khi quản trị viên điền giá thật của model đang dùng.
INSERT INTO ai_settings (id) VALUES (1);
INSERT INTO ai_feature_prices (feature) VALUES
    ('shadowing_feedback'), ('lesson_chat'), ('tutor_session'), ('lesson_suggest');

-- Tài khoản dev. Mật khẩu: Dev12345! (ĐỔI trên môi trường thật.)
-- Giáo viên hệ thống là chủ của các bài seed (lessons.owner_id NOT NULL).
INSERT INTO users (id, email, password_hash, display_name, role, email_verified_at, terms_accepted_at, onboarded_at) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@lingualoop.local',   '$2a$10$URb.Tafv63DdbrJlwCQOyOmrZ.a5boJLUmT6bdnY3OZ0A/e5LWJBe', 'Admin',               'admin',   now(), now(), now()),
    ('00000000-0000-0000-0000-000000000002', 'teacher@lingualoop.local', '$2a$10$URb.Tafv63DdbrJlwCQOyOmrZ.a5boJLUmT6bdnY3OZ0A/e5LWJBe', 'LinguaLoop Teacher',  'teacher', now(), now(), now());
INSERT INTO ai_wallets (user_id, balance) VALUES ('00000000-0000-0000-0000-000000000002', 1000);
