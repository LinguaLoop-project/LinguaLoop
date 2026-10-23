-- =============================================================================
-- Cập nhật mốc thời gian video khẩu hình (mouth_video_url) cho các phụ âm còn lại:
-- /m/, /n/, /ŋ/, /h/, /l/, /r/, /w/, /j/ cùng video tổng hợp BBC: https://www.youtube.com/watch?v=QxQUapA-2w4
-- Mốc thời gian được quy đổi sang giây (thẻ &t=...s).
-- Đã đối chiếu với danh sách chương của video: /m/ 58:26, /n/ 1:00:25, /ŋ/ 1:02:30, /h/ 1:04:39, /l/ 1:05:45,
-- /r/ 1:09:20, /w/ 1:12:47, /j/ 1:14:50.
-- =============================================================================

UPDATE phonemes SET mouth_video_url = 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3506s' WHERE symbol = 'm';
UPDATE phonemes SET mouth_video_url = 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3625s' WHERE symbol = 'n';
UPDATE phonemes SET mouth_video_url = 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3750s' WHERE symbol = 'ŋ';
UPDATE phonemes SET mouth_video_url = 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3879s' WHERE symbol = 'h';
UPDATE phonemes SET mouth_video_url = 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=3945s' WHERE symbol = 'l';
UPDATE phonemes SET mouth_video_url = 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=4160s' WHERE symbol = 'r';
UPDATE phonemes SET mouth_video_url = 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=4367s' WHERE symbol = 'w';
UPDATE phonemes SET mouth_video_url = 'https://www.youtube.com/watch?v=QxQUapA-2w4&t=4490s' WHERE symbol = 'j';
