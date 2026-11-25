package com.lingualoop.backend.stats.dto;

import java.util.List;
import java.util.UUID;

/**
 * Lỗi Nghe chép theo nhóm từ (BR-TH-05, BR-TH-12). Luôn đủ sáu nhóm theo thứ tự cố định, nhóm chưa gặp có 0.
 */
public record DictationErrorsView(String range, List<Row> classes) {

    public DictationErrorsView {
        classes = List.copyOf(classes);
    }

    /**
     * @param wordClass     {@code function}, {@code content}, {@code inflected}, {@code number}, {@code proper} hoặc {@code other}
     * @param errors        tổng số từ sai gồm bỏ sót, nhầm từ, sai chính tả và đã lộ
     * @param errorPercent  tỷ lệ lỗi làm tròn; 0 khi chưa gặp từ nào của nhóm
     * @param lastWrongWord từ sai gần nhất, null nếu chưa sai
     * @param practiceLessonId bài để "Luyện ngay" (BR-TH-14); null thì mở thư viện bài ở chế độ Nghe chép
     */
    public record Row(String wordClass, long opportunities, long errors, int errorPercent, long omitted,
            long substituted, long misspelled, long revealed, String lastWrongWord, UUID practiceLessonId) {
    }
}
