package com.lingualoop.backend.report.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.report.dto.ReportView;
import com.lingualoop.backend.report.dto.request.ReportListQuery;
import com.lingualoop.backend.report.enums.ReportStatus;
import com.lingualoop.backend.report.enums.ReportTargetType;

import lombok.RequiredArgsConstructor;

/**
 * Đọc và ghi {@code content_reports}. Câu, thẻ, bài học, bộ thẻ và người dùng chỉ được đọc qua JOIN để gộp, lọc và phân
 * trang trong một truy vấn; bảng của feature khác không bị ghi ở đây. Các báo cáo cùng nội dung, cùng lý do và cùng
 * trạng thái là một dòng (BR-XL-06); thao tác trên một báo cáo áp dụng cho cả dòng của nó.
 */
@Repository
@RequiredArgsConstructor
public class ReportRepository {

    /** Giá trị các cột được chụp của câu (bí danh {@code s}) và của thẻ (bí danh {@code c}), BR-BC-10. */
    static final String SENTENCE_FIELDS = """
            jsonb_build_object('text_en', s.text_en, 'ipa_us', s.ipa_us, 'ipa_uk', s.ipa_uk, 'text_vi', s.text_vi,
                               'start_ms', s.start_ms::text, 'end_ms', s.end_ms::text)""";
    static final String CARD_FIELDS = """
            jsonb_build_object('word', c.word, 'ipa_us', c.ipa_us, 'ipa_uk', c.ipa_uk, 'meaning_vi', c.meaning_vi,
                               'definition_en', c.definition_en, 'definition_vi', c.definition_vi,
                               'example_en', c.example_en, 'example_vi', c.example_vi, 'image_url', c.image_url)""";

    /** Câu hoặc thẻ đang hiển thị cho học viên: bài học hoặc bộ thư viện đã xuất bản, chưa xóa (BR-BC-01). */
    private static final String SENTENCE_FROM = " FROM sentences s JOIN lessons l ON l.id = s.lesson_id ";
    private static final String VISIBLE_SENTENCE = """
            WHERE s.id = :target AND s.deleted_at IS NULL
              AND l.kind = 'library' AND l.status = 'published' AND l.deleted_at IS NULL""";
    private static final String CARD_FROM = """
             FROM vocab_cards c
            JOIN vocab_groups g ON g.id = c.group_id
            JOIN vocab_decks d ON d.id = c.deck_id
            """;
    private static final String VISIBLE_CARD = """
            WHERE c.id = :target AND c.deleted_at IS NULL AND g.deleted_at IS NULL
              AND d.kind = 'library' AND d.status = 'published' AND d.deleted_at IS NULL""";

    static final String BASE_FROM = """
            FROM content_reports cr
            LEFT JOIN sentences s ON s.id = cr.sentence_id
            LEFT JOIN lessons l ON l.id = s.lesson_id
            LEFT JOIN vocab_cards c ON c.id = cr.card_id
            LEFT JOIN vocab_decks d ON d.id = c.deck_id
            LEFT JOIN users o ON o.id = COALESCE(l.owner_id, d.owner_id)
            """;

    private static final String ITEM_SELECT = """
            SELECT (array_agg(cr.id ORDER BY cr.created_at DESC, cr.id DESC))[1] AS id,
                   CASE WHEN s.id IS NOT NULL THEN 'sentence' ELSE 'card' END AS target_type,
                   COALESCE(s.id, c.id) AS target_id,
                   COALESCE(s.text_en, c.word) AS content,
                   COALESCE(l.id, d.id) AS container_id,
                   COALESCE(l.title, d.name) AS container_name,
                   cr.reason, count(*) AS report_count,
                   min(cr.created_at) AS first_reported_at, max(cr.created_at) AS last_reported_at, cr.status,
                   (cr.status = 'waiting_teacher' AND min(cr.created_at) < :overdueBefore) AS overdue,
                   o.id AS owner_id, o.display_name AS owner_name,
                   (o.id IS NULL OR o.locked_at IS NOT NULL) AS no_handler,
                   (COALESCE(l.deleted_at, d.deleted_at) IS NOT NULL) AS container_deleted
            """;

    private static final String GROUP_BY = " GROUP BY s.id, c.id, l.id, d.id, o.id, cr.reason, cr.status";

    /** Các báo cáo cùng dòng với báo cáo {@code :id} (cùng nội dung, lý do, trạng thái). */
    private static final String SAME_GROUP = """
            (COALESCE(cr.sentence_id, cr.card_id), cr.reason, cr.status) =
            (SELECT COALESCE(x.sentence_id, x.card_id), x.reason, x.status FROM content_reports x WHERE x.id = :id)""";

    private final JdbcClient jdbc;

    // ---------------------------------------------------------------- gửi báo cáo (UC-BC-01)

    /** Giá trị hiện tại các cột của câu hoặc thẻ nếu nội dung đang hiển thị cho học viên, rỗng nếu không. */
    public Optional<Map<String, String>> findVisibleContent(ReportTargetType type, UUID targetId) {
        boolean sentence = type == ReportTargetType.SENTENCE;
        String sql = "SELECT e.key, e.value " + (sentence ? SENTENCE_FROM : CARD_FROM)
                + " CROSS JOIN LATERAL jsonb_each_text(" + (sentence ? SENTENCE_FIELDS : CARD_FIELDS) + ") e "
                + (sentence ? VISIBLE_SENTENCE : VISIBLE_CARD);
        Map<String, String> fields = toMap(jdbc.sql(sql).param("target", targetId)
                .query((rs, n) -> Map.entry(rs.getString("key"), Optional.ofNullable(rs.getString("value"))))
                .list());
        return fields.isEmpty() ? Optional.empty() : Optional.of(fields);
    }

    /** Học viên đã có báo cáo cùng lý do, chưa đóng, về đúng nội dung này (BR-BC-08). */
    public boolean existsOpen(UUID reporterId, ReportTargetType type, UUID targetId, String reason) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM content_reports WHERE reporter_id = :reporter AND "
                + targetColumn(type) + " = :target AND reason = :reason "
                + "AND status IN ('waiting_teacher','waiting_admin'))")
                .param("reporter", reporterId).param("target", targetId).param("reason", reason)
                .query(Boolean.class).single();
    }

    /**
     * Lưu báo cáo kèm bản chụp nội dung lấy ngay trong cùng câu lệnh (BR-BC-10). Rỗng nếu nội dung vừa thôi hiển thị.
     */
    public Optional<UUID> insert(UUID reporterId, ReportTargetType type, UUID targetId, String reason,
            ReportStatus status, String suggestedFix, String fixField, String description, Instant at) {
        boolean sentence = type == ReportTargetType.SENTENCE;
        String sql = "INSERT INTO content_reports (reporter_id, " + targetColumn(type)
                + ", reason, suggested_fix, fix_field, description, status, content_snapshot, created_at, status_changed_at) "
                + "SELECT :reporter, " + (sentence ? "s.id" : "c.id")
                + ", :reason, :fix, :fixField, :description, :status, " + (sentence ? SENTENCE_FIELDS : CARD_FIELDS)
                + ", :at, :at " + (sentence ? SENTENCE_FROM + VISIBLE_SENTENCE : CARD_FROM + VISIBLE_CARD)
                + " RETURNING id";
        return jdbc.sql(sql)
                .param("reporter", reporterId).param("target", targetId).param("reason", reason)
                .param("fix", suggestedFix, Types.VARCHAR).param("fixField", fixField, Types.VARCHAR)
                .param("description", description, Types.VARCHAR).param("status", status.value())
                .param("at", Timestamp.from(at))
                .query(UUID.class).optional();
    }

    // ---------------------------------------------------------------- danh sách và chi tiết (UC-XL-01)

    /** Phạm vi xem: {@code teacherId} có giá trị là danh sách của giáo viên đó (BR-XL-03), null là quản trị viên. */
    public record Scope(UUID teacherId) {

        public static Scope admin() {
            return new Scope(null);
        }

        public static Scope teacher(UUID teacherId) {
            return new Scope(teacherId);
        }
    }

    /** Mốc thời gian dùng khi lọc: quá hạn (BR-XL-11) và số báo cáo bị từ chối gần đây (BR-XL-14). */
    public record Window(Instant overdueBefore, Instant rejectedSince, int rejectedThreshold) {
    }

    public List<ReportView.Item> findGroups(Scope scope, ReportListQuery query, Window window, int limit,
            long offset) {
        Filter filter = Filter.of(scope, query, window);
        String order = query.oldestFirst() ? " ORDER BY min(cr.created_at) ASC, 1" : " ORDER BY max(cr.created_at) DESC, 1";
        return jdbc.sql(ITEM_SELECT + BASE_FROM + filter.where() + GROUP_BY + filter.having() + order
                + " LIMIT :limit OFFSET :offset")
                .params(filter.params()).param("limit", limit).param("offset", offset)
                .query(ReportRepository::item).list();
    }

    /** Giáo viên chủ của mọi nội dung từng bị báo, theo tên (AC-XL-09). */
    public List<ReportView.Owner> findOwners() {
        return jdbc.sql("SELECT DISTINCT o.id, o.display_name AS name " + BASE_FROM
                + " WHERE o.id IS NOT NULL ORDER BY name")
                .query(ReportView.Owner.class).list();
    }

    public long countGroups(Scope scope, ReportListQuery query, Window window) {
        Filter filter = Filter.of(scope, query, window);
        return jdbc.sql("SELECT count(*) FROM (SELECT 1 " + BASE_FROM + filter.where() + GROUP_BY + filter.having()
                + ") t")
                .params(filter.params())
                .query(Long.class).single();
    }

    /** Dòng chứa báo cáo {@code reportId}, rỗng nếu báo cáo không tồn tại. */
    public Optional<ReportView.Item> findGroup(UUID reportId, Instant overdueBefore) {
        return jdbc.sql(ITEM_SELECT + BASE_FROM + " WHERE " + SAME_GROUP + GROUP_BY)
                .param("id", reportId).param("overdueBefore", Timestamp.from(overdueBefore))
                .query(ReportRepository::item).optional();
    }

    /** Từng báo cáo trong dòng của {@code reportId}, mới nhất trước; chưa có số liệu người báo. */
    public List<ReportView.Entry> findGroupEntries(UUID reportId) {
        return jdbc.sql("""
                SELECT cr.id, cr.created_at, cr.suggested_fix, cr.fix_field, cr.description, cr.status, cr.handled_at,
                       h.display_name AS handled_by, cr.handling_note, cr.reporter_id, r.display_name AS reporter_name
                FROM content_reports cr
                JOIN users r ON r.id = cr.reporter_id
                LEFT JOIN users h ON h.id = cr.handled_by
                WHERE """ + SAME_GROUP + " ORDER BY cr.created_at DESC, cr.id DESC")
                .param("id", reportId)
                .query((rs, n) -> new ReportView.Entry(rs.getObject("id", UUID.class), instant(rs, "created_at"),
                        rs.getString("suggested_fix"), rs.getString("fix_field"), rs.getString("description"),
                        rs.getString("status"),
                        instant(rs, "handled_at"), rs.getString("handled_by"), rs.getString("handling_note"),
                        rs.getObject("reporter_id", UUID.class), rs.getString("reporter_name"), null))
                .list();
    }

    /** Số báo cáo đã gửi và số bị từ chối từ {@code since} của từng học viên (BR-XL-14). */
    public Map<UUID, ReportView.ReporterStats> reporterStats(Collection<UUID> reporterIds, Instant since) {
        if (reporterIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, ReportView.ReporterStats> stats = new HashMap<>();
        jdbc.sql("""
                SELECT reporter_id,
                       count(*) FILTER (WHERE created_at >= :since) AS submitted,
                       count(*) FILTER (WHERE status = 'rejected' AND handled_at >= :since) AS rejected
                FROM content_reports WHERE reporter_id IN (:ids) GROUP BY reporter_id""")
                .param("ids", reporterIds).param("since", Timestamp.from(since))
                .query(rs -> {
                    stats.put(rs.getObject("reporter_id", UUID.class),
                            new ReportView.ReporterStats(rs.getLong("submitted"), rs.getLong("rejected")));
                });
        return stats;
    }

    /** Bản chụp nội dung lúc gửi báo cáo; rỗng với báo cáo tạo trước khi có bản chụp. */
    public Map<String, String> snapshotOf(UUID reportId) {
        return toMap(jdbc.sql("""
                SELECT e.key, e.value FROM content_reports cr
                CROSS JOIN LATERAL jsonb_each_text(cr.content_snapshot) e WHERE cr.id = :id""")
                .param("id", reportId)
                .query((rs, n) -> Map.entry(rs.getString("key"), Optional.ofNullable(rs.getString("value"))))
                .list());
    }

    /** Giá trị hiện tại của câu hoặc thẻ, kể cả khi đã xóa hay thôi xuất bản. */
    public Map<String, String> currentContent(ReportTargetType type, UUID targetId) {
        String sql = type == ReportTargetType.SENTENCE
                ? "SELECT e.key, e.value FROM sentences s CROSS JOIN LATERAL jsonb_each_text(" + SENTENCE_FIELDS
                        + ") e WHERE s.id = :target"
                : "SELECT e.key, e.value FROM vocab_cards c CROSS JOIN LATERAL jsonb_each_text(" + CARD_FIELDS
                        + ") e WHERE c.id = :target";
        return toMap(jdbc.sql(sql).param("target", targetId)
                .query((rs, n) -> Map.entry(rs.getString("key"), Optional.ofNullable(rs.getString("value"))))
                .list());
    }

    // ---------------------------------------------------------------- xử lý (UC-XL-02, UC-XL-03)

    /**
     * Ít nhất một cột trong {@code columns} hiện khác bản chụp của báo cáo {@code reportId} (BR-XL-05). Báo cáo không
     * có bản chụp được coi là đã sửa. {@code columns} chỉ lấy từ {@code ReportReason}, không từ dữ liệu người dùng.
     */
    public boolean hasChanged(UUID reportId, ReportTargetType type, List<String> columns) {
        String alias = type == ReportTargetType.SENTENCE ? "s" : "c";
        String changed = columns.stream()
                .map(col -> "(" + alias + "." + col + ")::text IS DISTINCT FROM cr.content_snapshot->>'" + col + "'")
                .collect(Collectors.joining(" OR "));
        String join = type == ReportTargetType.SENTENCE ? "JOIN sentences s ON s.id = cr.sentence_id"
                : "JOIN vocab_cards c ON c.id = cr.card_id";
        return jdbc.sql("SELECT cr.content_snapshot IS NULL OR " + changed + " FROM content_reports cr " + join
                + " WHERE cr.id = :id")
                .param("id", reportId)
                .query(Boolean.class).optional().orElse(false);
    }

    /**
     * Đóng cả dòng của {@code reportId} nếu dòng còn ở trạng thái {@code from}; trả về mã các báo cáo đã đóng, rỗng nếu
     * dòng đã được xử lý ở nơi khác. {@code actorId} null là "Hệ thống".
     */
    public List<UUID> closeGroup(UUID reportId, ReportStatus from, ReportStatus to, UUID actorId, String note,
            Instant at) {
        return jdbc.sql("""
                UPDATE content_reports cr
                SET status = :to, handled_by = :actor, handled_at = :at, handling_note = :note, status_changed_at = :at
                WHERE cr.status = :from
                  AND (COALESCE(cr.sentence_id, cr.card_id), cr.reason) =
                      (SELECT COALESCE(x.sentence_id, x.card_id), x.reason FROM content_reports x
                       WHERE x.id = :id AND x.status = :from)
                RETURNING cr.id""")
                .param("id", reportId).param("from", from.value()).param("to", to.value())
                .param("actor", actorId, Types.OTHER).param("note", note).param("at", Timestamp.from(at))
                .query(UUID.class).list();
    }

    /** Từ chối mọi báo cáo đang mở của một học viên, chỉ của học viên đó (BR-XL-14). */
    public List<UUID> rejectOpenByReporter(UUID reporterId, UUID actorId, String note, Instant at) {
        return jdbc.sql("""
                UPDATE content_reports
                SET status = 'rejected', handled_by = :actor, handled_at = :at, handling_note = :note,
                    status_changed_at = :at
                WHERE reporter_id = :reporter AND status IN ('waiting_teacher','waiting_admin')
                RETURNING id""")
                .param("reporter", reporterId).param("actor", actorId).param("note", note)
                .param("at", Timestamp.from(at))
                .query(UUID.class).list();
    }

    // ---------------------------------------------------------------- hỗ trợ

    private static String targetColumn(ReportTargetType type) {
        return type == ReportTargetType.SENTENCE ? "sentence_id" : "card_id";
    }

    private static Map<String, String> toMap(List<Map.Entry<String, Optional<String>>> entries) {
        Map<String, String> map = new LinkedHashMap<>();
        entries.forEach(e -> map.put(e.getKey(), e.getValue().orElse(null)));
        return map;
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp ts = rs.getTimestamp(column);
        return ts == null ? null : ts.toInstant();
    }

    private static ReportView.Item item(ResultSet rs, int rowNum) throws SQLException {
        return new ReportView.Item(rs.getObject("id", UUID.class), rs.getString("target_type"),
                rs.getObject("target_id", UUID.class), rs.getString("content"),
                rs.getObject("container_id", UUID.class), rs.getString("container_name"), rs.getString("reason"),
                rs.getInt("report_count"), instant(rs, "first_reported_at"), instant(rs, "last_reported_at"),
                rs.getString("status"), rs.getBoolean("overdue"), rs.getObject("owner_id", UUID.class),
                rs.getString("owner_name"), rs.getBoolean("no_handler"), rs.getBoolean("container_deleted"));
    }

    /** Điều kiện WHERE (từng báo cáo) và HAVING (cả dòng) của danh sách, cùng tham số. */
    private record Filter(String where, String having, Map<String, Object> params) {

        static Filter of(Scope scope, ReportListQuery query, Window window) {
            List<String> conds = new ArrayList<>();
            Map<String, Object> params = new HashMap<>();
            params.put("overdueBefore", Timestamp.from(window.overdueBefore()));
            if (scope.teacherId() != null) {
                conds.add("COALESCE(l.owner_id, d.owner_id) = :teacher");
                conds.add("cr.reason <> 'offensive'");
                // Báo cáo của bài học, bộ thẻ, câu hay thẻ đã xóa được ẩn khỏi hàng đợi của giáo viên (BR-XL-08).
                conds.add("COALESCE(l.deleted_at, d.deleted_at) IS NULL");
                conds.add("COALESCE(s.deleted_at, c.deleted_at) IS NULL");
                params.put("teacher", scope.teacherId());
            }
            if (query.status() != null) {
                conds.add("cr.status = :status");
                params.put("status", query.status().value());
            }
            if (query.targetType() != null) {
                conds.add(query.targetType() == ReportTargetType.SENTENCE ? "cr.sentence_id IS NOT NULL"
                        : "cr.card_id IS NOT NULL");
            }
            if (query.reason() != null) {
                conds.add("cr.reason = :reason");
                params.put("reason", query.reason().value());
            }
            if (query.q() != null && !query.q().isBlank()) {
                conds.add("lower(COALESCE(l.title, d.name)) LIKE :pattern ESCAPE '\\'");
                params.put("pattern", containsPattern(query.q()));
            }
            if (query.ownerId() != null) {
                conds.add("COALESCE(l.owner_id, d.owner_id) = :owner");
                params.put("owner", query.ownerId());
            }
            if (query.reporterId() != null) {
                conds.add("cr.reporter_id = :reporter");
                params.put("reporter", query.reporterId());
            }
            if (query.noHandler()) {
                conds.add("cr.status = 'waiting_teacher' AND (o.id IS NULL OR o.locked_at IS NOT NULL)");
            }
            if (query.frequentRejected()) {
                conds.add("""
                        cr.status IN ('waiting_teacher','waiting_admin') AND cr.reporter_id IN (
                            SELECT reporter_id FROM content_reports
                            WHERE status = 'rejected' AND handled_at >= :rejectedSince
                            GROUP BY reporter_id HAVING count(*) >= :rejectedThreshold)""");
                params.put("rejectedSince", Timestamp.from(window.rejectedSince()));
                params.put("rejectedThreshold", window.rejectedThreshold());
            }
            String where = conds.isEmpty() ? "" : " WHERE " + String.join(" AND ", conds);
            String having = query.overdue()
                    ? " HAVING cr.status = 'waiting_teacher' AND min(cr.created_at) < :overdueBefore"
                    : "";
            return new Filter(where, having, params);
        }

        /** Mẫu LIKE "chứa chuỗi", chữ thường, đã thoát {@code %}, {@code _} và {@code \}. */
        private static String containsPattern(String q) {
            String escaped = q.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
            return "%" + escaped + "%";
        }
    }
}
