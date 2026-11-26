-- Đối tượng chứa của một mục nhật ký: bài học hoặc bộ thẻ của nội dung bị báo cáo (BR-NK-03, BR-NK-17).
-- parent_* lưu tại thời điểm ghi, nên vẫn đúng khi nội dung bị xóa hoặc được giao lại.
ALTER TABLE audit_logs
    ADD COLUMN parent_type text,
    ADD COLUMN parent_id   uuid,
    ADD CONSTRAINT chk_audit_parent CHECK ((parent_type IS NULL) = (parent_id IS NULL));

CREATE INDEX ix_audit_parent ON audit_logs(parent_type, parent_id, created_at DESC) WHERE parent_id IS NOT NULL;

-- Điền đối tượng chứa cho nhật ký câu đã ghi trước khi có cột này (câu chỉ xóa mềm nên vẫn JOIN được).
-- audit_logs có trigger chặn UPDATE (chỉ thêm), nên tạm tắt trigger trong lần điền này.
ALTER TABLE audit_logs DISABLE TRIGGER trg_audit_logs_append_only;
UPDATE audit_logs a
SET parent_type = 'lesson', parent_id = s.lesson_id
FROM sentences s
WHERE a.target_type = 'sentence' AND a.target_id = s.id AND a.parent_id IS NULL;
ALTER TABLE audit_logs ENABLE TRIGGER trg_audit_logs_append_only;
