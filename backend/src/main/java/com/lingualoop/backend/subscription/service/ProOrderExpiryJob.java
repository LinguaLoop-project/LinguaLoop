package com.lingualoop.backend.subscription.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Chuyển đơn chờ thanh toán quá 15 phút sang Hết hạn (BR-PR-12). Đọc đơn của học viên cũng tự chuyển trước khi trả. */
@Slf4j
@Component
@RequiredArgsConstructor
class ProOrderExpiryJob {

    private final ProPaymentService payments;

    @Scheduled(initialDelayString = "${app.subscription.expire-interval:PT1M}",
            fixedDelayString = "${app.subscription.expire-interval:PT1M}")
    void run() {
        int expired = payments.expireStale();
        if (expired > 0) {
            log.info("Đơn Pro: {} đơn chờ thanh toán đã hết hạn", expired);
        }
    }
}
