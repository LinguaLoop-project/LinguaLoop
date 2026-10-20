package com.lingualoop.backend.dictation.dto.response;

/**
 * Từ được lộ. index là thứ tự trong các từ chấm được của câu (bỏ token chỉ có dấu câu); các field đều
 * rỗng khi chữ đã gõ đã đúng hết nên không còn từ nào để lộ.
 */
public record RevealWordResponse(Integer position, Integer index, String word) {

    public static RevealWordResponse none() {
        return new RevealWordResponse(null, null, null);
    }
}
