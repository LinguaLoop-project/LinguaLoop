package com.lingualoop.backend.subscription.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

/**
 * Ghi và đọc {@code pro_orders} cho luồng thanh toán (UC-PR-02 đến 04). Mọi thao tác đổi trạng thái chạy sau
 * {@link #lockUser(UUID)} trong cùng giao dịch, nên hai kết quả VNPAY đến cùng lúc (Return URL và IPN) hay hai đơn của
 * cùng học viên không ghi chồng lên nhau (BR-PR-08).
 */
@Repository
@RequiredArgsConstructor
public class ProOrderPaymentRepository {

    public record OrderRow(UUID id, UUID userId, UUID planId, String planName, int months, int creditsPerMonth, int amountVnd,
            String kind, String status, String responseCode, String transactionNo, String bankCode, Instant payDate,
            Instant createdAt, Instant expiresAt, Instant paidAt, Instant canceledAt, Instant startsAt,
            Instant endsAt) {
    }

    /** Khoảng Pro hiện tại: từ lúc bắt đầu đơn đầu tiên đến lúc kết thúc đơn cuối của chuỗi đơn nối tiếp. */
    public record ProPeriod(Instant startsAt, Instant endsAt) {
    }

    private static final String ORDER = """
            SELECT id, user_id, plan_id, plan_name, months, credits_per_month, amount_vnd, kind, status, vnpay_response_code,
                   vnpay_transaction_no, vnpay_bank_code, vnpay_pay_date, created_at, expires_at, paid_at, canceled_at,
                   starts_at, ends_at
            FROM pro_orders""";

    private final JdbcClient jdbc;

    /** Khóa theo học viên đến hết giao dịch. */
    public void lockUser(UUID userId) {
        jdbc.sql("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))")
                .param("key", "pro_orders:" + userId)
                .query((rs, n) -> 0)
                .list();
    }

    public Optional<OrderRow> find(UUID orderId) {
        return jdbc.sql(ORDER + " WHERE id = :id").param("id", orderId).query(ProOrderPaymentRepository::row)
                .optional();
    }

    /** Lịch sử đơn của học viên, mới nhất trước (BR-PR-03). */
    public List<OrderRow> findByUser(UUID userId, int limit) {
        return jdbc.sql(ORDER + " WHERE user_id = :user ORDER BY created_at DESC, id LIMIT :limit")
                .param("user", userId).param("limit", limit)
                .query(ProOrderPaymentRepository::row)
                .list();
    }

    /** Chuyển đơn chờ của học viên sang Đã hủy (BR-PR-16); trả số đơn đã hủy. */
    public int cancelPending(UUID userId, Instant now) {
        return jdbc.sql("""
                UPDATE pro_orders SET status = 'canceled', canceled_at = :now
                WHERE user_id = :user AND status = 'pending'""")
                .param("user", userId).param("now", Timestamp.from(now))
                .update();
    }

    public UUID insertPending(UUID userId, UUID planId, String planName, int months, int creditsPerMonth,
            int amountVnd, String kind, Instant now, Instant expiresAt) {
        return jdbc.sql("""
                INSERT INTO pro_orders (user_id, plan_id, plan_name, months, credits_per_month, amount_vnd, kind,
                                        status, created_at, expires_at)
                VALUES (:user, :plan, :name, :months, :credits, :amount, :kind, 'pending', :now, :expires)
                RETURNING id""")
                .param("user", userId).param("plan", planId).param("name", planName).param("months", months)
                .param("credits", creditsPerMonth).param("amount", amountVnd).param("kind", kind)
                .param("now", Timestamp.from(now)).param("expires", Timestamp.from(expiresAt))
                .query(UUID.class)
                .single();
    }

    /** Thời điểm kết thúc xa nhất của các đơn đã thanh toán còn hạn; rỗng khi học viên không có gói Pro còn hạn. */
    public Optional<Instant> latestPaidEnd(UUID userId, Instant now) {
        return jdbc.sql("""
                SELECT max(ends_at) FROM pro_orders
                WHERE user_id = :user AND status = 'paid' AND ends_at > :now""")
                .param("user", userId).param("now", Timestamp.from(now))
                .query((rs, n) -> Optional.ofNullable(instant(rs, 1)))
                .single();
    }

    /** Khoảng Pro đang hiệu lực (chuỗi đơn đã thanh toán còn hạn); rỗng với học viên Free. */
    public Optional<ProPeriod> currentPeriod(UUID userId, Instant now) {
        return jdbc.sql("""
                SELECT min(starts_at), max(ends_at) FROM pro_orders
                WHERE user_id = :user AND status = 'paid' AND ends_at > :now
                HAVING bool_or(starts_at <= :now)""")
                .param("user", userId).param("now", Timestamp.from(now))
                .query((rs, n) -> new ProPeriod(instant(rs, 1), instant(rs, 2)))
                .optional();
    }

    /**
     * Ghi nhận thanh toán thành công. Đơn Chờ, Đã hủy hoặc Hết hạn đều nhận (BR-PR-17); đơn đã thanh toán hoặc thất
     * bại thì không đổi. Trả số đơn đã đổi.
     */
    public int markPaid(UUID orderId, Instant now, Instant startsAt, Instant endsAt, String transactionNo,
            String bankCode, Instant payDate) {
        return jdbc.sql("""
                UPDATE pro_orders
                SET status = 'paid', paid_at = :now, starts_at = :starts, ends_at = :ends,
                    vnpay_transaction_no = :txn, vnpay_response_code = '00', vnpay_bank_code = :bank,
                    vnpay_pay_date = :payDate
                WHERE id = :id AND status IN ('pending', 'canceled', 'expired')""")
                .param("id", orderId).param("now", Timestamp.from(now)).param("starts", Timestamp.from(startsAt))
                .param("ends", Timestamp.from(endsAt)).param("txn", transactionNo).param("bank", bankCode)
                .param("payDate", payDate == null ? null : Timestamp.from(payDate))
                .update();
    }

    /** Học viên hủy trên cổng VNPAY: chỉ đơn đang chờ đổi sang Đã hủy. */
    public int markCanceled(UUID orderId, Instant now, String responseCode) {
        return jdbc.sql("""
                UPDATE pro_orders SET status = 'canceled', canceled_at = :now, vnpay_response_code = :code
                WHERE id = :id AND status = 'pending'""")
                .param("id", orderId).param("now", Timestamp.from(now)).param("code", responseCode)
                .update();
    }

    /** VNPAY báo giao dịch không thành công: chỉ đơn đang chờ đổi sang Thất bại, kèm mã phản hồi. */
    public int markFailed(UUID orderId, String responseCode) {
        return jdbc.sql("""
                UPDATE pro_orders SET status = 'failed', vnpay_response_code = :code
                WHERE id = :id AND status = 'pending'""")
                .param("id", orderId).param("code", responseCode)
                .update();
    }

    /** Đơn chờ quá hạn giữ chỗ chuyển sang Hết hạn (BR-PR-12); {@code userId} null là mọi học viên. */
    public int expireStale(UUID userId, Instant now) {
        return jdbc.sql("""
                UPDATE pro_orders SET status = 'expired'
                WHERE status = 'pending' AND expires_at <= :now AND (CAST(:user AS uuid) IS NULL OR user_id = :user)""")
                .param("user", userId).param("now", Timestamp.from(now))
                .update();
    }

    private static OrderRow row(ResultSet rs, int n) throws SQLException {
        return new OrderRow(rs.getObject("id", UUID.class), rs.getObject("user_id", UUID.class),
                rs.getObject("plan_id", UUID.class), rs.getString("plan_name"), rs.getInt("months"), rs.getInt("credits_per_month"),
                rs.getInt("amount_vnd"), rs.getString("kind"), rs.getString("status"),
                rs.getString("vnpay_response_code"), rs.getString("vnpay_transaction_no"),
                rs.getString("vnpay_bank_code"), instant(rs, "vnpay_pay_date"), instant(rs, "created_at"),
                instant(rs, "expires_at"), instant(rs, "paid_at"), instant(rs, "canceled_at"),
                instant(rs, "starts_at"), instant(rs, "ends_at"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp value = rs.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    private static Instant instant(ResultSet rs, int column) throws SQLException {
        Timestamp value = rs.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }
}
