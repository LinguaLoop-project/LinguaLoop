package com.lingualoop.backend.subscription.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.lingualoop.backend.subscription.service.ProPaymentService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * IPN: máy chủ VNPAY gọi thẳng để báo kết quả thanh toán, kể cả khi học viên đã đóng trình duyệt (UC-PR-03 3c). Không
 * cần đăng nhập; tin cậy nhờ chữ ký. Trả lời theo định dạng VNPAY yêu cầu, không bọc {@code ApiResponse}.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments/vnpay")
@RequiredArgsConstructor
public class VnpayIpnController {

    private final ProPaymentService payments;

    /** Câu trả lời cho VNPAY: {@code 00} và {@code 02} làm VNPAY ngừng gửi lại. */
    public record IpnResponse(@JsonProperty("RspCode") String rspCode, @JsonProperty("Message") String message) {
    }

    @GetMapping("/ipn")
    public IpnResponse ipn(@RequestParam Map<String, String> params) {
        try {
            return switch (payments.confirmIpn(params)) {
                case PROCESSED -> new IpnResponse("00", "Confirm Success");
                case ALREADY_CONFIRMED -> new IpnResponse("02", "Order already confirmed");
                case ORDER_NOT_FOUND -> new IpnResponse("01", "Order not found");
                case INVALID_AMOUNT -> new IpnResponse("04", "Invalid amount");
                case INVALID_SIGNATURE -> new IpnResponse("97", "Invalid signature");
            };
        } catch (RuntimeException e) {
            log.error("Lỗi xử lý IPN VNPAY cho đơn {}", params.get("vnp_TxnRef"), e);
            return new IpnResponse("99", "Unknown error");
        }
    }
}
