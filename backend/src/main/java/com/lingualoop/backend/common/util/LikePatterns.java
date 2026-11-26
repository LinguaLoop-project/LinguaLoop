package com.lingualoop.backend.common.util;

import java.util.Locale;

/** Mẫu cho {@code LIKE ... ESCAPE '\'} trong câu SQL hằng, giá trị truyền bằng tham số. */
public final class LikePatterns {

    private LikePatterns() {
    }

    /**
     * Mẫu "chứa chuỗi", chữ thường, đã thoát {@code %}, {@code _} và {@code \}, dùng với {@code lower(cột) LIKE}.
     * {@code null} khi chuỗi trống hoặc chỉ có khoảng trắng (không lọc).
     */
    public static String containsLower(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        String escaped = q.strip().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
