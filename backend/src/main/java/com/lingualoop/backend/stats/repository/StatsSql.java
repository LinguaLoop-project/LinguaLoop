package com.lingualoop.backend.stats.repository;

import java.sql.Timestamp;
import java.time.Instant;

/** Đoạn SQL dùng chung của thống kê, một nguồn cho mỗi quy tắc. Mọi giá trị lọc truyền bằng tham số. */
final class StatsSql {

    private StatsSql() {
    }

    /** Ngày theo giờ Việt Nam của một cột thời điểm (BR-NK-07). */
    static String vnDay(String column) {
        return "(" + column + " AT TIME ZONE 'Asia/Ho_Chi_Minh')::date";
    }

    /**
     * Người dùng của dòng {@code alias} đang Pro tại thời điểm {@code alias.created_at}: có đơn Pro đã thanh toán còn
     * hiệu lực lúc đó (BR-NK-12).
     */
    static String proAt(String alias) {
        return """
                EXISTS (SELECT 1 FROM pro_orders o WHERE o.user_id = %1$s.user_id AND o.status = 'paid'
                        AND %1$s.created_at >= o.starts_at AND %1$s.created_at < o.ends_at)""".formatted(alias);
    }

    /** Chỉ tính học viên: bỏ dòng của giáo viên và quản trị viên. */
    static String studentOnly(String alias) {
        return "NOT EXISTS (SELECT 1 FROM users t WHERE t.id = %s.user_id AND t.role <> 'student')".formatted(alias);
    }

    /** Lọc theo gói tại thời điểm thao tác; tham số {@code :plan} là {@code ALL}, {@code FREE} hoặc {@code PRO}. */
    static String planFilter(String alias) {
        return "(CAST(:plan AS text) = 'ALL' OR (CAST(:plan AS text) = 'PRO') = " + proAt(alias) + ")";
    }

    /** Dòng của {@code alias} có {@code created_at} trong {@code [:from, :to)}. */
    static String inRange(String alias) {
        return alias + ".created_at >= :from AND " + alias + ".created_at < :to";
    }

    static Timestamp ts(Instant instant) {
        return Timestamp.from(instant);
    }
}
