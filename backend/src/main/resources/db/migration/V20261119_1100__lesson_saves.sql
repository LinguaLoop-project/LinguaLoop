-- Bài đã lưu (UC-TC-05, BR-TC-19): học viên lưu một bài học để luyện sau, từ trang chi tiết bài hoặc từ Học thụ động.
-- Một học viên lưu một bài tối đa một lần. Bài bị gỡ xuất bản hoặc xóa mềm vẫn nằm trong danh sách (hiện là không còn khả dụng).
CREATE TABLE lesson_saves (
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id  uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX ix_lesson_saves_user_time ON lesson_saves(user_id, created_at DESC);
