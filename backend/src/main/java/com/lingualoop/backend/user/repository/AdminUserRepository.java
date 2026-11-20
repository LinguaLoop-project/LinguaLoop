package com.lingualoop.backend.user.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.AdminUserView;
import com.lingualoop.backend.user.dto.ContentTransferView;
import com.lingualoop.backend.user.enums.AccountPlan;
import com.lingualoop.backend.user.enums.AccountStatus;
import com.lingualoop.backend.user.enums.TransferContentType;

import lombok.RequiredArgsConstructor;

/**
 * Truy vấn chỉ đọc cho màn quản trị tài khoản và giao lại nội dung (UC-QT-01, 05, 07). Bài học, bộ thẻ, báo cáo, đơn
 * Pro, phiên đăng nhập và lượt học chỉ được đọc qua JOIN để lọc, đếm và phân trang trong một truy vấn; bảng của feature
 * khác không bị ghi ở đây. Mọi câu lệnh là hằng, giá trị lọc truyền bằng tham số.
 */
@Repository
@RequiredArgsConstructor
public class AdminUserRepository {

    /** Lần hoạt động cuối: đăng nhập hoặc làm mới phiên, lượt luyện câu, phiên học thẻ. */
    private static final String LAST_ACTIVE = """
            GREATEST(
                (SELECT max(t.created_at) FROM auth_refresh_tokens t WHERE t.user_id = u.id),
                (SELECT max(a.created_at) FROM sentence_attempts a WHERE a.user_id = u.id),
                (SELECT max(v.started_at) FROM vocab_sessions v WHERE v.user_id = u.id))""";

    private static final String USER_FILTERS = """
            FROM users u
            LEFT JOIN v_active_pro p ON p.user_id = u.id
            WHERE (CAST(:pattern AS text) IS NULL
                   OR lower(u.display_name) LIKE CAST(:pattern AS text) ESCAPE '\\'
                   OR lower(u.email::text) LIKE CAST(:pattern AS text) ESCAPE '\\')
              AND (CAST(:role AS text) IS NULL OR u.role = CAST(:role AS text))
              AND (CAST(:plan AS text) IS NULL
                   OR (u.role = 'student' AND (CAST(:plan AS text) = 'pro') = (p.user_id IS NOT NULL)))
              AND (CAST(:status AS text) IS NULL
                   OR (CAST(:status AS text) = 'locked') = (u.locked_at IS NOT NULL))
            """;

    private static final String USER_ROW = """
            SELECT u.id, u.display_name, u.email::text AS email, u.role,
                   CASE WHEN u.role <> 'student' THEN NULL WHEN p.user_id IS NOT NULL THEN 'pro' ELSE 'free' END AS plan,
                   u.locked_at IS NOT NULL AS locked, u.created_at,
            """ + LAST_ACTIVE + " AS last_active_at ";

    /** Bài học thư viện chưa xóa và bộ thẻ thư viện chưa xóa của giáo viên, chia theo trạng thái (BR-QT-04). */
    private static final String CONTENT_COUNTS = """
            SELECT
                (SELECT count(*) FROM lessons l WHERE l.owner_id = :id AND l.kind = 'library'
                    AND l.deleted_at IS NULL AND l.status = 'published') AS published_lessons,
                (SELECT count(*) FROM lessons l WHERE l.owner_id = :id AND l.kind = 'library'
                    AND l.deleted_at IS NULL AND l.status = 'draft') AS draft_lessons,
                (SELECT count(*) FROM vocab_decks d WHERE d.owner_id = :id AND d.kind = 'library'
                    AND d.deleted_at IS NULL AND d.status = 'published') AS published_decks,
                (SELECT count(*) FROM vocab_decks d WHERE d.owner_id = :id AND d.kind = 'library'
                    AND d.deleted_at IS NULL AND d.status = 'draft') AS draft_decks,
                (SELECT count(*) FROM content_reports cr
                    LEFT JOIN sentences s ON s.id = cr.sentence_id LEFT JOIN lessons l ON l.id = s.lesson_id
                    LEFT JOIN vocab_cards c ON c.id = cr.card_id LEFT JOIN vocab_decks d ON d.id = c.deck_id
                    WHERE COALESCE(l.owner_id, d.owner_id) = :id
                      AND COALESCE(l.kind, d.kind) = 'library' AND COALESCE(l.deleted_at, d.deleted_at) IS NULL
                      AND cr.status IN ('waiting_teacher', 'waiting_admin')) AS open_reports,
                (SELECT count(*) FROM content_reports cr
                    LEFT JOIN sentences s ON s.id = cr.sentence_id LEFT JOIN lessons l ON l.id = s.lesson_id
                    LEFT JOIN vocab_cards c ON c.id = cr.card_id LEFT JOIN vocab_decks d ON d.id = c.deck_id
                    WHERE COALESCE(l.owner_id, d.owner_id) = :id
                      AND cr.status = 'waiting_teacher') AS waiting_teacher_reports
            """;

    /** Hoạt động học gần đây: lượt luyện câu gộp theo bài, chế độ và ngày; mỗi phiên học thẻ là một mục. */
    private static final String RECENT_ACTIVITIES = """
            SELECT kind, title, count, at FROM (
                SELECT a.mode AS kind, l.title AS title, count(*) AS count, max(a.created_at) AS at
                FROM sentence_attempts a
                JOIN sentences s ON s.id = a.sentence_id
                JOIN lessons l ON l.id = s.lesson_id
                WHERE a.user_id = :id
                GROUP BY a.mode, l.id, l.title, (a.created_at AT TIME ZONE 'UTC')::date
                UNION ALL
                SELECT 'vocab', COALESCE(d.name, ''), 1, v.started_at
                FROM vocab_sessions v
                LEFT JOIN vocab_decks d ON d.id = v.deck_id
                WHERE v.user_id = :id
            ) x
            ORDER BY at DESC
            LIMIT :limit
            """;

    /**
     * Nội dung cần giao (BR-QT-05): bài học và bộ thẻ thư viện Đã xuất bản, chưa xóa của giáo viên bị khóa; bộ thẻ thư
     * viện chưa xóa chưa gán chủ. Số báo cáo đang mở là báo cáo chưa đóng về câu hoặc thẻ của nội dung.
     */
    private static final String TRANSFER_ITEMS = """
            WITH items AS (
                SELECT 'lesson' AS type, l.id, l.title AS name, l.owner_id, u.display_name AS owner_name, u.locked_at,
                       (SELECT count(*) FROM content_reports cr JOIN sentences s ON s.id = cr.sentence_id
                        WHERE s.lesson_id = l.id AND cr.status IN ('waiting_teacher', 'waiting_admin')) AS open_reports
                FROM lessons l
                JOIN users u ON u.id = l.owner_id
                WHERE l.kind = 'library' AND l.status = 'published' AND l.deleted_at IS NULL
                  AND u.locked_at IS NOT NULL
                UNION ALL
                SELECT 'deck', d.id, d.name, d.owner_id, u.display_name, u.locked_at,
                       (SELECT count(*) FROM content_reports cr JOIN vocab_cards c ON c.id = cr.card_id
                        WHERE c.deck_id = d.id AND cr.status IN ('waiting_teacher', 'waiting_admin'))
                FROM vocab_decks d
                LEFT JOIN users u ON u.id = d.owner_id
                WHERE d.kind = 'library' AND d.deleted_at IS NULL
                  AND (d.owner_id IS NULL OR (d.status = 'published' AND u.locked_at IS NOT NULL))
            )
            """;

    private static final String TRANSFER_FILTERS = """
            WHERE (CAST(:pattern AS text) IS NULL OR lower(name) LIKE CAST(:pattern AS text) ESCAPE '\\')
              AND (CAST(:type AS text) IS NULL OR type = CAST(:type AS text))
              AND (NOT :system OR owner_id IS NULL)
              AND (CAST(:ownerId AS uuid) IS NULL OR owner_id = CAST(:ownerId AS uuid))
            """;

    private final JdbcClient jdbc;

    // ---------------------------------------------------------------- danh sách tài khoản (UC-QT-01)

    /** Bộ lọc danh sách tài khoản; {@code pattern} là mẫu LIKE chữ thường đã escape hoặc {@code null}. */
    public record UserFilter(String pattern, Role role, AccountPlan plan, AccountStatus status) {
    }

    public List<AdminUserView.Row> findUsers(UserFilter filter, int limit, long offset) {
        return jdbc.sql(USER_ROW + USER_FILTERS + " ORDER BY u.created_at DESC, u.id DESC LIMIT :limit OFFSET :offset")
                .params(userParams(filter)).param("limit", limit).param("offset", offset)
                .query(AdminUserRepository::userRow).list();
    }

    public long countUsers(UserFilter filter) {
        return jdbc.sql("SELECT count(*) " + USER_FILTERS).params(userParams(filter)).query(Long.class).single();
    }

    // ---------------------------------------------------------------- chi tiết tài khoản

    public Instant lastActiveAt(UUID userId) {
        return jdbc.sql("SELECT " + LAST_ACTIVE + " FROM users u WHERE u.id = :id")
                .param("id", userId).query((rs, n) -> instant(rs, 1)).optional().orElse(null);
    }

    public List<AdminUserView.Activity> recentActivities(UUID userId, int limit) {
        return jdbc.sql(RECENT_ACTIVITIES).param("id", userId).param("limit", limit)
                .query((rs, n) -> new AdminUserView.Activity(rs.getString("kind"), rs.getString("title"),
                        rs.getInt("count"), instant(rs, "at")))
                .list();
    }

    /** Đơn Pro đã thanh toán của học viên, mới nhất trước. */
    public List<AdminUserView.Payment> payments(UUID userId) {
        return jdbc.sql("""
                SELECT id, plan_name, months, amount_vnd, status, created_at, paid_at, starts_at, ends_at
                FROM pro_orders WHERE user_id = :id AND status IN ('paid', 'expired')
                ORDER BY created_at DESC""")
                .param("id", userId)
                .query((rs, n) -> new AdminUserView.Payment(rs.getObject("id", UUID.class),
                        rs.getString("plan_name"), rs.getInt("months"), rs.getInt("amount_vnd"),
                        rs.getString("status"), instant(rs, "created_at"), instant(rs, "paid_at"),
                        instant(rs, "starts_at"), instant(rs, "ends_at")))
                .list();
    }

    public AdminUserView.ContentCounts contentCounts(UUID teacherId) {
        return jdbc.sql(CONTENT_COUNTS).param("id", teacherId)
                .query((rs, n) -> new AdminUserView.ContentCounts(rs.getLong("published_lessons"),
                        rs.getLong("draft_lessons"), rs.getLong("published_decks"), rs.getLong("draft_decks"),
                        rs.getLong("open_reports"), rs.getLong("waiting_teacher_reports")))
                .single();
    }

    // ---------------------------------------------------------------- nội dung cần giao (UC-QT-05)

    /**
     * Bộ lọc nội dung cần giao. {@code system} = chỉ bộ chưa gán chủ; {@code ownerId} = chỉ nội dung của một giáo viên.
     */
    public record ItemFilter(String pattern, TransferContentType type, boolean system, UUID ownerId) {
    }

    public List<ContentTransferView.Item> findTransferItems(ItemFilter filter, int limit, long offset) {
        return jdbc.sql(TRANSFER_ITEMS + "SELECT * FROM items " + TRANSFER_FILTERS
                + " ORDER BY locked_at DESC NULLS LAST, owner_name, lower(name), id LIMIT :limit OFFSET :offset")
                .params(itemParams(filter)).param("limit", limit).param("offset", offset)
                .query((rs, n) -> new ContentTransferView.Item(rs.getString("type"), rs.getObject("id", UUID.class),
                        rs.getString("name"), rs.getObject("owner_id", UUID.class), rs.getString("owner_name"),
                        instant(rs, "locked_at"), rs.getLong("open_reports")))
                .list();
    }

    public long countTransferItems(ItemFilter filter) {
        return jdbc.sql(TRANSFER_ITEMS + "SELECT count(*) FROM items " + TRANSFER_FILTERS)
                .params(itemParams(filter)).query(Long.class).single();
    }

    /** Giáo viên đang giữ nội dung cần giao (và "Hệ thống" với {@code id} null), cho bộ lọc theo giáo viên. */
    public List<ContentTransferView.Owner> findTransferOwners() {
        return jdbc.sql(TRANSFER_ITEMS + """
                SELECT owner_id, max(owner_name) AS owner_name, max(locked_at) AS locked_at, count(*) AS item_count
                FROM items GROUP BY owner_id ORDER BY owner_id IS NULL, max(owner_name)""")
                .query((rs, n) -> new ContentTransferView.Owner(rs.getObject("owner_id", UUID.class),
                        rs.getString("owner_name"), instant(rs, "locked_at"), rs.getLong("item_count")))
                .list();
    }

    // ---------------------------------------------------------------- giáo viên nhận (BR-QT-06)

    /** Giáo viên đang hoạt động, trừ {@code excluded}; tìm theo tên hoặc email, theo tên. */
    public List<ContentTransferView.Recipient> findRecipients(String pattern, List<UUID> excluded, int limit) {
        // Danh sách rỗng không truyền được vào NOT IN: dùng một id không tồn tại.
        List<UUID> ids = excluded.isEmpty() ? List.of(new UUID(0, 0)) : excluded;
        return jdbc.sql("""
                SELECT u.id, u.display_name, u.email::text AS email FROM users u
                WHERE u.role = 'teacher' AND u.locked_at IS NULL AND u.id NOT IN (:excluded)
                  AND (CAST(:pattern AS text) IS NULL
                       OR lower(u.display_name) LIKE CAST(:pattern AS text) ESCAPE '\\'
                       OR lower(u.email::text) LIKE CAST(:pattern AS text) ESCAPE '\\')
                ORDER BY lower(u.display_name), u.id LIMIT :limit""")
                .param("pattern", pattern, Types.VARCHAR).param("excluded", ids).param("limit", limit)
                .query((rs, n) -> new ContentTransferView.Recipient(rs.getObject("id", UUID.class),
                        rs.getString("display_name"), rs.getString("email")))
                .list();
    }

    // ---------------------------------------------------------------- tiện ích

    /** Mẫu LIKE "chứa chuỗi", chữ thường, đã thoát {@code %}, {@code _} và {@code \}; {@code null} khi chuỗi trống. */
    public static String containsPattern(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        String escaped = q.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }

    private static Map<String, Object> userParams(UserFilter filter) {
        Map<String, Object> params = new HashMap<>();
        params.put("pattern", filter.pattern());
        params.put("role", filter.role() == null ? null : filter.role().value());
        params.put("plan", filter.plan() == null ? null : filter.plan().value());
        params.put("status", filter.status() == null ? null : filter.status().value());
        return params;
    }

    private static Map<String, Object> itemParams(ItemFilter filter) {
        Map<String, Object> params = new HashMap<>();
        params.put("pattern", filter.pattern());
        params.put("type", filter.type() == null ? null : filter.type().value());
        params.put("system", filter.system());
        params.put("ownerId", filter.ownerId());
        return params;
    }

    private static AdminUserView.Row userRow(ResultSet rs, int rowNum) throws SQLException {
        return new AdminUserView.Row(rs.getObject("id", UUID.class), rs.getString("display_name"),
                rs.getString("email"), rs.getString("role"), rs.getString("plan"), rs.getBoolean("locked"),
                instant(rs, "created_at"), instant(rs, "last_active_at"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp ts = rs.getTimestamp(column);
        return ts == null ? null : ts.toInstant();
    }

    private static Instant instant(ResultSet rs, int column) throws SQLException {
        Timestamp ts = rs.getTimestamp(column);
        return ts == null ? null : ts.toInstant();
    }
}
