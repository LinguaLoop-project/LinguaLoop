-- BR-BH-13: giáo viên chỉ tách hoặc gộp câu khi bài chưa từng xuất bản (chưa có học viên học). Cột ghi lần xuất bản đầu
-- tiên và không bao giờ xóa, kể cả khi gỡ xuất bản, nên gỡ xuất bản không mở lại quyền tách gộp.
ALTER TABLE lessons ADD COLUMN first_published_at timestamptz;

-- Bài đã từng xuất bản trước khi có cột: lấy lần xuất bản sớm nhất trong nhật ký; bài đang Đã xuất bản mà nhật ký không
-- ghi (dữ liệu mẫu) thì lấy lúc cập nhật. Tắt trigger updated_at để điền cột không làm đổi thứ tự "cập nhật gần nhất".
ALTER TABLE lessons DISABLE TRIGGER trg_lessons_updated_at;

UPDATE lessons l
SET first_published_at = coalesce(
        (SELECT min(a.created_at) FROM audit_logs a
         WHERE a.target_type = 'lesson' AND a.action = 'publish' AND a.target_id = l.id),
        CASE WHEN l.status = 'published' THEN l.updated_at END)
WHERE l.status = 'published'
   OR EXISTS (SELECT 1 FROM audit_logs a
              WHERE a.target_type = 'lesson' AND a.action = 'publish' AND a.target_id = l.id);

ALTER TABLE lessons ENABLE TRIGGER trg_lessons_updated_at;
