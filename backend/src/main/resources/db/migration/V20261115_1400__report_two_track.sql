-- Hai luồng xử lý báo cáo (BR-XL-01, BR-XL-02): bỏ trạng thái fix_requested, lưu bản chụp nội dung lúc báo
-- (BR-BC-10), người và ghi chú xử lý (BR-XL-04, BR-XL-07), mốc đã nhắc quá hạn (BR-XL-11); thêm dấu "Bị gỡ do báo cáo"
-- và yêu cầu xuất bản lại (BR-XL-13).

UPDATE content_reports SET status = 'waiting_teacher' WHERE status = 'fix_requested';

ALTER TABLE content_reports DROP CONSTRAINT content_reports_status_check;
ALTER TABLE content_reports ADD CONSTRAINT content_reports_status_check
    CHECK (status IN ('waiting_teacher','waiting_admin','resolved','rejected'));

-- Bản chụp các trường của câu hoặc thẻ lúc gửi, dạng {"<cột>": "<giá trị>"}; NULL với báo cáo tạo trước migration này.
ALTER TABLE content_reports ADD COLUMN content_snapshot jsonb;
-- Trường mà bản sửa đề xuất thay vào (BR-BC-11), ví dụ ipa_uk; NULL với lý do bắt buộc mô tả.
ALTER TABLE content_reports ADD COLUMN fix_field text;
-- NULL = chưa nhắc; giáo viên chủ chỉ được nhắc một lần cho mỗi báo cáo (BR-XL-11).
ALTER TABLE content_reports ADD COLUMN reminded_at timestamptz;
-- Người đóng báo cáo; handled_at có giá trị mà handled_by NULL nghĩa là "Hệ thống" (BR-XL-07).
ALTER TABLE content_reports ADD COLUMN handled_by uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE content_reports ADD COLUMN handled_at timestamptz;
-- Ghi chú xử lý, lý do từ chối hoặc lý do gỡ (BR-XL-04).
ALTER TABLE content_reports ADD COLUMN handling_note text CHECK (char_length(handling_note) BETWEEN 1 AND 500);

UPDATE content_reports SET handled_at = status_changed_at WHERE status IN ('resolved','rejected');
ALTER TABLE content_reports ADD CONSTRAINT chk_report_handled
    CHECK ((status IN ('resolved','rejected')) = (handled_at IS NOT NULL));

COMMENT ON COLUMN content_reports.status_changed_at IS 'Thời điểm đổi trạng thái gần nhất';

CREATE INDEX ix_reports_sentence ON content_reports(sentence_id) WHERE sentence_id IS NOT NULL;
CREATE INDEX ix_reports_card ON content_reports(card_id) WHERE card_id IS NOT NULL;
-- Lượt kiểm tra quá hạn chỉ quét báo cáo lỗi nội dung chưa nhắc (UC-XL-06).
CREATE INDEX ix_reports_overdue ON content_reports(created_at) WHERE status = 'waiting_teacher' AND reminded_at IS NULL;
-- Số báo cáo và số bị từ chối của một học viên trong 30 ngày (BR-XL-14).
CREATE INDEX ix_reports_reporter ON content_reports(reporter_id, status, handled_at);

-- Dấu "Bị gỡ do báo cáo" của bài học hoặc bộ thẻ (BR-XL-13). snapshot: {"<id câu hoặc thẻ>": {"<cột>": "<giá trị>"}}.
-- Gỡ thêm lần nữa khi dấu còn hiệu lực thì gộp bản chụp vào dòng đang có. cleared_at có giá trị = đã được duyệt xuất bản lại.
CREATE TABLE content_takedowns (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id     uuid REFERENCES lessons(id) ON DELETE CASCADE,
    deck_id       uuid REFERENCES vocab_decks(id) ON DELETE CASCADE,
    reason        text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
    snapshot      jsonb NOT NULL,
    taken_down_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    cleared_at    timestamptz,
    CONSTRAINT chk_takedown_target CHECK (num_nonnulls(lesson_id, deck_id) = 1)
);
CREATE UNIQUE INDEX uq_takedown_active_lesson ON content_takedowns(lesson_id)
    WHERE lesson_id IS NOT NULL AND cleared_at IS NULL;
CREATE UNIQUE INDEX uq_takedown_active_deck ON content_takedowns(deck_id)
    WHERE deck_id IS NOT NULL AND cleared_at IS NULL;

-- Yêu cầu xuất bản lại nội dung bị gỡ (UC-XL-05); mỗi dấu có tối đa một yêu cầu đang chờ (BR-XL-13).
CREATE TABLE republish_requests (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    takedown_id   uuid NOT NULL REFERENCES content_takedowns(id) ON DELETE CASCADE,
    requested_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    reject_reason text CHECK (char_length(reject_reason) BETWEEN 1 AND 500),
    decided_by    uuid REFERENCES users(id) ON DELETE SET NULL,
    decided_at    timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_republish_decided CHECK ((status = 'pending') = (decided_at IS NULL)),
    CONSTRAINT chk_republish_reason CHECK ((status = 'rejected') = (reject_reason IS NOT NULL))
);
CREATE UNIQUE INDEX uq_republish_pending ON republish_requests(takedown_id) WHERE status = 'pending';
