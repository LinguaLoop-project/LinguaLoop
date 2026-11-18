package com.lingualoop.backend.report.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Bộ hẹn giờ của UC-XL-06: chạy {@link ReportMaintenanceService#runOnce} mỗi giờ. Lượt đầu chạy sau một giờ kể từ khi
 * khởi động để test tích hợp không bị lượt chạy nền làm đổi dữ liệu.
 */
@Slf4j
@Component
@RequiredArgsConstructor
class ReportMaintenanceJob {

    private final ReportMaintenanceService maintenance;

    @Scheduled(initialDelayString = "${app.report.maintenance-initial-delay:PT1H}",
            fixedDelayString = "${app.report.maintenance-interval:PT1H}")
    void run() {
        ReportMaintenanceService.RunResult result = maintenance.runOnce();
        if (result.remindedGroups() > 0 || result.closedReports() > 0) {
            log.info("Báo cáo: nhắc {} dòng ({} giáo viên), đóng {} báo cáo", result.remindedGroups(),
                    result.notifiedTeachers(), result.closedReports());
        }
    }
}
