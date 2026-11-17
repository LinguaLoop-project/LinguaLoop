package com.lingualoop.backend.report.dto.request;

import java.util.UUID;

/**
 * Giáo viên gửi yêu cầu xuất bản lại; {@code targetType}: {@code lesson} hoặc {@code deck}. {@code note} là ghi chú cho
 * quản trị viên, tối đa 500 ký tự, bắt buộc khi bản chụp lúc gỡ rỗng (BR-XL-13).
 */
public record RepublishRequest(String targetType, UUID targetId, String note) {
}
