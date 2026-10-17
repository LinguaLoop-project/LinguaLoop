package com.lingualoop.backend.dictation.service.grading;

/**
 * Một cặp sau căn chỉnh. {@code expectedIndex == null} là từ thừa; {@code actual == null} là từ bị bỏ sót;
 * {@code matched} là cặp đã khớp (bằng nhau, tương đương, hoặc khớp nhờ gộp/tách từ).
 */
public record AlignedPair(Integer expectedIndex, String actual, boolean matched) {
}
