-- Tùy chọn bật/tắt từng loại thông báo nhắc của học viên (BR-TK-23). Chỉ lưu lựa chọn khác mặc định; chưa có dòng nào
-- nghĩa là dùng mặc định của loại đó (bật).
CREATE TABLE notification_preferences (
    user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       text        NOT NULL,
    enabled    boolean     NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, type)
);
