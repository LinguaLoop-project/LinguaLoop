-- Câu học viên bỏ qua trong phiên ôn được hoãn sang ngày mai (BR-HT-21): lần bỏ qua gần nhất. Câu có last_skipped_at
-- từ đầu ngày của học viên trở đi không được chọn vào phiên ôn hôm nay. NULL = chưa từng bỏ qua.
ALTER TABLE user_sentence_review ADD COLUMN last_skipped_at timestamptz;
