package com.lingualoop.backend.stats.service;

import java.util.UUID;

import com.lingualoop.backend.stats.dto.StatsPeriod;
import com.lingualoop.backend.stats.dto.TeacherDeckStatsView;
import com.lingualoop.backend.stats.dto.TeacherLessonStatsView;
import com.lingualoop.backend.stats.dto.TeacherOverviewView;

/**
 * Thống kê nội dung của giáo viên (UC-TN-01 đến 03). Giáo viên chỉ xem nội dung do mình tạo (BR-TN-01), chỉ số liệu
 * tổng hợp (BR-TN-05). Số liệu học tập được giữ trong bộ nhớ đệm tối đa 1 giờ và luôn kèm thời điểm tính (BR-TN-06).
 */
public interface TeacherContentStatsService {

    String CACHE_OVERVIEW = "teacherStatsOverview";
    String CACHE_LESSON = "teacherStatsLesson";
    String CACHE_DECK = "teacherStatsDeck";

    TeacherOverviewView overview(UUID teacherId, StatsPeriod period);

    /** Bài không tồn tại hoặc đã xóa ném {@code LESSON_NOT_FOUND}; bài của người khác ném {@code FORBIDDEN}. */
    TeacherLessonStatsView lesson(UUID teacherId, UUID lessonId, StatsPeriod period);

    /** Bộ không tồn tại hoặc đã xóa ném {@code VOCAB_DECK_NOT_FOUND}; bộ của người khác ném {@code FORBIDDEN}. */
    TeacherDeckStatsView deck(UUID teacherId, UUID deckId, StatsPeriod period);
}
