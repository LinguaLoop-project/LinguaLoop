package com.lingualoop.backend.report.dto.request;

import java.util.UUID;

/** Giáo viên gửi yêu cầu xuất bản lại; {@code targetType}: {@code lesson} hoặc {@code deck}. */
public record RepublishRequest(String targetType, UUID targetId) {
}
