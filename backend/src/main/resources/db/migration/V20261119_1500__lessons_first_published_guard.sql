-- BR-BH-13: bài Đã xuất bản luôn có first_published_at, và cột không bao giờ bị xóa khi đã có.
-- Dữ liệu nạp thẳng vào DB (backend/seed) ghi status = 'published' mà không điền cột, nên bài đang xuất bản bị coi là chưa
-- từng xuất bản và giáo viên tách, gộp câu được. Trigger tự điền khi bài thành Đã xuất bản và giữ giá trị đã có; CHECK
-- chặn mọi trường hợp còn lại.

-- Bài đang Đã xuất bản còn trống: lấy lúc cập nhật như V20261118_1300. Tắt trigger updated_at để không đổi thứ tự.
ALTER TABLE lessons DISABLE TRIGGER trg_lessons_updated_at;
UPDATE lessons SET first_published_at = updated_at WHERE status = 'published' AND first_published_at IS NULL;
ALTER TABLE lessons ENABLE TRIGGER trg_lessons_updated_at;

CREATE FUNCTION lessons_keep_first_published_at() RETURNS trigger
    LANGUAGE plpgsql AS
$$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.first_published_at IS NOT NULL THEN
        NEW.first_published_at := OLD.first_published_at;
    ELSIF NEW.status = 'published' AND NEW.first_published_at IS NULL THEN
        NEW.first_published_at := now();
    END IF;
    RETURN NEW;
END
$$;

CREATE TRIGGER trg_lessons_first_published_at
    BEFORE INSERT OR UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION lessons_keep_first_published_at();

ALTER TABLE lessons ADD CONSTRAINT chk_lessons_first_published
    CHECK (status <> 'published' OR first_published_at IS NOT NULL);
