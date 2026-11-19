package com.lingualoop.backend.user.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Dữ liệu màn quản trị tài khoản của quản trị viên (UC-QT-01). */
public final class AdminUserView {

    private AdminUserView() {
    }

    /**
     * Một dòng danh sách. {@code plan} là {@code free} hoặc {@code pro} với học viên, {@code null} với giáo viên và
     * quản trị viên. {@code lastActiveAt} null khi chưa từng hoạt động.
     */
    public record Row(UUID id, String displayName, String email, String role, String plan, boolean locked,
            Instant createdAt, Instant lastActiveAt) {
    }

    /** Một mục hoạt động học tập gần đây: {@code kind} là {@code dictation}, {@code shadowing} hoặc {@code vocab}. */
    public record Activity(String kind, String title, int count, Instant at) {
    }

    /** Một đơn mua gói Pro trong lịch sử thanh toán của học viên. */
    public record Payment(UUID id, String planName, int months, int amountVnd, String status, Instant createdAt,
            Instant paidAt, Instant startsAt, Instant endsAt) {
    }

    /** Nội dung thư viện chưa xóa của giáo viên và số báo cáo đang chờ giáo viên này xử lý (BR-XL-12). */
    public record ContentCounts(long publishedLessons, long draftLessons, long publishedDecks, long draftDecks,
            long openReports, long waitingTeacherReports) {

        public long lessons() {
            return publishedLessons + draftLessons;
        }

        public long decks() {
            return publishedDecks + draftDecks;
        }
    }

    /**
     * Chi tiết tài khoản. Phần học viên ({@code plan}, {@code proEndsAt}, {@code payments}) rỗng với giáo viên; phần giáo
     * viên ({@code content}, {@code creditBalance}) {@code null} với học viên.
     */
    public record Detail(UUID id, String displayName, String email, String avatarUrl, String role, boolean locked,
            Instant lockedAt, String lockedReason, Instant createdAt, Instant lastActiveAt,
            List<Activity> recentActivities, String plan, Instant proEndsAt, List<Payment> payments,
            ContentCounts content, Integer creditBalance) {
    }
}
