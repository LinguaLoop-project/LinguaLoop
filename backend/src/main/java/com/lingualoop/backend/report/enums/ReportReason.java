package com.lingualoop.backend.report.enums;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Lý do báo cáo theo loại nội dung (BR-BC-05). {@code fixColumns} là các cột học viên được chọn để bản sửa đề xuất thay
 * vào (BR-BC-11); rỗng nghĩa là lý do bắt buộc mô tả thay vì bản sửa. {@code changedColumns} là các cột
 * phải khác bản chụp thì mới được đánh dấu Đã xử lý (BR-XL-05); {@code null} nghĩa là bất kỳ cột nào của nội dung.
 */
public enum ReportReason {
    SUBTITLE_EN("subtitle_en", Set.of(ReportTargetType.SENTENCE), List.of("text_en"), List.of("text_en")),
    IPA("ipa", Set.of(ReportTargetType.SENTENCE), List.of("ipa_us", "ipa_uk"), List.of("ipa_us", "ipa_uk")),
    TRANSLATION("translation", Set.of(ReportTargetType.SENTENCE), List.of("text_vi"), List.of("text_vi")),
    TIMING("timing", Set.of(ReportTargetType.SENTENCE), List.of(), List.of("start_ms", "end_ms")),
    WORD("word", Set.of(ReportTargetType.CARD), List.of("word"), List.of("word")),
    PHONETIC("phonetic", Set.of(ReportTargetType.CARD), List.of("ipa_us", "ipa_uk"), List.of("ipa_us", "ipa_uk")),
    MEANING("meaning", Set.of(ReportTargetType.CARD), List.of("meaning_vi", "definition_en", "definition_vi"),
            List.of("meaning_vi", "definition_en", "definition_vi")),
    EXAMPLE("example", Set.of(ReportTargetType.CARD), List.of("example_en", "example_vi"),
            List.of("example_en", "example_vi")),
    OFFENSIVE("offensive", Set.of(ReportTargetType.SENTENCE, ReportTargetType.CARD), List.of(), null),
    OTHER("other", Set.of(ReportTargetType.SENTENCE, ReportTargetType.CARD), List.of(), null);

    private final String value;
    private final Set<ReportTargetType> targets;
    private final List<String> fixColumns;
    private final List<String> changedColumns;

    ReportReason(String value, Set<ReportTargetType> targets, List<String> fixColumns, List<String> changedColumns) {
        this.value = value;
        this.targets = targets;
        this.fixColumns = fixColumns;
        this.changedColumns = changedColumns;
    }

    /** Giá trị lưu trong {@code content_reports.reason}. */
    public String value() {
        return value;
    }

    public boolean appliesTo(ReportTargetType target) {
        return targets.contains(target);
    }

    /** Lý do bắt buộc bản sửa đúng; các lý do còn lại bắt buộc mô tả lỗi (BR-BC-05). */
    public boolean requiresFix() {
        return !fixColumns.isEmpty();
    }

    /** Các cột học viên được chọn làm trường cần sửa (BR-BC-11). */
    public List<String> fixColumns() {
        return fixColumns;
    }

    /** Luồng vi phạm do quản trị viên xử lý (BR-XL-01). */
    public boolean isViolation() {
        return this == OFFENSIVE;
    }

    /** Các cột cần khác bản chụp với nội dung loại {@code target} (BR-XL-05). */
    public List<String> changedColumns(ReportTargetType target) {
        return changedColumns != null ? changedColumns : target.snapshotColumns();
    }

    public static Optional<ReportReason> fromValue(String value) {
        if (value == null) {
            return Optional.empty();
        }
        for (ReportReason reason : values()) {
            if (reason.value.equalsIgnoreCase(value)) {
                return Optional.of(reason);
            }
        }
        return Optional.empty();
    }
}
