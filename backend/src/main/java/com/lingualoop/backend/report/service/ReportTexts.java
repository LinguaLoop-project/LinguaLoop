package com.lingualoop.backend.report.service;

import com.lingualoop.backend.common.exception.FieldValidationException;

/** Kiểm tra ô chữ của báo cáo: cắt khoảng trắng hai đầu, dài 1 đến 500 ký tự (BR-BC-06, BR-BC-09, BR-XL-04). */
final class ReportTexts {

    static final int MAX = 500;

    private ReportTexts() {
    }

    /** Bắt buộc: trống hoặc chỉ có khoảng trắng ném {@code NotBlank}, quá dài ném {@code Size}. */
    static String required(String field, String value) {
        String text = value == null ? "" : value.strip();
        if (text.isEmpty()) {
            throw new FieldValidationException(field, "NotBlank");
        }
        return checkLength(field, text);
    }

    /** Không bắt buộc: trống trả {@code null}. */
    static String optional(String field, String value) {
        String text = value == null ? "" : value.strip();
        return text.isEmpty() ? null : checkLength(field, text);
    }

    private static String checkLength(String field, String text) {
        if (text.codePointCount(0, text.length()) > MAX) {
            throw new FieldValidationException(field, "Size");
        }
        return text;
    }
}
