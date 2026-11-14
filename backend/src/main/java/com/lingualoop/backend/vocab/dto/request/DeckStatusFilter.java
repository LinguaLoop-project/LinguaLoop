package com.lingualoop.backend.vocab.dto.request;

import java.util.Locale;

import com.lingualoop.backend.common.exception.FieldValidationException;

/**
 * Bộ lọc trạng thái trên danh sách bộ (UC-BT-01 bước 5). {@code ALL} gồm Nháp và Đã xuất bản, không gồm bộ đã xóa;
 * {@code DELETED} là bộ đã xóa trong 30 ngày gần nhất (BR-BT-10).
 */
public enum DeckStatusFilter {
    ALL,
    PUBLISHED,
    DRAFT,
    DELETED;

    /** Giá trị truyền vào SQL. */
    public String sqlValue() {
        return name().toLowerCase(Locale.ROOT);
    }

    /** Đọc tham số {@code status}; trống = {@code ALL}, giá trị lạ = lỗi 400 gắn vào trường {@code status}. */
    public static DeckStatusFilter parse(String value) {
        if (value == null || value.isBlank()) {
            return ALL;
        }
        for (DeckStatusFilter filter : values()) {
            if (filter.name().equalsIgnoreCase(value.strip())) {
                return filter;
            }
        }
        throw new FieldValidationException("status", "Pattern");
    }
}
