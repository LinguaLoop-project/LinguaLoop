package com.lingualoop.backend.practice.dto;

/**
 * Một từ cụ thể học viên hay nghe sai trong Nghe chép, tính trên lượt nộp đầu tiên của mỗi câu (BR-TH-16).
 *
 * @param word       dạng viết của từ ở lần sai gần nhất
 * @param wordClass  nhóm từ của lần sai gần nhất (BR-TH-12)
 * @param wrongCount số lần từ này bị sai (bỏ sót, nhầm từ, sai chính tả hoặc đã lộ)
 * @param seenCount  số lần từ này xuất hiện trong các câu đã làm
 */
public record WrongWordView(String word, String wordClass, long wrongCount, long seenCount) {
}
