package com.lingualoop.backend.lesson.ipa;

import java.util.List;

/** Tạo IPA giọng Mỹ và giọng Anh cho các câu; bản thật gọi espeak-ng, test thay bằng bản giả. */
public interface IpaGenerator {

    /**
     * Phiên âm của một câu theo ADR 0007: mỗi từ một cụm, cách nhau một dấu cách.
     *
     * @param us giọng Mỹ, nguồn âm đích khi chấm; {@code null} nếu không tạo được
     * @param uk giọng Anh, chỉ để hiển thị; {@code null} nếu không tạo được hoặc câu không có {@code us}
     */
    record SentenceIpa(String us, String uk) {

        public static final SentenceIpa NONE = new SentenceIpa(null, null);
    }

    /** @return danh sách cùng số phần tử với {@code sentences}, không phần tử nào {@code null} */
    List<SentenceIpa> generate(List<String> sentences);
}
