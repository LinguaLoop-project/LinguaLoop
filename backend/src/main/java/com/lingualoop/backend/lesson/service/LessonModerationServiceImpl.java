package com.lingualoop.backend.lesson.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class LessonModerationServiceImpl implements LessonModerationService {

    private final JdbcClient jdbc;

    @Override
    @Transactional
    public void unpublishForReport(UUID lessonId, String reason) {
        jdbc.sql("""
                UPDATE lessons SET status = 'draft', unpublish_reason = :reason
                WHERE id = :id AND kind = 'library' AND status = 'published' AND deleted_at IS NULL""")
                .param("id", lessonId).param("reason", reason)
                .update();
    }

    @Override
    @Transactional
    public void publishApproved(UUID lessonId) {
        // Khóa dòng bài để giáo viên không sửa câu giữa lúc kiểm điều kiện và lúc xuất bản.
        jdbc.sql("SELECT id FROM lessons WHERE id = :id AND kind = 'library' AND deleted_at IS NULL FOR UPDATE")
                .param("id", lessonId).query(UUID.class).optional()
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        // Thứ tự câu theo mốc bắt đầu, như SentenceView.sortOrder (BR-BH-11).
        List<Integer> missing = jdbc.sql("""
                SELECT n FROM (
                    SELECT row_number() OVER (ORDER BY start_ms) AS n, text_vi
                    FROM sentences WHERE lesson_id = :id AND deleted_at IS NULL) t
                WHERE text_vi IS NULL OR btrim(text_vi) = ''
                ORDER BY n""")
                .param("id", lessonId).query(Integer.class).list();
        long sentences = jdbc.sql("SELECT count(*) FROM sentences WHERE lesson_id = :id AND deleted_at IS NULL")
                .param("id", lessonId).query(Long.class).single();
        if (sentences == 0 || !missing.isEmpty()) {
            throw new BusinessException(ErrorCode.LESSON_NOT_PUBLISHABLE,
                    Map.of("noSentences", sentences == 0, "missingTranslation", missing));
        }
        jdbc.sql("UPDATE lessons SET status = 'published', unpublish_reason = NULL WHERE id = :id")
                .param("id", lessonId).update();
    }

    /** Trường của câu nhận bản sửa đề xuất (BR-BC-11); tên cột ghép thẳng vào câu lệnh nên chỉ lấy từ danh sách này. */
    private static final Set<String> FIXABLE = Set.of("text_en", "ipa_us", "ipa_uk", "text_vi");

    @Override
    @Transactional
    public String applyReportFix(UUID sentenceId, String column, String value) {
        if (!FIXABLE.contains(column)) {
            throw new IllegalArgumentException("Không phải trường sửa được của câu: " + column);
        }
        String old = jdbc.sql("SELECT " + column + " FROM sentences WHERE id = :id AND deleted_at IS NULL FOR UPDATE")
                .param("id", sentenceId).query((rs, n) -> Optional.ofNullable(rs.getString(1))).optional()
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_TARGET_NOT_FOUND))
                .orElse(null);
        jdbc.sql("UPDATE sentences SET " + column + " = :value, updated_at = now() WHERE id = :id")
                .param("value", value.strip()).param("id", sentenceId).update();
        return old;
    }
}
