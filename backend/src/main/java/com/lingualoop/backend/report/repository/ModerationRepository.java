package com.lingualoop.backend.report.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.report.dto.RepublishView;
import com.lingualoop.backend.report.enums.ReportTargetType;

import lombok.RequiredArgsConstructor;

/**
 * Gỡ nội dung do báo cáo, yêu cầu xuất bản lại và tự cập nhật báo cáo (UC-XL-04 đến UC-XL-06). Ghi
 * {@code content_reports}, {@code content_takedowns}, {@code republish_requests}; bài học, câu, bộ thẻ, thẻ và người dùng
 * chỉ được đọc qua JOIN. Loại nội dung của bài học là {@code SENTENCE} (dấu gắn ở bài), của bộ thẻ là {@code CARD}.
 */
@Repository
@RequiredArgsConstructor
public class ModerationRepository {

    private static final String OPEN = "('waiting_teacher','waiting_admin')";

    private final JdbcClient jdbc;

    private static String containerColumn(ReportTargetType type) {
        return type == ReportTargetType.SENTENCE ? "lesson_id" : "deck_id";
    }

    // ---------------------------------------------------------------- dấu "Bị gỡ do báo cáo" (UC-XL-04)

    public boolean isTakenDown(ReportTargetType type, UUID containerId) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM content_takedowns WHERE " + containerColumn(type)
                + " = :id AND cleared_at IS NULL)")
                .param("id", containerId).query(Boolean.class).single();
    }

    /** Số báo cáo Phản cảm đang mở về nội dung của bài học hoặc bộ thẻ (BR-XL-13). */
    public long countOpenOffensive(ReportTargetType type, UUID containerId) {
        String sql = type == ReportTargetType.SENTENCE
                ? "SELECT count(*) FROM content_reports cr JOIN sentences s ON s.id = cr.sentence_id "
                        + "WHERE s.lesson_id = :id AND cr.status = 'waiting_admin'"
                : "SELECT count(*) FROM content_reports cr JOIN vocab_cards c ON c.id = cr.card_id "
                        + "WHERE c.deck_id = :id AND cr.status = 'waiting_admin'";
        return jdbc.sql(sql).param("id", containerId).query(Long.class).single();
    }

    /** Đóng mọi báo cáo Phản cảm đang mở về nội dung của bài học hoặc bộ thẻ, cùng lý do gỡ (BR-XL-13). */
    public List<UUID> closeOpenOffensive(ReportTargetType type, UUID containerId, UUID actorId, String note,
            Instant at) {
        String from = type == ReportTargetType.SENTENCE
                ? " FROM sentences s WHERE s.id = cr.sentence_id AND s.lesson_id = :id"
                : " FROM vocab_cards c WHERE c.id = cr.card_id AND c.deck_id = :id";
        return jdbc.sql("UPDATE content_reports cr SET status = 'resolved', handled_by = :actor, handled_at = :at, "
                + "handling_note = :note, status_changed_at = :at" + from
                + " AND cr.status = 'waiting_admin' RETURNING cr.id")
                .param("id", containerId).param("actor", actorId, Types.OTHER).param("note", note)
                .param("at", Timestamp.from(at))
                .query(UUID.class).list();
    }

    /** Bản chụp hiện tại các câu hoặc thẻ của những báo cáo này, dạng {"<id>": {"<cột>": "<giá trị>"}}. */
    public String snapshotOfReports(ReportTargetType type, List<UUID> reportIds) {
        String sql = type == ReportTargetType.SENTENCE
                ? "SELECT jsonb_object_agg(s.id::text, " + ReportRepository.SENTENCE_FIELDS + ")::text "
                        + "FROM sentences s WHERE s.id IN (SELECT sentence_id FROM content_reports WHERE id IN (:ids))"
                : "SELECT jsonb_object_agg(c.id::text, " + ReportRepository.CARD_FIELDS + ")::text "
                        + "FROM vocab_cards c WHERE c.id IN (SELECT card_id FROM content_reports WHERE id IN (:ids))";
        return jdbc.sql(sql).param("ids", reportIds).query(String.class).optional().orElse("{}");
    }

    /**
     * Gắn dấu cho bài học hoặc bộ thẻ. Đang có dấu thì gộp bản chụp vào dòng đang có và lấy lý do mới; chưa có thì thêm
     * dòng mới.
     */
    public void markTakenDown(ReportTargetType type, UUID containerId, String reason, String snapshotJson,
            UUID actorId, Instant at) {
        String column = containerColumn(type);
        int updated = jdbc.sql("UPDATE content_takedowns SET snapshot = snapshot || CAST(:snap AS jsonb), "
                + "reason = :reason WHERE " + column + " = :id AND cleared_at IS NULL")
                .param("snap", snapshotJson).param("reason", reason).param("id", containerId)
                .update();
        if (updated == 0) {
            jdbc.sql("INSERT INTO content_takedowns (" + column + ", reason, snapshot, taken_down_by, created_at) "
                    + "VALUES (:id, :reason, CAST(:snap AS jsonb), :actor, :at)")
                    .param("id", containerId).param("reason", reason).param("snap", snapshotJson)
                    .param("actor", actorId, Types.OTHER).param("at", Timestamp.from(at))
                    .update();
        }
    }

    // ---------------------------------------------------------------- yêu cầu xuất bản lại (UC-XL-05)

    /** Bài học hoặc bộ thẻ thư viện: chủ, tên, đã xóa chưa. */
    public record ContainerRow(UUID ownerId, String name, boolean deleted) {
    }

    public Optional<ContainerRow> findContainer(ReportTargetType type, UUID containerId) {
        String sql = type == ReportTargetType.SENTENCE
                ? "SELECT owner_id, title AS name, deleted_at IS NOT NULL AS deleted FROM lessons "
                        + "WHERE id = :id AND kind = 'library'"
                : "SELECT owner_id, name, deleted_at IS NOT NULL AS deleted FROM vocab_decks "
                        + "WHERE id = :id AND kind = 'library'";
        return jdbc.sql(sql).param("id", containerId)
                .query((rs, n) -> new ContainerRow(rs.getObject("owner_id", UUID.class), rs.getString("name"),
                        rs.getBoolean("deleted")))
                .optional();
    }

    /** Dấu đang hiệu lực: mã, lý do gỡ, lý do từ chối của yêu cầu gần nhất (nếu bị từ chối), có yêu cầu đang chờ. */
    public record TakedownRow(UUID id, String reason, String lastRejectReason, boolean pending) {
    }

    public Optional<TakedownRow> findActiveTakedown(ReportTargetType type, UUID containerId) {
        return jdbc.sql("""
                SELECT t.id, t.reason,
                       (SELECT r.reject_reason FROM republish_requests r WHERE r.takedown_id = t.id
                        ORDER BY r.created_at DESC LIMIT 1) AS last_reject_reason,
                       EXISTS (SELECT 1 FROM republish_requests r
                               WHERE r.takedown_id = t.id AND r.status = 'pending') AS pending
                FROM content_takedowns t WHERE t.""" + containerColumn(type) + " = :id AND t.cleared_at IS NULL")
                .param("id", containerId)
                .query((rs, n) -> new TakedownRow(rs.getObject("id", UUID.class), rs.getString("reason"),
                        rs.getString("last_reject_reason"), rs.getBoolean("pending")))
                .optional();
    }

    /** Các câu hoặc thẻ trong bản chụp lúc gỡ kèm đã sửa chưa (cùng điều kiện với {@link #findUnchanged}). */
    public List<RepublishView.TakedownItem> takedownItems(UUID takedownId, ReportTargetType type) {
        String sql = type == ReportTargetType.SENTENCE
                ? "SELECT e.key::uuid AS id, COALESCE(s.text_en, e.value->>'text_en') AS label, "
                        + "(s.id IS NULL OR s.deleted_at IS NOT NULL OR NOT (" + ReportRepository.SENTENCE_FIELDS
                        + " @> e.value)) AS fixed FROM content_takedowns t CROSS JOIN LATERAL jsonb_each(t.snapshot) e "
                        + "LEFT JOIN sentences s ON s.id = e.key::uuid WHERE t.id = :id ORDER BY s.start_ms NULLS LAST"
                : "SELECT e.key::uuid AS id, COALESCE(c.word, e.value->>'word') AS label, "
                        + "(c.id IS NULL OR c.deleted_at IS NOT NULL OR g.deleted_at IS NOT NULL OR NOT ("
                        + ReportRepository.CARD_FIELDS + " @> e.value)) AS fixed "
                        + "FROM content_takedowns t CROSS JOIN LATERAL jsonb_each(t.snapshot) e "
                        + "LEFT JOIN vocab_cards c ON c.id = e.key::uuid LEFT JOIN vocab_groups g ON g.id = c.group_id "
                        + "WHERE t.id = :id ORDER BY label";
        return jdbc.sql(sql).param("id", takedownId).query(RepublishView.TakedownItem.class).list();
    }

    /** Từ vựng của thẻ hoặc câu tiếng Anh còn giống bản chụp lúc gỡ (BR-XL-13, UC-BT-05 nhánh 2c). */
    public List<String> findUnchanged(UUID takedownId, ReportTargetType type) {
        // Nội dung hiện tại chứa nguyên bản chụp (@>) = chưa sửa; bản chụp cũ thiếu khóa mới (image_url) vẫn so được.
        String sql = type == ReportTargetType.SENTENCE
                ? "SELECT s.text_en FROM content_takedowns t CROSS JOIN LATERAL jsonb_each(t.snapshot) e "
                        + "JOIN sentences s ON s.id = e.key::uuid "
                        + "WHERE t.id = :id AND s.deleted_at IS NULL AND " + ReportRepository.SENTENCE_FIELDS
                        + " @> e.value ORDER BY s.start_ms"
                : "SELECT c.word FROM content_takedowns t CROSS JOIN LATERAL jsonb_each(t.snapshot) e "
                        + "JOIN vocab_cards c ON c.id = e.key::uuid JOIN vocab_groups g ON g.id = c.group_id "
                        + "WHERE t.id = :id AND c.deleted_at IS NULL AND g.deleted_at IS NULL AND "
                        + ReportRepository.CARD_FIELDS + " @> e.value ORDER BY c.word";
        return jdbc.sql(sql).param("id", takedownId).query(String.class).list();
    }

    public UUID insertRequest(UUID takedownId, UUID teacherId, Instant at) {
        return jdbc.sql("INSERT INTO republish_requests (takedown_id, requested_by, created_at) "
                + "VALUES (:t, :u, :at) RETURNING id")
                .param("t", takedownId).param("u", teacherId).param("at", Timestamp.from(at))
                .query(UUID.class).single();
    }

    /** Một yêu cầu kèm dấu và nội dung của nó. {@code type} {@code SENTENCE} là bài học, {@code CARD} là bộ thẻ. */
    public record RequestRow(UUID id, String status, Instant requestedAt, UUID takedownId, String takedownReason,
            ReportTargetType type, UUID containerId, String containerName, UUID ownerId, String ownerName,
            boolean containerDeleted) {
    }

    private static final String REQUEST_SELECT = """
            SELECT r.id, r.status, r.created_at, t.id AS takedown_id, t.reason AS takedown_reason,
                   CASE WHEN t.lesson_id IS NOT NULL THEN 'SENTENCE' ELSE 'CARD' END AS type,
                   COALESCE(t.lesson_id, t.deck_id) AS container_id, COALESCE(l.title, d.name) AS container_name,
                   COALESCE(l.owner_id, d.owner_id) AS owner_id, o.display_name AS owner_name,
                   COALESCE(l.deleted_at, d.deleted_at) IS NOT NULL AS container_deleted
            FROM republish_requests r
            JOIN content_takedowns t ON t.id = r.takedown_id
            LEFT JOIN lessons l ON l.id = t.lesson_id
            LEFT JOIN vocab_decks d ON d.id = t.deck_id
            LEFT JOIN users o ON o.id = COALESCE(l.owner_id, d.owner_id)
            """;

    private static RequestRow request(ResultSet rs, int n) throws SQLException {
        return new RequestRow(rs.getObject("id", UUID.class), rs.getString("status"),
                rs.getTimestamp("created_at").toInstant(), rs.getObject("takedown_id", UUID.class),
                rs.getString("takedown_reason"), ReportTargetType.valueOf(rs.getString("type")),
                rs.getObject("container_id", UUID.class), rs.getString("container_name"),
                rs.getObject("owner_id", UUID.class), rs.getString("owner_name"), rs.getBoolean("container_deleted"));
    }

    /** Yêu cầu đang chờ, cũ nhất trước (UC-XL-05 Bước 2). */
    public List<RequestRow> findPending(int limit, long offset) {
        return jdbc.sql(REQUEST_SELECT + " WHERE r.status = 'pending' ORDER BY r.created_at, r.id "
                + "LIMIT :limit OFFSET :offset")
                .param("limit", limit).param("offset", offset)
                .query(ModerationRepository::request).list();
    }

    public long countPending() {
        return jdbc.sql("SELECT count(*) FROM republish_requests WHERE status = 'pending'")
                .query(Long.class).single();
    }

    public Optional<RequestRow> findRequest(UUID requestId) {
        return jdbc.sql(REQUEST_SELECT + " WHERE r.id = :id").param("id", requestId)
                .query(ModerationRepository::request).optional();
    }

    /** Một câu hoặc thẻ trong bản chụp: nội dung lúc gỡ, nội dung hiện tại (rỗng nếu đã xóa). */
    public record SnapshotItem(UUID targetId, Map<String, String> before, Map<String, String> after,
            boolean deleted) {
    }

    /** So sánh lúc gỡ và hiện tại cho từng câu hoặc thẻ trong bản chụp (UC-XL-05 Bước 4). */
    public List<SnapshotItem> snapshotItems(UUID takedownId, ReportTargetType type) {
        boolean sentence = type == ReportTargetType.SENTENCE;
        String join = sentence
                ? "LEFT JOIN sentences s ON s.id = e.key::uuid"
                : "LEFT JOIN vocab_cards c ON c.id = e.key::uuid LEFT JOIN vocab_groups g ON g.id = c.group_id";
        String deleted = sentence ? "(s.id IS NULL OR s.deleted_at IS NOT NULL)"
                : "(c.id IS NULL OR c.deleted_at IS NOT NULL OR g.deleted_at IS NOT NULL)";
        String current = sentence ? "CASE WHEN s.id IS NULL THEN NULL ELSE " + ReportRepository.SENTENCE_FIELDS + " END"
                : "CASE WHEN c.id IS NULL THEN NULL ELSE " + ReportRepository.CARD_FIELDS + " END";
        Map<UUID, SnapshotItem> items = new LinkedHashMap<>();
        jdbc.sql("SELECT e.key AS target_id, f.key AS field, f.value AS before, (" + current + ") ->> f.key AS after, "
                + deleted + " AS deleted FROM content_takedowns t CROSS JOIN LATERAL jsonb_each(t.snapshot) e "
                + join + " CROSS JOIN LATERAL jsonb_each_text(e.value) f WHERE t.id = :id ORDER BY e.key")
                .param("id", takedownId)
                .query(rs -> {
                    UUID target = UUID.fromString(rs.getString("target_id"));
                    boolean gone = rs.getBoolean("deleted");
                    SnapshotItem item = items.computeIfAbsent(target,
                            k -> new SnapshotItem(k, new LinkedHashMap<>(), new LinkedHashMap<>(), gone));
                    item.before().put(rs.getString("field"), rs.getString("before"));
                    if (!gone) {
                        item.after().put(rs.getString("field"), rs.getString("after"));
                    }
                });
        return new ArrayList<>(items.values());
    }

    /** Đóng yêu cầu nếu còn đang chờ; 0 nghĩa là đã được xử lý ở nơi khác. */
    public int decide(UUID requestId, String status, String rejectReason, UUID adminId, Instant at) {
        return jdbc.sql("UPDATE republish_requests SET status = :status, reject_reason = :reason, decided_by = :admin, "
                + "decided_at = :at WHERE id = :id AND status = 'pending'")
                .param("status", status).param("reason", rejectReason, Types.VARCHAR).param("admin", adminId)
                .param("at", Timestamp.from(at)).param("id", requestId)
                .update();
    }

    public void clearTakedown(UUID takedownId, Instant at) {
        jdbc.sql("UPDATE content_takedowns SET cleared_at = :at WHERE id = :id")
                .param("at", Timestamp.from(at)).param("id", takedownId).update();
    }

    // ---------------------------------------------------------------- tự cập nhật báo cáo (UC-XL-06)

    /** Một dòng vừa được nhắc quá hạn: giáo viên chủ (null nếu chưa có) và có giáo viên xử lý không (BR-XL-12). */
    public record RemindedGroup(UUID ownerId, boolean noHandler) {
    }

    /**
     * Ghi mốc đã nhắc cho các dòng lỗi nội dung Chờ giáo viên có báo cáo cũ nhất gửi trước {@code before}, chưa dòng nào
     * được nhắc, và không thuộc bài học hoặc bộ thẻ đã xóa (BR-XL-08, BR-XL-11). Trả về từng dòng đã nhắc.
     */
    public List<RemindedGroup> markOverdueReminded(Instant before, Instant at) {
        return jdbc.sql("""
                WITH grp AS (
                    SELECT COALESCE(cr.sentence_id, cr.card_id) AS target, cr.reason,
                           COALESCE(l.owner_id, d.owner_id) AS owner_id,
                           bool_or(o.id IS NULL OR o.locked_at IS NOT NULL) AS no_handler
                    """ + ReportRepository.BASE_FROM + """
                    WHERE cr.status = 'waiting_teacher' AND COALESCE(l.deleted_at, d.deleted_at) IS NULL
                      AND COALESCE(s.deleted_at, c.deleted_at) IS NULL
                    GROUP BY 1, 2, 3
                    HAVING min(cr.created_at) < :before AND bool_and(cr.reminded_at IS NULL)
                ), upd AS (
                    UPDATE content_reports cr SET reminded_at = :at
                    FROM grp
                    WHERE cr.status = 'waiting_teacher'
                      AND COALESCE(cr.sentence_id, cr.card_id) = grp.target AND cr.reason = grp.reason
                    RETURNING grp.target, grp.reason
                )
                SELECT grp.owner_id, grp.no_handler FROM grp""")
                .param("before", Timestamp.from(before)).param("at", Timestamp.from(at))
                .query((rs, n) -> new RemindedGroup(rs.getObject("owner_id", UUID.class),
                        rs.getBoolean("no_handler")))
                .list();
    }

    /** Đóng báo cáo đang mở của bài học hoặc bộ thẻ đã xóa từ trước {@code before} (BR-XL-08, nhánh 1c). */
    public List<UUID> closeForPermanentlyDeleted(Instant before, String note, Instant at) {
        return jdbc.sql("UPDATE content_reports cr SET status = 'resolved', handled_by = NULL, handled_at = :at, "
                + "handling_note = :note, status_changed_at = :at WHERE cr.status IN " + OPEN + """
                 AND (EXISTS (SELECT 1 FROM sentences s JOIN lessons l ON l.id = s.lesson_id
                              WHERE s.id = cr.sentence_id AND l.deleted_at < :before)
                   OR EXISTS (SELECT 1 FROM vocab_cards c JOIN vocab_decks d ON d.id = c.deck_id
                              WHERE c.id = cr.card_id AND d.deleted_at < :before))
                RETURNING cr.id""")
                .param("before", Timestamp.from(before)).param("note", note).param("at", Timestamp.from(at))
                .query(UUID.class).list();
    }

    /**
     * Đóng báo cáo đang mở về câu, thẻ đã bị xóa riêng hoặc thuộc nhóm thẻ đã xóa (nhánh 1a). {@code where} là điều kiện
     * trên bí danh {@code cr}, chỉ lấy từ hằng trong lớp gọi.
     */
    public List<UUID> closeWhere(String where, Map<String, Object> params, String note, Instant at) {
        return jdbc.sql("UPDATE content_reports cr SET status = 'resolved', handled_by = NULL, handled_at = :at, "
                + "handling_note = :note, status_changed_at = :at WHERE cr.status IN " + OPEN + " AND (" + where
                + ") RETURNING cr.id")
                .params(params).param("note", note).param("at", Timestamp.from(at))
                .query(UUID.class).list();
    }
}
