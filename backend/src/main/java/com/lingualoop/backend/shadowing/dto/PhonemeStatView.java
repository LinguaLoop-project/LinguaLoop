package com.lingualoop.backend.shadowing.dto;

/**
 * Một ô trên Bản đồ 44 âm vị: số lần gặp và số lần lỗi của âm đích trong một khoảng (BR-TH-08). {@code kind} là
 * {@code vowel}, {@code diphthong} hoặc {@code consonant}.
 */
public record PhonemeStatView(String symbol, String kind, String exampleWord, long total, long errors) {
}
