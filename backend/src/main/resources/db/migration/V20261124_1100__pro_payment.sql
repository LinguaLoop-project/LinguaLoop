-- Thanh toán gói Pro qua VNPAY (UC-PR-02 đến 04).
--
-- Thay cho chú thích cũ ở V1: Return URL và IPN có giá trị như nhau, kết quả nào có chữ ký hợp lệ đến trước thì được
-- ghi nhận (BR-PR-08). Kết quả thành công đến muộn cho đơn đã hủy hoặc hết hạn vẫn được ghi nhận (BR-PR-17).

-- Loại đơn lưu cố định lúc tạo (BR-PR-05); luồng thanh toán luôn ghi rõ. Mặc định 'upgrade' cho đơn cũ và đơn do
-- công cụ dev tạo.
ALTER TABLE pro_orders
    ADD COLUMN kind text NOT NULL DEFAULT 'upgrade' CHECK (kind IN ('upgrade','renew'));

-- Biên nhận: ngân hàng và thời điểm VNPAY ghi nhận giao dịch.
ALTER TABLE pro_orders
    ADD COLUMN vnpay_bank_code text,
    ADD COLUMN vnpay_pay_date  timestamptz;

-- Đơn đã hủy vẫn có thể chuyển sang 'paid' khi VNPAY báo thành công muộn (BR-PR-17); giữ canceled_at làm lịch sử.
ALTER TABLE pro_orders DROP CONSTRAINT chk_order_canceled;
ALTER TABLE pro_orders
    ADD CONSTRAINT chk_order_canceled CHECK (status <> 'canceled' OR canceled_at IS NOT NULL);

-- Job chuyển đơn chờ quá 15 phút sang 'expired' (BR-PR-12).
CREATE INDEX ix_pro_orders_pending_expiry ON pro_orders(expires_at) WHERE status = 'pending';
