package com.lingualoop.backend.subscription.controller;

import jakarta.servlet.http.HttpServletRequest;

/** Địa chỉ IP của học viên gửi kèm yêu cầu thanh toán ({@code vnp_IpAddr}). */
final class ClientIp {

    private ClientIp() {
    }

    static String of(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = forwarded != null && !forwarded.isBlank() ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
        // Chạy ở máy cá nhân trình duyệt gọi qua IPv6 loopback
        return ip == null || ip.isBlank() || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip) ? "127.0.0.1" : ip;
    }
}
