package com.lingualoop.backend.audit.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.audit.dto.AuditLogView;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditActorRole;
import com.lingualoop.backend.audit.enums.AuditEntityType;

import lombok.RequiredArgsConstructor;

/**
 * Truy vấn chỉ đọc cho màn nhật ký (UC-NK-01). Câu lệnh là hằng, giá trị lọc truyền bằng tham số. Bảng
 * {@code users} chỉ được đọc để lấy tên hiển thị của người thực hiện lúc ghi nhật ký.
 */
@Repository
@RequiredArgsConstructor
public class AuditLogQueryRepository {

    private static final String ROW = """
            SELECT id, action, target_type, target_id, target_name, parent_type, parent_id, actor_id, actor_name,
                   actor_role, changes IS NOT NULL AS has_changes, created_at
            FROM audit_logs
            """;

    /** Các điều kiện lọc kết hợp với nhau (BR-NK-04); tìm theo tên đối tượng hoặc tên người thực hiện. */
    private static final String FILTERS = """
            WHERE (CAST(:action AS text) IS NULL OR action = CAST(:action AS text))
              AND (CAST(:targetType AS text) IS NULL OR target_type = CAST(:targetType AS text))
              AND (CAST(:actorRole AS text) IS NULL OR actor_role = CAST(:actorRole AS text))
              AND (CAST(:since AS timestamptz) IS NULL OR created_at >= CAST(:since AS timestamptz))
              AND (CAST(:pattern AS text) IS NULL
                   OR lower(target_name) LIKE CAST(:pattern AS text) ESCAPE '\\'
                   OR lower(actor_name) LIKE CAST(:pattern AS text) ESCAPE '\\')
            """;

    private static final String NEWEST_FIRST = " ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset";

    private final JdbcClient jdbc;

    /** Bộ lọc danh sách nhật ký; mọi trường {@code null} là không lọc. {@code pattern} lấy từ {@code LikePatterns}. */
    public record Filter(AuditAction action, AuditEntityType targetType, AuditActorRole actorRole, Instant since,
            String pattern) {
    }

    public List<AuditLogView.Row> find(Filter filter, int limit, long offset) {
        return jdbc.sql(ROW + FILTERS + NEWEST_FIRST).params(params(filter)).param("limit", limit)
                .param("offset", offset).query(AuditLogQueryRepository::row).list();
    }

    public long count(Filter filter) {
        return jdbc.sql("SELECT count(*) FROM audit_logs " + FILTERS).params(params(filter)).query(Long.class)
                .single();
    }

    /** Tên hiển thị hiện tại của tài khoản, để lưu vào nhật ký tại thời điểm ghi (BR-NK-03). */
    public Optional<String> findDisplayName(UUID userId) {
        return jdbc.sql("SELECT display_name FROM users WHERE id = :id").param("id", userId).query(String.class)
                .optional();
    }

    private static Map<String, Object> params(Filter f) {
        Map<String, Object> params = new HashMap<>();
        params.put("action", f.action() == null ? null : f.action().value());
        params.put("targetType", f.targetType() == null ? null : f.targetType().value());
        params.put("actorRole", f.actorRole() == null ? null : f.actorRole().value());
        params.put("since", f.since() == null ? null : Timestamp.from(f.since()));
        params.put("pattern", f.pattern());
        return params;
    }

    /** Một dòng của {@link #ROW}. */
    private static AuditLogView.Row row(ResultSet rs, int n) throws SQLException {
        String parentType = rs.getString("parent_type");
        return new AuditLogView.Row(rs.getLong("id"),
                AuditAction.fromValue(rs.getString("action")).orElseThrow(),
                AuditEntityType.fromValue(rs.getString("target_type")).orElseThrow(),
                rs.getObject("target_id", UUID.class), rs.getString("target_name"),
                parentType == null ? null : AuditEntityType.fromValue(parentType).orElseThrow(),
                rs.getObject("parent_id", UUID.class), rs.getObject("actor_id", UUID.class),
                rs.getString("actor_name"), rs.getString("actor_role"), rs.getBoolean("has_changes"),
                instant(rs, "created_at"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp ts = rs.getTimestamp(column);
        return ts == null ? null : ts.toInstant();
    }
}
