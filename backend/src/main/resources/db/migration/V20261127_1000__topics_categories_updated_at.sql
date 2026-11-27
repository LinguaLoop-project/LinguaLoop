-- Ngày cập nhật của chủ đề và danh mục, hiển thị ở danh sách quản trị và làm mới khi sửa tên (UC-CD-01, 03, 04, 06).
-- Dòng đã có lấy ngày tạo làm ngày cập nhật.
ALTER TABLE topics ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
UPDATE topics SET updated_at = created_at;

ALTER TABLE deck_categories ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
UPDATE deck_categories SET updated_at = created_at;
