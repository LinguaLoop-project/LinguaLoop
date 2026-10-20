package com.lingualoop.backend.dictation.service.grading;

/**
 * Một cặp sau căn chỉnh. expectedIndex == null là từ thừa; actual == null là từ bị bỏ sót;
 * matched là cặp đã khớp (bằng nhau, tương đương, hoặc khớp nhờ gộp/tách từ).
 */
public record AlignedPair(Integer expectedIndex, String actual, boolean matched) {
}
