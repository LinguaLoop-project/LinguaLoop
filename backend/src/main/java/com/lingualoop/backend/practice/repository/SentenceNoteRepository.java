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

@Repository
public interface SentenceNoteRepository extends JpaRepository<SentenceNote, UUID> {

    @Query(value = """
            SELECT * FROM sentence_notes
            WHERE user_id = :userId AND sentence_id = :sentenceId AND mode = CAST(:mode AS practice_mode)""",
            nativeQuery = true)
    Optional<SentenceNote> findOne(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId,
            @Param("mode") String mode);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            DELETE FROM sentence_notes
            WHERE user_id = :userId AND sentence_id = :sentenceId AND mode = CAST(:mode AS practice_mode)""",
            nativeQuery = true)
    int deleteOne(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId, @Param("mode") String mode);

    /** Ghi chú của người dùng ở một chế độ trong một bài, để gắn vào danh sách câu của màn luyện. */
    @Query(value = """
            SELECT n.* FROM sentence_notes n JOIN sentences s ON s.id = n.sentence_id
            WHERE n.user_id = :userId AND s.lesson_id = :lessonId AND n.mode = CAST(:mode AS practice_mode)""",
            nativeQuery = true)
    List<SentenceNote> findByLesson(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId,
            @Param("mode") String mode);

    /**
     * Ghi chú kèm câu và bài, mới sửa trước. Truyền {@code mode} để chỉ lấy một chế độ và {@code lessonSlug} để chỉ lấy
     * một bài; để null thì không lọc.
     */
    @Query(value = """
            SELECT n.sentence_id AS sentenceId, CAST(n.mode AS text) AS mode, n.content AS content,
                   n.updated_at AS updatedAt, l.slug AS lessonSlug, l.title AS lessonTitle,
                   s.sort_order AS sortOrder, s.text AS text, s.text_vi AS textVi
            FROM sentence_notes n
            JOIN sentences s ON s.id = n.sentence_id
            JOIN lessons l ON l.id = s.lesson_id AND l.deleted_at IS NULL
            WHERE n.user_id = :userId
              AND (CAST(:mode AS text) IS NULL OR CAST(n.mode AS text) = CAST(:mode AS text))
              AND (CAST(:lessonSlug AS text) IS NULL OR l.slug = CAST(:lessonSlug AS text))
            ORDER BY n.updated_at DESC, n.id""", nativeQuery = true)
    List<NoteEntry> findEntries(@Param("userId") UUID userId, @Param("mode") String mode,
            @Param("lessonSlug") String lessonSlug);

    interface NoteEntry {
        UUID getSentenceId();

        String getMode();

        String getContent();

        Instant getUpdatedAt();

        String getLessonSlug();

        String getLessonTitle();

        Integer getSortOrder();

        String getText();

        String getTextVi();
    }
}
