package com.lingualoop.backend.stats;

import java.time.LocalDate;
import java.util.UUID;

import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.PracticeSessionDetailView;
import com.lingualoop.backend.stats.dto.ActivityView;
import com.lingualoop.backend.stats.dto.DictationErrorsView;
import com.lingualoop.backend.stats.dto.HistoryView;
import com.lingualoop.backend.stats.dto.PronunciationView;
import com.lingualoop.backend.stats.dto.StatsOverviewView;
import com.lingualoop.backend.stats.dto.WrongWordsView;

/**
 * Thống kê học tập của chính học viên (UC-TH-01, UC-TH-02, UC-TH-03). Mọi số liệu tính trực tiếp từ dữ liệu gốc, không
 * lưu số cộng dồn (BR-TH-04); chỉ đọc nên không có thay đổi nào được lưu. {@code range} là {@code 7d}, {@code 30d}
 * (mặc định khi trống) hoặc {@code all}; giá trị khác trả 400 (BR-TH-03).
 */
public interface StatsService {

    /** Số câu mỗi trang của Lịch sử luyện tập (BR-TH-11). */
    int HISTORY_PAGE_SIZE = 20;

    StatsOverviewView overview(UUID userId, String range);

    /** Chỉ chuỗi ngày học, cho chip trên thanh trên cùng; nhẹ hơn {@link #overview} vì không tính số liệu khác. */
    StatsOverviewView.Streak streak(UUID userId);

    /** Lỗi Nghe chép theo đủ sáu nhóm từ (BR-TH-05, BR-TH-12). */
    DictationErrorsView dictationErrors(UUID userId, String range);

    /** Mười từ nghe sai nhiều nhất trong khoảng (BR-TH-16). */
    WrongWordsView wrongWords(UUID userId, String range);

    /** Lịch nhiệt 13 tuần gần nhất (BR-TH-15). */
    ActivityView activity(UUID userId);

    /** Lịch sử luyện tập từ mới đến cũ, đã lọc theo chế độ và khoảng (BR-TH-06, BR-TH-07); {@code page} từ 0. */
    PageResponse<HistoryView> history(UUID userId, String mode, String range, int page);

    /** Từng lượt của một Buổi luyện; 404 nếu học viên không có buổi đó. */
    PracticeSessionDetailView practiceSession(UUID userId, UUID lessonId, PracticeMode mode, LocalDate day);

    /** Điểm phát âm theo thời gian và Bản đồ 44 âm vị (BR-TH-08, BR-TH-09). */
    PronunciationView.Overview pronunciation(UUID userId, String range);

    /** Chi tiết một âm vị; 404 nếu ký hiệu không thuộc bảng 44 âm vị (BR-TH-10). */
    PronunciationView.Detail phoneme(UUID userId, String symbol, String range);
}
