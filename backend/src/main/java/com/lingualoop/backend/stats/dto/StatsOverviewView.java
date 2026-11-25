package com.lingualoop.backend.stats.dto;

import java.util.List;

import com.lingualoop.backend.lesson.dto.LessonStateCounts;
import com.lingualoop.backend.practice.dto.SentenceCountsView;
import com.lingualoop.backend.vocab.dto.VocabStatsView;

/** Trang Thống kê học tập (UC-TH-01). Số liệu theo hoạt động đi theo {@code range}; số liệu hiện trạng thì không. */
public record StatsOverviewView(String range, Streak streak, SentenceCountsView sentences, LessonStateCounts lessons,
        Vocab vocab, Comparison comparison) {

    /**
     * So với khoảng liền trước cùng độ dài (BR-TH-13). Cả record là null với {@code all} hoặc khi khoảng liền trước chưa có lượt
     * luyện nào.
     *
     * @param previousSentences số câu khác nhau đã luyện ở khoảng liền trước
     * @param sentencesDelta    chênh lệch số câu so với khoảng liền trước, âm khi giảm
     */
    public record Comparison(long previousSentences, long sentencesDelta) {
    }

    /**
     * Chuỗi ngày học (BR-TH-02).
     *
     * @param studiedToday hôm nay đã học; false thì giao diện nhắc học để giữ chuỗi
     * @param week         7 ngày của tuần hiện tại từ thứ Hai, true là ngày đã học
     * @param todayIndex   vị trí của hôm nay trong {@code week} (0 là thứ Hai)
     */
    public record Streak(int current, int longest, boolean studiedToday, List<Boolean> week, int todayIndex) {

        public Streak {
            week = List.copyOf(week);
        }
    }

    /**
     * Học từ vựng: số thẻ theo trạng thái là hiện trạng; số lần trả lời theo khoảng.
     *
     * @param accuracyPercent phần trăm trả lời đúng, null khi chưa trả lời lần nào
     */
    public record Vocab(VocabStatsView.CardCounts cards, long answered, long correct, Integer accuracyPercent) {
    }
}
