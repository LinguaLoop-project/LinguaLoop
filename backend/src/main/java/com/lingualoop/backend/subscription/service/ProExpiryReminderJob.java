package com.lingualoop.backend.subscription.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Gửi nhắc gói Pro sắp hết hạn và đã hết hạn (BR-TK-22). Máy chủ miễn phí có thể ngủ nên lần chạy trễ vẫn gửi đúng nhờ
 * khóa chống trùng.
 */
@Slf4j
@Component
@RequiredArgsConstructor
class ProExpiryReminderJob {

    private final ProExpiryReminderService reminders;

    @Scheduled(initialDelayString = "${app.subscription.reminder-interval:PT1H}",
            fixedDelayString = "${app.subscription.reminder-interval:PT1H}")
    void run() {
        int sent = reminders.run();
        if (sent > 0) {
            log.info("Nhắc gói Pro: đã gửi {} thông báo", sent);
        }
    }
}
