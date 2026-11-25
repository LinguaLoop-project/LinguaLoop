-- Ảnh đại diện do học viên tự tải lên (UC-TK-10): khóa tệp trên S3. avatar_url vẫn giữ ảnh Google; có avatar_key thì ưu tiên.
ALTER TABLE users ADD COLUMN avatar_key text;
