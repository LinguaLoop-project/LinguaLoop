-- Gói Pro mẫu để thử nâng cấp và thanh toán trên máy dev. Chỉ nạp khi chạy profile dev (xem spring.flyway.locations trong
-- application-dev.yml); profile prod không đọc thư mục này, gói thật do quản trị viên tạo. Chạy lại không tạo trùng.
INSERT INTO pro_plans (name, months, price_vnd, credits_per_month, on_sale) VALUES
    ('Pro 1 tháng',  1,  99000, 500, true),
    ('Pro 3 tháng',  3, 249000, 500, true),
    ('Pro 12 tháng', 12, 399000, 500, true)
ON CONFLICT DO NOTHING;
