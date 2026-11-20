-- Học thụ động (UC-TC-04, BR-TC-16) đếm lượt thích theo bài cho từng video trong luồng; khóa chính (user_id, lesson_id)
-- của lesson_likes không phục vụ được truy vấn theo lesson_id nên thêm chỉ mục riêng.
CREATE INDEX IF NOT EXISTS ix_lesson_likes_lesson ON lesson_likes(lesson_id);
