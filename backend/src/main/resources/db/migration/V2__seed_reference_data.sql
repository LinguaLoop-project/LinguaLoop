-- =============================================================================
-- Dữ liệu tham chiếu và tài khoản dev (schema MVP).
-- Từ điển và 9 bộ từ hệ thống nạp bằng script riêng (backend/seed), không nằm trong Flyway.
-- =============================================================================

-- 44 âm vị tiếng Anh giọng Mỹ, ký hiệu giống Azure en-US. Mẹo sửa phát âm nằm ở resources/pronunciation-tips.json.
INSERT INTO phonemes (symbol, kind, example_word, mouth_video_url) VALUES
    ('p', 'consonant', 'pen', 'https://youtu.be/AZRREr7DqqM'),
    ('b', 'consonant', 'bad', 'https://youtu.be/yP7aCKO6bTE'),
    ('t', 'consonant', 'tea', 'https://youtu.be/0T1QYByMxrs'),
    ('d', 'consonant', 'did', 'https://youtu.be/qA5ZYC89oso'),
    ('k', 'consonant', 'cat', 'https://youtu.be/d1jyIpAmLe8'),
    ('g', 'consonant', 'get', 'https://youtu.be/9eAqj9EfeK0'),
    ('f', 'consonant', 'fish', 'https://youtu.be/vE12RFyH-hY'),
    ('v', 'consonant', 'van', 'https://youtu.be/mO04G0v5a_c'),
    ('θ', 'consonant', 'think', 'https://youtu.be/b4Aj3k65HSo'),
    ('ð', 'consonant', 'this', 'https://youtu.be/tu1t3Fn5Lw8'),
    ('s', 'consonant', 'see', 'https://youtu.be/QtH3vRXmvvo'),
    ('z', 'consonant', 'zoo', 'https://youtu.be/o1ZvmX80t7Q'),
    ('ʃ', 'consonant', 'she', 'https://youtu.be/NF92RdZC6wE'),
    ('ʒ', 'consonant', 'vision', 'https://youtu.be/bTxeAiBF61I'),
    ('h', 'consonant', 'hat', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3879s'),
    ('tʃ', 'consonant', 'chair', 'https://youtu.be/PykxZ5kkrjs'),
    ('dʒ', 'consonant', 'jam', 'https://youtu.be/0IeQmGdo7gQ'),
    ('m', 'consonant', 'man', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3506s'),
    ('n', 'consonant', 'no', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3625s'),
    ('ŋ', 'consonant', 'sing', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3750s'),
    ('l', 'consonant', 'leg', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3945s'),
    ('ɹ', 'consonant', 'red', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=4160s'),
    ('j', 'consonant', 'yes', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=4490s'),
    ('w', 'consonant', 'wet', 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=4367s'),
    ('i', 'vowel', 'see', 'https://youtu.be/RZmGzSb-6OM'),
    ('ɪ', 'vowel', 'sit', 'https://youtu.be/TNFKG0yvDx4'),
    ('ɛ', 'vowel', 'bed', 'https://youtu.be/hLN1cdSTDo8'),
    ('æ', 'vowel', 'cat', 'https://youtu.be/qVhaIHk88a8'),
    ('ʌ', 'vowel', 'cup', 'https://youtu.be/PZwKFFp7V50'),
    ('ɑ', 'vowel', 'car', 'https://youtu.be/DEJGBC4xZzI'),
    ('ɔ', 'vowel', 'saw', 'https://youtu.be/opMab62SybY'),
    ('ʊ', 'vowel', 'book', 'https://youtu.be/eJ7dM_LU9t4'),
    ('u', 'vowel', 'food', 'https://youtu.be/mnKEGLuEzV4'),
    ('ɝ', 'vowel', 'bird', 'https://youtu.be/6ppOrwjvslc'),
    ('ə', 'vowel', 'about', 'https://youtu.be/2BmkUa4Mv60'),
    ('eɪ', 'diphthong', 'day', 'https://youtu.be/5FMPlqlFt9g'),
    ('aɪ', 'diphthong', 'my', 'https://youtu.be/Hb8COxAtl14'),
    ('ɔɪ', 'diphthong', 'boy', 'https://youtu.be/lFRrEI85IcM'),
    ('aʊ', 'diphthong', 'now', 'https://youtu.be/9WDnVMQIaTs'),
    ('oʊ', 'diphthong', 'go', 'https://youtu.be/Civ7UBZP99M'),
    ('ɪɹ', 'diphthong', 'near', 'https://youtu.be/ejS939SYYnY'),
    ('ɛɹ', 'diphthong', 'hair', 'https://youtu.be/WJMwIC1muYs'),
    ('ʊɹ', 'diphthong', 'tour', 'https://youtu.be/dLol_Kvv7wc'),
    ('ɚ', 'vowel', 'teacher', 'https://youtu.be/AzNRoSGBh44');

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
