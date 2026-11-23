package com.lingualoop.backend.stats.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.shadowing.dto.ScorePointView;

/** Thống kê điểm phát âm và Bản đồ 44 âm vị (UC-TH-03). */
public final class PronunciationView {

    private PronunciationView() {
    }

    /**
     * @param weekly  điểm theo tuần ({@code range=all}) hay theo ngày
     * @param averageScore điểm Shadowing trung bình trong khoảng đang lọc, làm tròn; null khi chưa có lượt nào
     * @param scoreDelta   chênh lệch với khoảng liền trước cùng độ dài (BR-TH-13); null với {@code all} hoặc khi khoảng liền trước
     *                     chưa có lượt nào
     * @param phonemes đủ 44 âm theo thứ tự chuẩn; giao diện tự chia nhóm nguyên âm và phụ âm theo {@code kind}
     */
    public record Overview(String range, boolean weekly, List<ScorePointView> scores, Integer averageScore,
            Integer scoreDelta, List<Cell> phonemes) {

        public Overview {
            scores = List.copyOf(scores);
            phonemes = List.copyOf(phonemes);
        }
    }

    /**
     * Một ô của bản đồ.
     *
     * @param kind         {@code vowel}, {@code diphthong} hoặc {@code consonant}
     * @param errorPercent tỷ lệ lỗi làm tròn; null khi chưa đủ dữ liệu
     * @param level        {@code insufficient} (dưới 5 lần gặp), {@code good} (dưới 15%), {@code attention} (15% đến
     *                     30%) hoặc {@code bad} (trên 30%), theo BR-TH-09
     */
    public record Cell(String symbol, String kind, String exampleWord, long total, long errors, Integer errorPercent,
            String level) {
    }

    /**
     * Chi tiết một âm. Âm chưa đủ dữ liệu chỉ có {@code cell}; các phần còn lại rỗng hoặc null (BR-TH-09).
     *
     * @param confusedAs      âm hay đọc nhầm thành, null nếu không có
     * @param mostlyOmitted   phần lớn lần lỗi không nghe ra âm nào
     * @param tip             mẹo sửa phát âm tiếng Việt
     * @param trend           đủ 8 tuần gần nhất từ cũ đến mới, tuần không luyện có 0
     * @param practiceLessonId bài để "Luyện ngay"; null thì mở thư viện bài ở chế độ Shadowing (BR-TH-10)
     */
    public record Detail(Cell cell, String confusedAs, boolean mostlyOmitted, String tip, List<WeekPoint> trend,
            UUID practiceLessonId) {

        public Detail {
            trend = List.copyOf(trend);
        }
    }

    /** Tuần bắt đầu từ thứ Hai; {@code errorPercent} null khi tuần đó không có lần gặp nào. */
    public record WeekPoint(LocalDate weekStart, long total, long errors, Integer errorPercent) {
    }
}
