package com.lingualoop.backend.audit.dto;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Dựng phần "giá trị cũ và mới" của một mục nhật ký ({@code {"field":{"old":..,"new":..}}}, BR-NK-03). Chỉ trường có
 * giá trị đổi mới được ghi; giữ được giá trị {@code null}.
 *
 * <pre>{@code
 * Map<String, Object> diff = AuditChanges.create()
 *         .field("title", lesson.getTitle(), request.title())
 *         .build();
 * }</pre>
 */
public final class AuditChanges {

    private final Map<String, Object> changes = new LinkedHashMap<>();

    private AuditChanges() {
    }

    public static AuditChanges create() {
        return new AuditChanges();
    }

    /** Ghi trường khi {@code oldValue} khác {@code newValue} (theo {@link #same}). */
    public AuditChanges field(String name, Object oldValue, Object newValue) {
        if (!same(oldValue, newValue)) {
            changes.put(name, pair(oldValue, newValue));
        }
        return this;
    }

    /** {@code null} khi không có trường nào đổi, để cột {@code changes} để trống thay vì {@code {}}. */
    public Map<String, Object> build() {
        return changes.isEmpty() ? null : Collections.unmodifiableMap(new LinkedHashMap<>(changes));
    }

    /** Hai giá trị bằng nhau; số thập phân so theo giá trị nên {@code 3.0} bằng {@code 3}. */
    public static boolean same(Object oldValue, Object newValue) {
        if (oldValue instanceof BigDecimal a && newValue instanceof BigDecimal b) {
            return a.compareTo(b) == 0;
        }
        return Objects.equals(oldValue, newValue);
    }

    /** Một cặp {@code {"old":..,"new":..}}. */
    public static Map<String, Object> pair(Object oldValue, Object newValue) {
        Map<String, Object> pair = new LinkedHashMap<>();
        pair.put("old", oldValue);
        pair.put("new", newValue);
        return pair;
    }
}
