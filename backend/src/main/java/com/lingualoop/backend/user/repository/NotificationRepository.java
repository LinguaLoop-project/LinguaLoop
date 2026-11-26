package com.lingualoop.backend.user.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.user.dto.response.NotificationsResponse;

import lombok.RequiredArgsConstructor;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/** Bảng {@code notifications}: thông báo trong ứng dụng của từng người dùng. */
@Repository
@RequiredArgsConstructor
public class NotificationRepository {

    private static final TypeReference<Map<String, String>> PARAMS = new TypeReference<>() {
    };
    private static final String COLUMNS =
            "id, message, read_at IS NOT NULL AS read, created_at, type, params::text AS params, link";

    private final JdbcClient jdbc;
    private final ObjectMapper json;

    public void insert(UUID userId, String message) {
        jdbc.sql("INSERT INTO notifications (user_id, message) VALUES (:user, :message)")
                .param("user", userId).param("message", message)
                .update();
    }

    /**
     * Thêm thông báo có loại, tham số và đường dẫn. Có {@code dedupeKey} thì mỗi người chỉ có một thông báo với khóa đó:
     * trùng thì không thêm và trả {@code false}.
     */
    public boolean insert(UUID userId, String type, String message, String link, Map<String, String> params,
            String dedupeKey) {
        return jdbc.sql("""
                INSERT INTO notifications (user_id, message, type, params, link, dedupe_key)
                VALUES (:user, :message, :type, CAST(:params AS jsonb), :link, :dedupe)
                ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING""")
                .param("user", userId).param("message", message).param("type", type).param("link", link)
                .param("params", json.writeValueAsString(params == null ? Map.of() : params))
                .param("dedupe", dedupeKey)
                .update() > 0;
    }

    private final RowMapper<NotificationsResponse.Item> mapper = (ResultSet rs, int row) -> toItem(rs);

    private NotificationsResponse.Item toItem(ResultSet rs) throws SQLException {
        Map<String, String> params = json.readValue(rs.getString("params"), PARAMS);
        return new NotificationsResponse.Item(rs.getObject("id", UUID.class), rs.getString("message"),
                rs.getBoolean("read"), rs.getTimestamp("created_at").toInstant(), rs.getString("type"), params,
                rs.getString("link"));
    }

    public List<NotificationsResponse.Item> findLatest(UUID userId, int limit) {
        return jdbc.sql("SELECT " + COLUMNS + """
                 FROM notifications WHERE user_id = :user
                ORDER BY created_at DESC, id DESC LIMIT :limit""")
                .param("user", userId).param("limit", limit)
                .query(mapper).list();
    }

    /** Một trang thông báo từ mới đến cũ; {@code unreadOnly} chỉ lấy thông báo chưa đọc. */
    public List<NotificationsResponse.Item> findPage(UUID userId, boolean unreadOnly, int limit, long offset) {
        return jdbc.sql("SELECT " + COLUMNS + """
                 FROM notifications
                WHERE user_id = :user AND (NOT :unreadOnly OR read_at IS NULL)
                ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset""")
                .param("user", userId).param("unreadOnly", unreadOnly).param("limit", limit).param("offset", offset)
                .query(mapper).list();
    }

    public long countAll(UUID userId, boolean unreadOnly) {
        return jdbc.sql("""
                SELECT count(*) FROM notifications
                WHERE user_id = :user AND (NOT :unreadOnly OR read_at IS NULL)""")
                .param("user", userId).param("unreadOnly", unreadOnly).query(Long.class).single();
    }

    public long countUnread(UUID userId) {
        return jdbc.sql("SELECT count(*) FROM notifications WHERE user_id = :user AND read_at IS NULL")
                .param("user", userId).query(Long.class).single();
    }

    /** Đánh dấu đã đọc một thông báo của đúng người dùng; trả về false nếu không có (của người khác hoặc không tồn tại). */
    public boolean markRead(UUID userId, UUID id, Instant at) {
        return jdbc.sql("UPDATE notifications SET read_at = COALESCE(read_at, :at) WHERE id = :id AND user_id = :user")
                .param("at", Timestamp.from(at)).param("id", id).param("user", userId)
                .update() > 0;
    }

    public void markAllRead(UUID userId, Instant at) {
        jdbc.sql("UPDATE notifications SET read_at = :at WHERE user_id = :user AND read_at IS NULL")
                .param("at", Timestamp.from(at)).param("user", userId)
                .update();
    }

    // ------------------------------------------------------------ tùy chọn loại thông báo (BR-TK-23)

    /** Loại này có bị học viên tắt không; chưa có lựa chọn thì coi là bật. */
    public boolean isEnabled(UUID userId, String type) {
        return jdbc.sql("SELECT enabled FROM notification_preferences WHERE user_id = :user AND type = :type")
                .param("user", userId).param("type", type)
                .query(Boolean.class).optional().orElse(true);
    }

    /** Các lựa chọn đã lưu của học viên (loại -> bật/tắt); loại chưa có dòng dùng mặc định. */
    public Map<String, Boolean> preferences(UUID userId) {
        Map<String, Boolean> result = new java.util.HashMap<>();
        jdbc.sql("SELECT type, enabled FROM notification_preferences WHERE user_id = :user")
                .param("user", userId)
                .query(rs -> {
                    result.put(rs.getString("type"), rs.getBoolean("enabled"));
                });
        return result;
    }

    public void setPreference(UUID userId, String type, boolean enabled) {
        jdbc.sql("""
                INSERT INTO notification_preferences (user_id, type, enabled) VALUES (:user, :type, :enabled)
                ON CONFLICT (user_id, type) DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now()""")
                .param("user", userId).param("type", type).param("enabled", enabled)
                .update();
    }

    // ------------------------------------------------------------ nhắc học định kỳ

    /** Đã gửi thông báo mang khóa chống trùng này cho người dùng chưa (để bỏ qua việc tính toán tốn kém). */
    public boolean hasKey(UUID userId, String dedupeKey) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM notifications WHERE user_id = :user AND dedupe_key = :key)")
                .param("user", userId).param("key", dedupeKey)
                .query(Boolean.class).single();
    }

    /** Học viên đang hoạt động mà giờ địa phương (theo múi giờ của họ) nằm trong [{@code fromHour}, {@code toHour}]. */
    public List<LocalReminderTarget> studentsInLocalHours(Instant now, int fromHour, int toHour) {
        return jdbc.sql("""
                SELECT id, timezone FROM users
                WHERE role = 'student' AND locked_at IS NULL AND onboarded_at IS NOT NULL
                  AND EXTRACT(HOUR FROM (CAST(:now AS timestamptz) AT TIME ZONE timezone)) BETWEEN :from AND :to""")
                .param("now", Timestamp.from(now)).param("from", fromHour).param("to", toHour)
                .query((rs, n) -> new LocalReminderTarget(rs.getObject("id", UUID.class), rs.getString("timezone")))
                .list();
    }

    /** Học viên và múi giờ của họ, để nhắc đúng ngày địa phương. */
    public record LocalReminderTarget(UUID userId, String timezone) {
    }
}
