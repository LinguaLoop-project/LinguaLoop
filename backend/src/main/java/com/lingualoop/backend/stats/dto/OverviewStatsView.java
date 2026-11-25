package com.lingualoop.backend.stats.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Tổng quan hệ thống (UC-NK-02). Số tài khoản là số tại thời điểm tính, không đổi theo khoảng (BR-NK-06); các số còn
 * lại tính theo khoảng đang chọn. {@code computedAt} là thời điểm số liệu được tính (BR-NK-10).
 */
public record OverviewStatsView(
        Instant computedAt,
        StatsPeriod period,
        Accounts accounts,
        Metric newAccounts,
        BigDecimal recognizedRevenueVnd,
        long publishedLessons,
        long publishedDecks,
        long pendingAdminReports,
        List<PendingReport> oldestPendingReports,
        DailySeries daily) {

    public static final String SERIES_ACTIVE_USERS = "activeUsers";
    public static final String SERIES_NEW_ACCOUNTS = "newAccounts";

    public OverviewStatsView {
        oldestPendingReports = List.copyOf(oldestPendingReports);
    }

    /** {@code proRatioPct}: học viên đang Pro ÷ tổng học viên, 1 chữ số thập phân; trống khi chưa có học viên. */
    public record Accounts(long total, long students, long teachers, long admins, long emailVerified, long activePro,
            BigDecimal proRatioPct) {
    }

    /** Báo cáo đang chờ quản trị viên, chờ lâu nhất trước (UC-NK-02 Bước 4). */
    public record PendingReport(UUID reportId, String content, String reason, String reporterName,
            Instant createdAt) {
    }
}
