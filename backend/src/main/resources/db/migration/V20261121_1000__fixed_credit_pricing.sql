-- ADR 0013: trừ credit cố định theo đơn vị nghiệp vụ, ghi chi phí thật của mỗi lần dùng, tặng credit dùng thử một lần
-- thay cho credit miễn phí mỗi ngày (BR-GA-03, BR-GA-04, BR-GA-06, BR-GA-12).

-- Tính năng mới: tạo bài từ link YouTube (TranscriptAPI tính phí theo lần, không theo token)
ALTER TABLE ai_feature_prices DROP CONSTRAINT ai_feature_prices_feature_check;
ALTER TABLE ai_feature_prices ADD CONSTRAINT ai_feature_prices_feature_check
    CHECK (feature IN ('shadowing_feedback', 'lesson_chat', 'tutor_session', 'lesson_suggest', 'lesson_import'));

-- credits_per_use: credit trừ của người dùng cho mỗi đơn vị (lần, phiên, cuộc trò chuyện, câu, bài).
-- fixed_cost_vnd: chi phí dịch vụ ngoài tính theo lần (đồng), chỉ dùng cho thống kê lãi lỗ.
ALTER TABLE ai_feature_prices
    ADD COLUMN credits_per_use integer NOT NULL DEFAULT 1 CHECK (credits_per_use BETWEEN 1 AND 1000),
    ADD COLUMN fixed_cost_vnd  integer NOT NULL DEFAULT 0 CHECK (fixed_cost_vnd BETWEEN 0 AND 100000000);

INSERT INTO ai_feature_prices (feature) VALUES ('lesson_import') ON CONFLICT (feature) DO NOTHING;

-- Giá mặc định theo bảng giá niêm yết lúc triển khai, tỷ giá 26.100 đồng/USD (BR-GA-04):
-- mô hình văn bản 0,75/3,75 USD, mô hình giọng nói trực tiếp (âm thanh) 3/12 USD cho một triệu token,
-- TranscriptAPI 5 USD cho 1.000 lần lấy thành công.
UPDATE ai_feature_prices SET credits_per_use = 2,  input_price_vnd = 19575, output_price_vnd = 97875,  fixed_cost_vnd = 0
    WHERE feature = 'shadowing_feedback';
UPDATE ai_feature_prices SET credits_per_use = 3,  input_price_vnd = 78300, output_price_vnd = 313200, fixed_cost_vnd = 0
    WHERE feature = 'tutor_session';
UPDATE ai_feature_prices SET credits_per_use = 5,  input_price_vnd = 78300, output_price_vnd = 313200, fixed_cost_vnd = 0
    WHERE feature = 'lesson_chat';
UPDATE ai_feature_prices SET credits_per_use = 1,  input_price_vnd = 19575, output_price_vnd = 97875,  fixed_cost_vnd = 0
    WHERE feature = 'lesson_suggest';
UPDATE ai_feature_prices SET credits_per_use = 10, input_price_vnd = 0,     output_price_vnd = 0,      fixed_cost_vnd = 131
    WHERE feature = 'lesson_import';

-- extra_cost: chi phí phát sinh thêm trong một lần dùng đã trừ credit (các lượt sau của cuộc trò chuyện chữ,
-- nhận xét tổng quát): không trừ credit, không tính là một lần dùng (BR-NK-09).
ALTER TABLE ai_usage_logs DROP CONSTRAINT ai_usage_logs_status_check;
ALTER TABLE ai_usage_logs ADD CONSTRAINT ai_usage_logs_status_check
    CHECK (status IN ('success', 'failed', 'rejected_no_credit', 'extra_cost'));

-- cost_vnd: chi phí thật (đồng) theo đơn giá lúc dùng; cost_estimated: ước tính (phiên giọng nói không có số token).
ALTER TABLE ai_usage_logs
    ADD COLUMN cost_vnd       numeric(12,2) NOT NULL DEFAULT 0 CHECK (cost_vnd >= 0),
    ADD COLUMN quantity       integer       NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    ADD COLUMN model          text,
    ADD COLUMN cost_estimated boolean       NOT NULL DEFAULT false;

-- Bỏ số dư tối thiểu để bắt đầu: chỉ cần số dư >= credit mỗi đơn vị × số đơn vị (BR-GA-06).
ALTER TABLE ai_settings DROP COLUMN min_balance_to_start;

-- Học viên được tặng một lần credit dùng thử thay cho credit miễn phí mỗi ngày (BR-GA-03);
-- quản trị viên sửa được số credit dùng thử (UC-GA-02).
ALTER TABLE ai_settings RENAME COLUMN free_daily_credits TO trial_credits;
ALTER TABLE ai_settings ALTER COLUMN trial_credits SET DEFAULT 100;
UPDATE ai_settings SET trial_credits = 100 WHERE id = 1;

-- Thời điểm tài khoản đã được tặng (hoặc mất quyền nhận) credit dùng thử; NULL = chưa được tặng.
-- Ví giáo viên được đánh dấu ngay để tài khoản đổi sang học viên không được tặng.
ALTER TABLE ai_wallets ADD COLUMN trial_granted_at timestamptz;

-- Phiên giọng nói (phiên gia sư, thực hành với AI theo bài): trình duyệt nối thẳng tới dịch vụ AI nên chi phí được điền
-- sau, vào chính dòng ghi lúc trừ credit của phiên (BR-GA-12). Mỗi phiên một dòng; NULL với các tính năng khác.
ALTER TABLE ai_usage_logs ADD COLUMN session_id uuid;
CREATE INDEX ix_ai_usage_session ON ai_usage_logs (session_id) WHERE session_id IS NOT NULL;
-- Dòng phiên giọng nói chưa có chi phí: job ước tính theo thời lượng quét theo chỉ mục này
CREATE INDEX ix_ai_usage_live_pending ON ai_usage_logs (created_at)
    WHERE session_id IS NOT NULL AND cost_estimated AND input_units = 0 AND output_units = 0;
