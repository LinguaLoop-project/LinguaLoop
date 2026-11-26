-- Thống kê hệ thống quét theo khoảng thời gian trên toàn bảng (UC-NK-02 đến 04); các chỉ mục sẵn có đều bắt đầu
-- bằng user_id nên không dùng được cho các truy vấn này.
CREATE INDEX ix_sa_time  ON sentence_attempts(created_at);
CREATE INDEX ix_vrl_time ON vocab_review_logs(created_at);
CREATE INDEX ix_users_created ON users(created_at);
-- Doanh thu lấy đơn đã thanh toán có thời gian hiệu lực giao với khoảng: ends_at > :from AND starts_at < :to.
CREATE INDEX ix_pro_orders_paid_period ON pro_orders(ends_at, starts_at) WHERE status = 'paid';
