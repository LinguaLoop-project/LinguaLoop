package com.lingualoop.backend.report.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Dữ liệu trả về cho màn xử lý báo cáo của giáo viên và quản trị viên (UC-XL-01). */
public final class ReportView {

    private ReportView() {
    }

    /**
     * Một dòng danh sách: các báo cáo trùng đang cùng trạng thái gộp lại (BR-XL-06). {@code id} là báo cáo mới nhất của
     * dòng, dùng để mở chi tiết và thao tác trên cả dòng. {@code ownerName} chỉ có với quản trị viên.
     */
    public record Item(
            UUID id,
            String targetType,
            UUID targetId,
            String content,
            UUID containerId,
            String containerName,
            String reason,
            int reportCount,
            Instant firstReportedAt,
            Instant lastReportedAt,
            String status,
            boolean overdue,
            UUID ownerId,
            String ownerName,
            boolean noHandler,
            boolean containerDeleted) {
    }

    /** Số báo cáo một học viên đã gửi và số bị từ chối trong 30 ngày gần nhất (BR-XL-14). */
    public record ReporterStats(long submitted, long rejected) {
    }

    /**
     * Một báo cáo trong dòng. Tên, mã và số liệu người báo chỉ có với quản trị viên (BR-XL-09).
     * {@code fixField} là trường bản sửa thay vào (BR-BC-11). {@code handledBy} rỗng
     * khi báo cáo đã đóng nghĩa là "Hệ thống" (BR-XL-07).
     */
    public record Entry(
            UUID id,
            Instant reportedAt,
            String suggestedFix,
            String fixField,
            String description,
            String status,
            Instant handledAt,
            String handledBy,
            String handlingNote,
            UUID reporterId,
            String reporterName,
            ReporterStats reporterStats) {
    }

    /** Giáo viên chủ có nội dung bị báo, cho bộ lọc "Giáo viên chủ" của quản trị viên (UC-XL-01 Bước 5, AC-XL-09). */
    public record Owner(UUID id, String name) {
    }

    /**
     * Chi tiết một dòng (UC-XL-01 Bước 8). {@code snapshot} là nội dung lúc báo của báo cáo mới nhất (BR-BC-10),
     * {@code current} là nội dung hiện tại; khóa là tên cột. {@code actions} là các thao tác tác nhân được làm:
     * {@code resolve}, {@code reject}, {@code takedown}, {@code assign}. {@code takedownCount} là số báo cáo sẽ được
     * đóng nếu gỡ nội dung (dòng này và mọi báo cáo Phản cảm đang mở của bài học hoặc bộ thẻ, BR-XL-13), 0 nếu không
     * được gỡ. {@code imageUrl} là URL đọc của ảnh minh họa hiện tại của thẻ, để xem nội dung như học viên thấy
     * (UC-XL-01 nhánh 8a); {@code null} với câu hoặc thẻ không có ảnh.
     */
    public record Detail(
            Item item,
            Map<String, String> snapshot,
            Map<String, String> current,
            List<Entry> reports,
            List<String> actions,
            int takedownCount,
            String imageUrl) {
    }
}
