package com.lingualoop.backend.stats;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.PracticeSessionDetailView;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.stats.dto.ActivityView;
import com.lingualoop.backend.stats.dto.DictationErrorsView;
import com.lingualoop.backend.stats.dto.HistoryView;
import com.lingualoop.backend.stats.dto.PronunciationView;
import com.lingualoop.backend.stats.dto.StatsOverviewView;
import com.lingualoop.backend.stats.dto.WrongWordsView;

import lombok.RequiredArgsConstructor;

/**
 * Thống kê học tập (UC-TH-01, UC-TH-02, UC-TH-03): chỉ học viên, chỉ dữ liệu của chính người gọi (BR-TH-01). Không có
 * tham số nào cho phép chỉ định học viên khác. {@code range} là {@code 7d}, {@code 30d} (mặc định) hoặc {@code all}.
 */
@RestController
@RequestMapping("/api/v1/stats")
@PreAuthorize("hasRole('STUDENT')")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/overview")
    public ApiResponse<StatsOverviewView> overview(@CurrentUserId UUID userId,
            @RequestParam(required = false) String range) {
        return ApiResponse.ok(statsService.overview(userId, range));
    }

    /** Chuỗi ngày học hiện tại và kỷ lục, nhẹ hơn {@code /overview}; dùng cho chip chuỗi ở thanh trên cùng. */
    @GetMapping("/streak")
    public ApiResponse<StatsOverviewView.Streak> streak(@CurrentUserId UUID userId) {
        return ApiResponse.ok(statsService.streak(userId));
    }

    @GetMapping("/dictation-errors")
    public ApiResponse<DictationErrorsView> dictationErrors(@CurrentUserId UUID userId,
            @RequestParam(required = false) String range) {
        return ApiResponse.ok(statsService.dictationErrors(userId, range));
    }

    /** Mười từ nghe sai nhiều nhất theo khoảng, để học viên lưu vào từ vựng. */
    @GetMapping("/dictation-errors/words")
    public ApiResponse<WrongWordsView> wrongWords(@CurrentUserId UUID userId,
            @RequestParam(required = false) String range) {
        return ApiResponse.ok(statsService.wrongWords(userId, range));
    }

    /** Lịch nhiệt các ngày học trong 13 tuần gần nhất; không phụ thuộc bộ lọc khoảng. */
    @GetMapping("/activity")
    public ApiResponse<ActivityView> activity(@CurrentUserId UUID userId) {
        return ApiResponse.ok(statsService.activity(userId));
    }

    /** Lịch sử luyện tập; {@code mode} là {@code all}, {@code dictation}, {@code shadowing}, {@code vocab} hoặc {@code ai}. */
    @GetMapping("/history")
    public ApiResponse<PageResponse<HistoryView>> history(@CurrentUserId UUID userId,
            @RequestParam(required = false) String mode, @RequestParam(required = false) String range,
            @RequestParam(defaultValue = "0") int page) {
        return ApiResponse.ok(statsService.history(userId, mode, range, page));
    }

    /** Từng lượt của một Buổi luyện: bài, chế độ và ngày lịch (theo múi giờ của học viên). */
    @GetMapping("/history/practice-sessions/{lessonId}")
    public ApiResponse<PracticeSessionDetailView> practiceSession(@CurrentUserId UUID userId,
            @PathVariable UUID lessonId, @RequestParam PracticeMode mode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day) {
        return ApiResponse.ok(statsService.practiceSession(userId, lessonId, mode, day));
    }

    @GetMapping("/pronunciation")
    public ApiResponse<PronunciationView.Overview> pronunciation(@CurrentUserId UUID userId,
            @RequestParam(required = false) String range) {
        return ApiResponse.ok(statsService.pronunciation(userId, range));
    }

    /** Chi tiết một âm vị. Ký hiệu đi qua query vì có ký tự IPA như {@code θ} và {@code ʃ}. */
    @GetMapping("/pronunciation/phoneme")
    public ApiResponse<PronunciationView.Detail> phoneme(@CurrentUserId UUID userId, @RequestParam String symbol,
            @RequestParam(required = false) String range) {
        return ApiResponse.ok(statsService.phoneme(userId, symbol, range));
    }
}
