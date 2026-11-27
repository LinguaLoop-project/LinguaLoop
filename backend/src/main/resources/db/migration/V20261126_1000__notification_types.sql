-- Thông báo có loại, tham số và đường dẫn để giao diện dịch theo ngôn ngữ và dẫn tới đúng trang (BR-TK-22).
-- `message` vẫn là câu tiếng Việt dự phòng nên thông báo cũ và client cũ không bị ảnh hưởng.
ALTER TABLE notifications
    ADD COLUMN type       text,
    ADD COLUMN params     jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN link       text,
    ADD COLUMN dedupe_key text;

-- Một khóa chống trùng chỉ gửi được một lần cho mỗi người (nhắc hết hạn, nhắc ôn...).
CREATE UNIQUE INDEX ux_notifications_dedupe ON notifications (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
