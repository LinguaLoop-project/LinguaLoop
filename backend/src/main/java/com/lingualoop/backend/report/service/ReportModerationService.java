package com.lingualoop.backend.report.service;

import java.util.UUID;

import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.report.dto.RepublishView;

/**
 * Gỡ nội dung do báo cáo và xuất bản lại khi quản trị viên duyệt (UC-XL-04, UC-XL-05, UC-BH-06, UC-BT-05 nhánh 2b đến
 * 2d). {@code targetType}: {@code lesson} hoặc {@code deck}; giá trị khác ném {@code FieldValidationException}.
 */
public interface ReportModerationService {

    /**
     * Quản trị viên gỡ bài học hoặc bộ thẻ chứa nội dung bị báo và đóng dòng báo cáo cùng mọi báo cáo Phản cảm đang mở
     * của nội dung đó (UC-XL-04, BR-XL-13). Chỉ với dòng Chờ quản trị viên, hoặc dòng lỗi nội dung đã chờ quá 30 ngày
     * (BR-XL-11); dòng khác ném {@code ForbiddenException}, dòng đã đóng ném {@code REPORT_ALREADY_HANDLED}.
     */
    void takedown(UUID adminId, UUID reportId, String reason);

    /** Tình trạng dấu của bài học hoặc bộ thẻ của giáo viên; không phải của giáo viên ném {@code ForbiddenException}. */
    RepublishView.Status status(UUID teacherId, String targetType, UUID targetId);

    /**
     * Giáo viên gửi yêu cầu xuất bản lại (nhánh 2b). Không có dấu ném {@code REPORT_TAKEDOWN_NOT_FOUND}; đã có yêu cầu
     * đang chờ ném {@code REPUBLISH_PENDING} (2d); còn câu hoặc thẻ bị báo chưa sửa ném {@code REPUBLISH_NOT_FIXED} kèm
     * {@code details.unchanged} (số lượng) và {@code details.items} (từ vựng của thẻ hoặc câu tiếng Anh chưa sửa) (2c).
     */
    void requestRepublish(UUID teacherId, String targetType, UUID targetId);

    /** Yêu cầu đang chờ, cũ nhất trước, 10 dòng mỗi trang (UC-XL-05). */
    PageResponse<RepublishView.Item> listPending(int page);

    /** Chi tiết yêu cầu kèm so sánh lúc gỡ và hiện tại; không tồn tại ném {@code REPUBLISH_NOT_FOUND}. */
    RepublishView.Detail getRequest(UUID requestId);

    /**
     * Duyệt: xuất bản và bỏ dấu, báo giáo viên chủ. Yêu cầu đã xử lý hoặc nội dung đã xóa ném {@code REPUBLISH_NOT_FOUND}
     * (3a); chưa đủ điều kiện xuất bản ném lỗi của feature nội dung (6a).
     */
    void approve(UUID adminId, UUID requestId);

    /** Từ chối kèm lý do (BR-XL-04): nội dung vẫn Nháp và giữ dấu, báo giáo viên chủ (nhánh 5a). */
    void reject(UUID adminId, UUID requestId, String reason);
}
