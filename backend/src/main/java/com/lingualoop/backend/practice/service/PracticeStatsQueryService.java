package com.lingualoop.backend.practice.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.PracticeSessionDetailView;
import com.lingualoop.backend.practice.dto.PracticeSessionView;
import com.lingualoop.backend.practice.dto.SentenceCountsView;
import com.lingualoop.backend.practice.dto.WordClassErrorView;

/**
 * Số liệu luyện câu của một học viên cho feature {@code stats}. Chỉ đọc; không để lộ entity hay repository của
 * practice. {@code since} là đầu ngày đầu tiên của Khoảng thống kê theo múi giờ của học viên.
 */
public interface PracticeStatsQueryService {

    /** Ngày lịch có ít nhất một lượt làm Nghe chép hoặc Shadowing (BR-TH-02). */
    Set<LocalDate> activeDays(UUID userId);

    SentenceCountsView sentenceCounts(UUID userId, Instant since);

    /** Lỗi Nghe chép theo nhóm từ, chỉ có các nhóm đã gặp (BR-TH-05). */
    List<WordClassErrorView> dictationErrors(UUID userId, Instant since);

    /** Các Buổi luyện từ mới đến cũ, tối đa {@code limit} dòng, chỉ ở các chế độ đã chọn. */
    List<PracticeSessionView> practiceSessions(UUID userId, Instant since, Collection<PracticeMode> modes, int limit);

    long countPracticeSessions(UUID userId, Instant since, Collection<PracticeMode> modes);

    /** Từng lượt của một Buổi luyện; rỗng nếu học viên không có buổi đó. */
    Optional<PracticeSessionDetailView> practiceSessionDetail(UUID userId, UUID lessonId, PracticeMode mode,
            LocalDate day);
}
