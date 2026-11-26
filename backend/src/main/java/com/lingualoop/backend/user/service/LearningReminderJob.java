package com.lingualoop.backend.user.service;

import java.time.Clock;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Chạy mỗi giờ để gửi nhắc ôn thẻ và nhắc giữ chuỗi ngày học (BR-TK-23). */
@Slf4j
@Component
@RequiredArgsConstructor
class LearningReminderJob {

    private final LearningReminderService reminders;
    private final Clock clock;

    @Scheduled(initialDelayString = "${app.notifications.reminder-interval:PT1H}",
            fixedDelayString = "${app.notifications.reminder-interval:PT1H}")
    void run() {
        int sent = reminders.run(clock.instant());
        if (sent > 0) {
            log.info("Nhắc học: đã gửi {} thông báo", sent);
        }
    }
}
