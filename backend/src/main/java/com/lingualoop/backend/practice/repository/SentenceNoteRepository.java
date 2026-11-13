package com.lingualoop.backend.practice.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.practice.entity.SentenceNote;
import com.lingualoop.backend.practice.entity.SentenceNoteId;

@Repository
public interface SentenceNoteRepository extends JpaRepository<SentenceNote, SentenceNoteId> {

    @Query(value = """
            SELECT * FROM sentence_notes
            WHERE user_id = :userId AND sentence_id = :sentenceId AND mode = :mode""", nativeQuery = true)
    Optional<SentenceNote> findOne(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId,
            @Param("mode") String mode);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            DELETE FROM sentence_notes
            WHERE user_id = :userId AND sentence_id = :sentenceId AND mode = :mode""", nativeQuery = true)
    int deleteOne(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId, @Param("mode") String mode);

    /** Ghi chú của người dùng ở một chế độ trong một bài, để gắn vào danh sách câu của màn luyện. */
    @Query(value = """
            SELECT n.* FROM sentence_notes n JOIN sentences s ON s.id = n.sentence_id
            WHERE n.user_id = :userId AND s.lesson_id = :lessonId AND n.mode = :mode""", nativeQuery = true)
    List<SentenceNote> findByLesson(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId,
            @Param("mode") String mode);

    /**
     * Ghi chú kèm câu và bài, mới sửa trước. Truyền {@code mode} để chỉ lấy một chế độ và {@code lessonId} để chỉ lấy
     * một bài; để null thì không lọc. {@code sortOrder} là thứ tự câu trong bài theo mốc thời gian.
     */
    @Query(value = """
            SELECT n.sentence_id AS sentenceId, n.mode AS mode, n.content AS content, n.updated_at AS updatedAt,
                   l.id AS lessonId, l.title AS lessonTitle, s.rn AS sortOrder, s.text_en AS text, s.text_vi AS textVi
            FROM sentence_notes n
            JOIN (SELECT id, lesson_id, text_en, text_vi,
                         CAST(row_number() OVER (PARTITION BY lesson_id ORDER BY start_ms) AS integer) AS rn
                  FROM sentences WHERE deleted_at IS NULL) s ON s.id = n.sentence_id
            JOIN lessons l ON l.id = s.lesson_id AND l.deleted_at IS NULL
            WHERE n.user_id = :userId
              AND (CAST(:mode AS text) IS NULL OR n.mode = CAST(:mode AS text))
              AND (CAST(:lessonId AS uuid) IS NULL OR l.id = CAST(:lessonId AS uuid))
            ORDER BY n.updated_at DESC, n.sentence_id""", nativeQuery = true)
    List<NoteEntry> findEntries(@Param("userId") UUID userId, @Param("mode") String mode,
            @Param("lessonId") UUID lessonId);

    interface NoteEntry {
        UUID getSentenceId();

        String getMode();

        String getContent();

        Instant getUpdatedAt();

        UUID getLessonId();

        String getLessonTitle();

        Integer getSortOrder();

        String getText();

        String getTextVi();
    }
}
