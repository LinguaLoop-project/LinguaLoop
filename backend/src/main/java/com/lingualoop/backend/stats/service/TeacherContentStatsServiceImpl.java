package com.lingualoop.backend.stats.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.report.dto.request.ReportListQuery;
import com.lingualoop.backend.report.enums.ReportStatus;
import com.lingualoop.backend.report.service.ReportReviewService;
import com.lingualoop.backend.stats.dto.StatsPeriod;
import com.lingualoop.backend.stats.dto.TeacherDeckStatsView;
import com.lingualoop.backend.stats.dto.TeacherLessonStatsView;
import com.lingualoop.backend.stats.dto.TeacherOverviewView;
import com.lingualoop.backend.stats.repository.TeacherContentStatsRepository;
import com.lingualoop.backend.stats.repository.TeacherContentStatsRepository.ContentRef;

import lombok.RequiredArgsConstructor;

/**
 * Kiểm quyền xem (BR-TN-01) rồi lấy số liệu từ {@link TeacherContentStatsReader}. Số báo cáo đang mở không qua bộ nhớ
 * đệm để khớp ngay với danh sách "Báo cáo nội dung" mà tổng quan dẫn tới (UC-TN-01 nhánh 4b).
 */
@Service
@RequiredArgsConstructor
class TeacherContentStatsServiceImpl implements TeacherContentStatsService {

    /** Dòng báo cáo Chờ giáo viên, như bộ lọc mặc định của danh sách báo cáo của giáo viên (UC-XL-01). */
    private static final ReportListQuery OPEN_REPORTS = new ReportListQuery(ReportStatus.WAITING_TEACHER, null, null,
            false, null, false, null, null, false, false);
    private static final String LIBRARY = "library";

    private final TeacherContentStatsReader reader;
    private final TeacherContentStatsRepository repository;
    private final ReportReviewService reports;

    @Override
    public TeacherOverviewView overview(UUID teacherId, StatsPeriod period) {
        long openReports = reports.listForTeacher(teacherId, OPEN_REPORTS, 0).totalElements();
        return reader.overview(teacherId, period).withOpenReports(openReports);
    }

    @Override
    public TeacherLessonStatsView lesson(UUID teacherId, UUID lessonId, StatsPeriod period) {
        ContentRef lesson = owned(repository.lesson(lessonId).orElse(null), teacherId, ErrorCode.LESSON_NOT_FOUND);
        return reader.lesson(lessonId, lesson, period);
    }

    @Override
    public TeacherDeckStatsView deck(UUID teacherId, UUID deckId, StatsPeriod period) {
        ContentRef deck = owned(repository.deck(deckId).orElse(null), teacherId, ErrorCode.VOCAB_DECK_NOT_FOUND);
        return reader.deck(deckId, deck, period);
    }

    /** Nội dung không tồn tại hoặc đã xóa là không tìm thấy; nội dung thư viện của người khác là không có quyền. */
    private static ContentRef owned(ContentRef ref, UUID teacherId, ErrorCode notFound) {
        if (ref == null || ref.deleted()) {
            throw new BusinessException(notFound);
        }
        if (!LIBRARY.equals(ref.kind()) || !teacherId.equals(ref.ownerId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return ref;
    }
}
