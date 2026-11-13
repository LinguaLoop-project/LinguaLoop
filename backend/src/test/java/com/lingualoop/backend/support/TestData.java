package com.lingualoop.backend.support;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;

/** Dữ liệu mẫu dùng chung cho test: gói Pro và ví credit, chèn thẳng bằng SQL để không phụ thuộc feature khác. */
public final class TestData {

    /** Credit mỗi tháng mặc định của gói Pro trong test. */
    public static final int PRO_CREDITS_PER_MONTH = 1164;

    private TestData() {
    }

    /** Cấp Pro {@code months} tháng, bắt đầu từ lúc gọi (giờ thật). */
    public static void grantPro(JdbcTemplate jdbc, UUID userId, int months) {
        grantPro(jdbc, userId, months, PRO_CREDITS_PER_MONTH, Instant.now().minusSeconds(60));
    }

    /** Cấp Pro với credit mỗi tháng và thời điểm bắt đầu tuỳ chọn. */
    public static void grantPro(JdbcTemplate jdbc, UUID userId, int months, int creditsPerMonth, Instant startsAt) {
        Instant endsAt = startsAt.atZone(ZoneOffset.UTC).plusMonths(months).toInstant();
        jdbc.update("INSERT INTO pro_orders (user_id, plan_name, months, credits_per_month, amount_vnd, status, "
                + "expires_at, paid_at, starts_at, ends_at) VALUES (?, 'Test', ?, ?, 0, 'paid', ?, ?, ?, ?)",
                userId, months, creditsPerMonth, Timestamp.from(startsAt), Timestamp.from(startsAt),
                Timestamp.from(startsAt), Timestamp.from(endsAt));
    }

    /**
     * Nửa đêm kế tiếp theo giờ Việt Nam, đúng mốc đặt lại của ví Free. Không dùng {@code now() + 1 giờ}: trong giờ cuối
     * của ngày mốc đó vượt qua nửa đêm và dịch vụ coi ví là ví Pro cũ, nạp lại 20 credit.
     */
    private static final String NEXT_VN_MIDNIGHT = "((date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') "
            + "+ interval '1 day') AT TIME ZONE 'Asia/Ho_Chi_Minh')";

    /** Đặt ví credit của người dùng (tạo nếu chưa có), mốc đặt lại ở nửa đêm kế tiếp nên không bị nạp lại lúc test. */
    public static void setCredits(JdbcTemplate jdbc, UUID userId, int balance) {
        jdbc.update("INSERT INTO ai_wallets (user_id, balance, resets_at, updated_at) "
                + "VALUES (?, ?, " + NEXT_VN_MIDNIGHT + ", now()) "
                + "ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance, "
                + "resets_at = EXCLUDED.resets_at, updated_at = now()", userId, balance);
    }
}
