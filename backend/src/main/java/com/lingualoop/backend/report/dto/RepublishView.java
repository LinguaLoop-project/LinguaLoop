package com.lingualoop.backend.report.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Dữ liệu yêu cầu xuất bản lại nội dung bị gỡ do báo cáo (UC-XL-05, UC-BH-06, UC-BT-05 nhánh 2b đến 2d). */
public final class RepublishView {

    private RepublishView() {
    }

    /**
     * Tình trạng dấu "Bị gỡ do báo cáo" của một bài học hoặc bộ thẻ, cho màn của giáo viên. {@code takenDown} false thì
     * các trường còn lại rỗng. {@code items} là các câu hoặc thẻ bị báo trong bản chụp lúc gỡ, để giáo viên biết cần sửa
     * gì trước khi gửi yêu cầu (UC-BT-05 nhánh 2b, 2c).
     */
    public record Status(boolean takenDown, String reason, boolean pending, String lastRejectReason,
            List<TakedownItem> items) {

        public static Status none() {
            return new Status(false, null, false, null, List.of());
        }
    }

    /**
     * Một câu hoặc thẻ bị báo của dấu đang hiệu lực: {@code label} là câu tiếng Anh hoặc từ vựng (lấy từ bản chụp nếu đã
     * xóa); {@code fixed} là đã khác bản chụp lúc gỡ hoặc đã bị xóa (BR-XL-13).
     */
    public record TakedownItem(UUID id, String label, boolean fixed) {
    }

    /** Một dòng danh sách yêu cầu đang chờ. {@code targetType}: {@code lesson} hoặc {@code deck}. */
    public record Item(
            UUID id,
            String targetType,
            UUID targetId,
            String targetName,
            String ownerName,
            String takedownReason,
            Instant requestedAt) {
    }

    /** Một câu hoặc thẻ bị báo: nội dung lúc gỡ và hiện tại; {@code deleted} thì {@code current} rỗng. */
    public record Change(UUID id, Map<String, String> snapshot, Map<String, String> current, boolean deleted) {
    }

    public record Detail(Item item, String status, List<Change> changes) {
    }
}
