-- BR-BH-18: mỗi video YouTube chỉ dùng cho một bài thư viện chưa xóa, tính trên mọi giáo viên, cả Nháp lẫn Đã xuất bản.
-- Bài đã xóa không giữ video; bài cá nhân của Học viên Pro (kind = 'personal') không tính.
-- Chỉ mục này chặn hai yêu cầu tạo hoặc khôi phục bài cùng video chạy song song (AC-BH-89).
CREATE UNIQUE INDEX uq_lessons_library_video ON lessons(youtube_id)
    WHERE kind = 'library' AND deleted_at IS NULL;
