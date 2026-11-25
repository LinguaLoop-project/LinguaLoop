package com.lingualoop.backend.subscription.dto;

/**
 * Đơn vừa tạo và đường dẫn sang cổng VNPAY. {@code paymentUrl} null khi gói giá 0 đồng: đơn đã được ghi nhận ngay, không
 * cần thanh toán.
 */
public record CheckoutView(OrderView order, String paymentUrl) {
}
