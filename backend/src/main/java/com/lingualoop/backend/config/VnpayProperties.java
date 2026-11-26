package com.lingualoop.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bind từ {@code app.vnpay}: cổng thanh toán VNPAY (UC-PR-03). {@code tmnCode} và {@code hashSecret} lấy từ email
 * VNPAY gửi khi đăng ký merchant (sandbox: https://sandbox.vnpayment.vn/devreg). {@code returnUrl} là trang kết quả của
 * frontend. Địa chỉ IPN không nằm ở đây: merchant đăng ký với VNPAY.
 */
@ConfigurationProperties("app.vnpay")
public record VnpayProperties(String url, String tmnCode, String hashSecret, String returnUrl) {

    /** Đủ thông tin để tạo đường dẫn thanh toán và kiểm chữ ký; thiếu thì tạo đơn báo thanh toán tạm thời không dùng được. */
    public boolean configured() {
        return notBlank(url) && notBlank(tmnCode) && notBlank(hashSecret) && notBlank(returnUrl);
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
