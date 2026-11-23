package com.lingualoop.backend.practice.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.PracticeSessionDetailView;
import com.lingualoop.backend.practice.dto.PracticeSessionView;
import com.lingualoop.backend.practice.dto.SentenceCountsView;
import com.lingualoop.backend.practice.dto.WordClassErrorView;
import com.lingualoop.backend.practice.dto.WrongWordView;

/**
 * Số liệu luyện câu của một học viên cho feature {@code stats}. Chỉ đọc; không để lộ entity hay repository của
 * practice. {@code since} là đầu ngày đầu tiên của Khoảng thống kê theo múi giờ của học viên.
 */
public interface PracticeStatsQueryService {

    /** Ngày lịch có ít nhất một lượt làm Nghe chép hoặc Shadowing (BR-TH-02). */
    Set<LocalDate> activeDays(UUID userId);

    SentenceCountsView sentenceCounts(UUID userId, Instant since);

    /** Số lượt làm Nghe chép và Shadowing mỗi ngày lịch từ {@code since}, chỉ các ngày có lượt (BR-TH-15). */
    Map<LocalDate, Long> activityByDay(UUID userId, Instant since);

    /** Các từ bị sai nhiều nhất trên lượt nộp đầu tiên, nhiều lần sai nhất trước, tối đa {@code limit} từ (BR-TH-16). */
    List<WrongWordView> topWrongWords(UUID userId, Instant since, int limit);

    /** Số câu khác nhau đã luyện trong khoảng nửa mở {@code [from, until)}, để so với khoảng liền trước (BR-TH-13). */
    long sentencesBetween(UUID userId, Instant from, Instant until);

    /**
     * Với mỗi nhóm từ: bài gần nhất học viên từng làm sai từ thuộc nhóm đó ở lượt nộp đầu tiên mà còn mở được với gói
     * hiện tại. Nhóm không có bài nào thì vắng mặt trong kết quả (BR-TH-14).
     */
    Map<String, UUID> latestOpenLessonByWordClass(UUID userId, boolean pro);

    /** Lỗi Nghe chép theo nhóm từ, chỉ có các nhóm đã gặp (BR-TH-05). */
    List<WordClassErrorView> dictationErrors(UUID userId, Instant since);

    /** Các Buổi luyện từ mới đến cũ, tối đa {@code limit} dòng, chỉ ở các chế độ đã chọn. */
    List<PracticeSessionView> practiceSessions(UUID userId, Instant since, Collection<PracticeMode> modes, int limit);

    long countPracticeSessions(UUID userId, Instant since, Collection<PracticeMode> modes);

    /** Từng lượt của một Buổi luyện; rỗng nếu học viên không có buổi đó. */
    Optional<PracticeSessionDetailView> practiceSessionDetail(UUID userId, UUID lessonId, PracticeMode mode,
            LocalDate day);
}
