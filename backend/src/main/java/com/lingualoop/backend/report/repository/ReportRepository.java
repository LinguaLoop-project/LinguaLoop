package com.lingualoop.backend.report.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

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

    private static final String INSERT_COLUMNS = ", reason, suggested_fix, fix_field, description, status, "
            + "content_snapshot, created_at, status_changed_at) ";
    private static final String INSERT_VALUES = ", :reason, :fix, :fixField, :description, :status, ";

    // Mọi câu lệnh là hằng chọn theo loại nội dung, giá trị lọc truyền bằng tham số (Sonar java:S2077).

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
        String sql = type == ReportTargetType.SENTENCE
                ? "SELECT EXISTS (SELECT 1 FROM content_reports WHERE reporter_id = :reporter AND sentence_id = :target "
                        + "AND reason = :reason AND status IN ('waiting_teacher','waiting_admin'))"
                : "SELECT EXISTS (SELECT 1 FROM content_reports WHERE reporter_id = :reporter AND card_id = :target "
                        + "AND reason = :reason AND status IN ('waiting_teacher','waiting_admin'))";
        return jdbc.sql(sql)
                .param("reporter", reporterId).param("target", targetId).param("reason", reason)
                .query(Boolean.class).single();
    }

    /**
     * Lưu báo cáo kèm bản chụp nội dung lấy ngay trong cùng câu lệnh (BR-BC-10). Rỗng nếu nội dung vừa thôi hiển thị.
     */
    public Optional<UUID> insert(UUID reporterId, ReportTargetType type, UUID targetId, String reason,
            ReportStatus status, String suggestedFix, String fixField, String description, Instant at) {
        String sql = type == ReportTargetType.SENTENCE
                ? "INSERT INTO content_reports (reporter_id, sentence_id" + INSERT_COLUMNS + "SELECT :reporter, s.id"
                        + INSERT_VALUES + SENTENCE_FIELDS + ", :at, :at " + SENTENCE_FROM + VISIBLE_SENTENCE
                        + " RETURNING id"
                : "INSERT INTO content_reports (reporter_id, card_id" + INSERT_COLUMNS + "SELECT :reporter, c.id"
                        + INSERT_VALUES + CARD_FIELDS + ", :at, :at " + CARD_FROM + VISIBLE_CARD + " RETURNING id";
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
        String sql = query.oldestFirst()
                ? ITEM_SELECT + BASE_FROM + FILTER_WHERE + GROUP_BY + FILTER_HAVING
                        + " ORDER BY min(cr.created_at) ASC, 1 LIMIT :limit OFFSET :offset"
                : ITEM_SELECT + BASE_FROM + FILTER_WHERE + GROUP_BY + FILTER_HAVING
                        + " ORDER BY max(cr.created_at) DESC, 1 LIMIT :limit OFFSET :offset";
        return jdbc.sql(sql)
                .params(filterParams(scope, query, window)).param("limit", limit).param("offset", offset)
                .query(ReportRepository::item).list();
    }

    /** Giáo viên chủ của mọi nội dung từng bị báo, theo tên (AC-XL-09). */
    public List<ReportView.Owner> findOwners() {
        return jdbc.sql("SELECT DISTINCT o.id, o.display_name AS name " + BASE_FROM
                + " WHERE o.id IS NOT NULL ORDER BY name")
                .query(ReportView.Owner.class).list();
    }

    public long countGroups(Scope scope, ReportListQuery query, Window window) {
        return jdbc.sql("SELECT count(*) FROM (SELECT 1 " + BASE_FROM + FILTER_WHERE + GROUP_BY + FILTER_HAVING + ") t")
                .params(filterParams(scope, query, window))
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
        // Tên cột là tham số (mảng), so trên cùng bản dựng jsonb với bản chụp nên không ghép tên cột vào câu lệnh.
        String sql = type == ReportTargetType.SENTENCE
                ? "SELECT cr.content_snapshot IS NULL OR EXISTS (SELECT 1 FROM unnest(ARRAY[:cols]::text[]) AS f(col) "
                        + "WHERE (" + SENTENCE_FIELDS + " ->> f.col) IS DISTINCT FROM (cr.content_snapshot ->> f.col)) "
                        + "FROM content_reports cr JOIN sentences s ON s.id = cr.sentence_id WHERE cr.id = :id"
                : "SELECT cr.content_snapshot IS NULL OR EXISTS (SELECT 1 FROM unnest(ARRAY[:cols]::text[]) AS f(col) "
                        + "WHERE (" + CARD_FIELDS + " ->> f.col) IS DISTINCT FROM (cr.content_snapshot ->> f.col)) "
                        + "FROM content_reports cr JOIN vocab_cards c ON c.id = cr.card_id WHERE cr.id = :id";
        return jdbc.sql(sql)
                .param("id", reportId).param("cols", columns)
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

    /** Từ chối mọi báo cáo đang mở của một học viên, chỉ của học viên đó (BR-XL-14); kèm trạng thái trước khi đóng. */
    public List<ClosedReport> rejectOpenByReporter(UUID reporterId, UUID actorId, String note, Instant at) {
        return jdbc.sql("""
                UPDATE content_reports cr
                SET status = 'rejected', handled_by = :actor, handled_at = :at, handling_note = :note,
                    status_changed_at = :at
                FROM content_reports old
                WHERE old.id = cr.id AND cr.reporter_id = :reporter AND cr.status IN ('waiting_teacher','waiting_admin')
                RETURNING cr.id, old.status AS old_status""")
                .param("reporter", reporterId).param("actor", actorId).param("note", note)
                .param("at", Timestamp.from(at))
                .query(ReportRepository::closed).list();
    }

    /**
     * Báo cáo cho nhật ký (BR-NK-03): câu hoặc từ bị báo cáo, bài học hoặc bộ thẻ chứa nó. Câu, thẻ đã xóa
     * mềm vẫn đọc được.
     */
    public record AuditSubject(UUID id, String content, boolean sentence, UUID containerId) {
    }

    public List<AuditSubject> findAuditSubjects(List<UUID> reportIds) {
        return jdbc.sql("""
                SELECT cr.id, COALESCE(s.text_en, c.word) AS content, cr.sentence_id IS NOT NULL AS sentence,
                       COALESCE(s.lesson_id, c.deck_id) AS container_id
                FROM content_reports cr
                LEFT JOIN sentences s ON s.id = cr.sentence_id
                LEFT JOIN vocab_cards c ON c.id = cr.card_id
                WHERE cr.id IN (:ids)""")
                .param("ids", reportIds)
                .query((rs, n) -> new AuditSubject(rs.getObject("id", UUID.class), rs.getString("content"),
                        rs.getBoolean("sentence"), rs.getObject("container_id", UUID.class)))
                .list();
    }

    /** Dòng trả về của câu lệnh đóng báo cáo: id và trạng thái trước khi đóng (đọc từ bản tự join {@code old}). */
    static ClosedReport closed(ResultSet rs, int n) throws SQLException {
        return new ClosedReport(rs.getObject("id", UUID.class),
                ReportStatus.fromValue(rs.getString("old_status")).orElseThrow());
    }

    // ---------------------------------------------------------------- hỗ trợ

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

    /**
     * Điều kiện lọc danh sách (UC-XL-01): mỗi bộ lọc bị bỏ qua khi tham số của nó là {@code null} hoặc {@code false},
     * nên câu lệnh luôn là hằng.
     */
    private static final String FILTER_WHERE = """
             WHERE (CAST(:teacher AS uuid) IS NULL OR (COALESCE(l.owner_id, d.owner_id) = :teacher
                       AND cr.reason <> 'offensive'
                       AND COALESCE(l.deleted_at, d.deleted_at) IS NULL
                       AND COALESCE(s.deleted_at, c.deleted_at) IS NULL))
               AND (CAST(:status AS text) IS NULL OR cr.status = :status)
               AND (CAST(:targetType AS text) IS NULL
                    OR (:targetType = 'sentence' AND cr.sentence_id IS NOT NULL)
                    OR (:targetType = 'card' AND cr.card_id IS NOT NULL))
               AND (CAST(:reason AS text) IS NULL OR cr.reason = :reason)
               AND (CAST(:pattern AS text) IS NULL OR lower(COALESCE(l.title, d.name)) LIKE :pattern ESCAPE '\\')
               AND (CAST(:owner AS uuid) IS NULL OR COALESCE(l.owner_id, d.owner_id) = :owner)
               AND (CAST(:reporter AS uuid) IS NULL OR cr.reporter_id = :reporter)
               AND (NOT :noHandler OR (cr.status = 'waiting_teacher' AND (o.id IS NULL OR o.locked_at IS NOT NULL)))
               AND (NOT :frequentRejected OR (cr.status IN ('waiting_teacher','waiting_admin') AND cr.reporter_id IN (
                        SELECT reporter_id FROM content_reports
                        WHERE status = 'rejected' AND handled_at >= :rejectedSince
                        GROUP BY reporter_id HAVING count(*) >= :rejectedThreshold)))
            """;
    private static final String FILTER_HAVING =
            " HAVING (NOT :overdue OR (cr.status = 'waiting_teacher' AND min(cr.created_at) < :overdueBefore))";

    /** Tham số của {@link #FILTER_WHERE} và {@link #FILTER_HAVING}; giáo viên chỉ thấy báo cáo của mình (BR-XL-03, BR-XL-08). */
    private static Map<String, Object> filterParams(Scope scope, ReportListQuery query, Window window) {
        Map<String, Object> params = new HashMap<>();
        params.put("overdueBefore", Timestamp.from(window.overdueBefore()));
        params.put("teacher", scope.teacherId());
        params.put("status", query.status() == null ? null : query.status().value());
        params.put("targetType", query.targetType() == null ? null
                : query.targetType() == ReportTargetType.SENTENCE ? "sentence" : "card");
        params.put("reason", query.reason() == null ? null : query.reason().value());
        params.put("pattern", query.q() == null || query.q().isBlank() ? null : containsPattern(query.q()));
        params.put("owner", query.ownerId());
        params.put("reporter", query.reporterId());
        params.put("noHandler", query.noHandler());
        params.put("frequentRejected", query.frequentRejected());
        params.put("rejectedSince", Timestamp.from(window.rejectedSince()));
        params.put("rejectedThreshold", window.rejectedThreshold());
        params.put("overdue", query.overdue());
        return params;
    }

    /** Mẫu LIKE "chứa chuỗi", chữ thường, đã thoát {@code %}, {@code _} và {@code \}. */
    private static String containsPattern(String q) {
        String escaped = q.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
