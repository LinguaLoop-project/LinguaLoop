package com.lingualoop.backend.report.enums;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Loại nội dung bị báo (BR-XL-01): câu của bài học hoặc thẻ của bộ thẻ. {@code snapshotColumns} là các cột được chụp lúc
 * gửi báo cáo (BR-BC-10), cũng là các cột so sánh với lý do "Phản cảm" và "Khác" (BR-XL-05). Thẻ chụp cả ảnh minh họa
 * ({@code image_url}, S3 key) để thay ảnh bị báo được tính là đã sửa.
 */
public enum ReportTargetType {
    SENTENCE(List.of("text_en", "ipa_us", "ipa_uk", "text_vi", "start_ms", "end_ms")),
    CARD(List.of("word", "ipa_us", "ipa_uk", "meaning_vi", "definition_en", "definition_vi", "example_en",
            "example_vi", "image_url"));

    private final List<String> snapshotColumns;

    ReportTargetType(List<String> snapshotColumns) {
        this.snapshotColumns = snapshotColumns;
    }

    public List<String> snapshotColumns() {
        return snapshotColumns;
    }

    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static Optional<ReportTargetType> fromValue(String value) {
        if (value == null) {
            return Optional.empty();
        }
        for (ReportTargetType type : values()) {
            if (type.value().equalsIgnoreCase(value)) {
                return Optional.of(type);
            }
        }
        return Optional.empty();
    }
}
