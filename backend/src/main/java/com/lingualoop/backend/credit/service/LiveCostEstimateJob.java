package com.lingualoop.backend.credit.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.credit.CreditService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Ước tính chi phí các phiên giọng nói mà trình duyệt không báo số đơn vị xử lý (đóng trang, mất mạng), để thống kê chi
 * phí không bỏ sót phiên nào (BR-GA-12, ADR 0013).
 */
@Slf4j
@Component
@RequiredArgsConstructor
class LiveCostEstimateJob {

    private final CreditService credits;

    @Scheduled(fixedDelayString = "${app.credit.live-estimate.sweep-interval:PT5M}")
    void run() {
        int estimated = credits.estimateUnreportedLiveCosts();
        if (estimated > 0) {
            log.info("Đã ước tính chi phí theo thời lượng cho {} phiên giọng nói không được báo", estimated);
        }
    }
}
