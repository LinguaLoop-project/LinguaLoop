package com.lingualoop.backend.practice.dto;

/**
 * Lỗi nghe chép của một nhóm từ trong một khoảng, chỉ tính lượt nộp đầu tiên của mỗi câu (BR-TH-05).
 *
 * @param opportunities  số từ thuộc nhóm đã gặp
 * @param omitted        bỏ sót
 * @param substituted    nhầm từ
 * @param misspelled     sai chính tả
 * @param revealed       đã lộ do xin gợi ý; vẫn tính là sai
 * @param lastWrongWord  từ sai gần nhất của nhóm, null nếu chưa sai lần nào
 */
public record WordClassErrorView(String wordClass, long opportunities, long omitted, long substituted,
        long misspelled, long revealed, String lastWrongWord) {

    /** Tổng số từ sai. */
    public long errors() {
        return omitted + substituted + misspelled + revealed;
    }
}
