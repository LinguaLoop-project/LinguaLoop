-- Dấu "Bị quản trị viên gỡ" dùng chung cho gỡ tay (UC-BH-07, UC-BT-06) và gỡ từ báo cáo (UC-XL-04) (BR-XL-13).
-- source: report = gỡ từ báo cáo, manual = quản trị viên gỡ tay. Dấu cũ đều sinh từ báo cáo.
ALTER TABLE content_takedowns
    ADD COLUMN source text NOT NULL DEFAULT 'report' CHECK (source IN ('report','manual'));

-- Ghi chú của giáo viên gửi kèm yêu cầu xuất bản lại; bắt buộc khi bản chụp rỗng, kiểm ở tầng service.
ALTER TABLE republish_requests
    ADD COLUMN note text CHECK (char_length(note) BETWEEN 1 AND 500);

-- cancelled: yêu cầu tự hủy khi giáo viên xóa bài học hoặc bộ thẻ (BR-XL-13, BR-BH-06, BR-BT-10).
ALTER TABLE republish_requests DROP CONSTRAINT republish_requests_status_check;
ALTER TABLE republish_requests
    ADD CONSTRAINT republish_requests_status_check
        CHECK (status IN ('pending','approved','rejected','cancelled'));
