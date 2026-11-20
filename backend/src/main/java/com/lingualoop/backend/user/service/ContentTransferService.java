package com.lingualoop.backend.user.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.user.dto.ContentTransferView;
import com.lingualoop.backend.user.dto.request.TransferAllRequest;
import com.lingualoop.backend.user.dto.request.TransferSelectedRequest;
import com.lingualoop.backend.user.enums.TransferContentType;

/**
 * Giao lại bài học và bộ thẻ thư viện cho giáo viên khác (UC-QT-05, 06, 07). Báo cáo đang mở đi theo nội dung vì giáo
 * viên xử lý báo cáo là chủ hiện tại của bài học hoặc bộ thẻ (BR-QT-08).
 */
public interface ContentTransferService {

    /** Giá trị {@code owner} lọc bộ thẻ chưa gán chủ ("Hệ thống"). */
    String SYSTEM_OWNER = "system";

    /**
     * Nội dung cần giao (BR-QT-05), 20 mục mỗi trang. {@code type} {@code null} = mọi loại; {@code owner}: id giáo
     * viên hoặc {@link #SYSTEM_OWNER}.
     */
    PageResponse<ContentTransferView.Item> listItems(String q, TransferContentType type, String owner, int page);

    /** Giáo viên đang giữ nội dung cần giao, cho bộ lọc theo giáo viên. */
    List<ContentTransferView.Owner> owners();

    /** Giáo viên có thể nhận nội dung (BR-QT-06), trừ {@code excluded}; tối đa 50 người. */
    List<ContentTransferView.Recipient> recipients(String q, List<UUID> excluded);

    /** Tóm tắt nội dung thư viện của giáo viên (UC-QT-07 Bước 2); không phải giáo viên ném {@code TRANSFER_SOURCE_NOT_TEACHER}. */
    ContentTransferView.TeacherSummary summary(UUID teacherId);

    /**
     * Giao các mục đã chọn, toàn bộ hoặc không (UC-QT-06, BR-QT-07). Lỗi: {@code TRANSFER_NOTHING_SELECTED},
     * {@code TRANSFER_RECIPIENT_INVALID}, {@code TRANSFER_CONTENT_CHANGED}, {@code TRANSFER_NAME_CONFLICT} (details
     * {@code conflicts}).
     */
    ContentTransferView.Result transferSelected(UUID adminId, TransferSelectedRequest request);

    /**
     * Giao toàn bộ bài học và bộ thẻ thư viện chưa xóa của giáo viên (UC-QT-07). Lỗi: {@code TRANSFER_SOURCE_NOT_TEACHER},
     * {@code TRANSFER_NO_CONTENT}, {@code TRANSFER_RECIPIENT_INVALID}, {@code TRANSFER_CONTENT_CHANGED} (details
     * {@code summary}), {@code TRANSFER_NAME_CONFLICT} (details {@code conflicts}).
     */
    ContentTransferView.Result transferAll(UUID adminId, UUID teacherId, TransferAllRequest request);
}
