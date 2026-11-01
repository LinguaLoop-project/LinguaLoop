-- =============================================================================
-- Video khẩu hình giọng Mỹ cho 9 âm mà video cũ (BBC Learning English, giọng Anh) không khớp âm Mỹ (ADR 0007):
-- ɝ ɚ oʊ ɑ ɔ ɪɹ ɛɹ ʊɹ ə. ɚ trước đây chưa có video. Các âm còn lại giữ video cũ vì khẩu hình gần như giống nhau.
-- Chọn theo tiêu đề và kênh (Rachel's English, Sounds American, San Diego Voice and Accent, Tarle Speech), chưa xem
-- từng video; ʊɹ là ứng viên yếu nhất (video dạy theo từ "pure", không phải cả âm) và nên được xem lại.
-- =============================================================================

UPDATE phonemes SET mouth_video_url = 'https://youtu.be/6ppOrwjvslc' WHERE symbol = 'ɝ';  -- Sounds American: ɝ as in "first"
UPDATE phonemes SET mouth_video_url = 'https://youtu.be/AzNRoSGBh44' WHERE symbol = 'ɚ';  -- Sounds American: ɚ as in "after"
UPDATE phonemes SET mouth_video_url = 'https://youtu.be/Civ7UBZP99M' WHERE symbol = 'oʊ'; -- Rachel's English: OH as in NO
UPDATE phonemes SET mouth_video_url = 'https://youtu.be/DEJGBC4xZzI' WHERE symbol = 'ɑ';  -- Rachel's English: AH as in FATHER
UPDATE phonemes SET mouth_video_url = 'https://youtu.be/opMab62SybY' WHERE symbol = 'ɔ';  -- Rachel's English: AW as in LAW
UPDATE phonemes SET mouth_video_url = 'https://youtu.be/ejS939SYYnY' WHERE symbol = 'ɪɹ'; -- San Diego Voice and Accent: EAR /ɪɹ/
UPDATE phonemes SET mouth_video_url = 'https://youtu.be/WJMwIC1muYs' WHERE symbol = 'ɛɹ'; -- Rachel's English: AIR words
UPDATE phonemes SET mouth_video_url = 'https://youtu.be/dLol_Kvv7wc' WHERE symbol = 'ʊɹ'; -- Tarle Speech: PURE
UPDATE phonemes SET mouth_video_url = 'https://youtu.be/2BmkUa4Mv60' WHERE symbol = 'ə';  -- Rachel's English: UH [ə] SCHWA
