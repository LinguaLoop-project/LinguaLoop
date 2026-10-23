package com.lingualoop.backend.practice.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.practice.entity.SentenceNote;

@Repository
public interface SentenceNoteRepository extends JpaRepository<SentenceNote, UUID> {

    Optional<SentenceNote> findByUserIdAndSentenceId(UUID userId, UUID sentenceId);

    void deleteByUserIdAndSentenceId(UUID userId, UUID sentenceId);

    /** Ghi chú của người dùng trong một bài, để gắn vào danh sách câu của màn nghe chép. */
    @Query(value = """
            SELECT n.* FROM sentence_notes n JOIN sentences s ON s.id = n.sentence_id
            WHERE n.user_id = :userId AND s.lesson_id = :lessonId""", nativeQuery = true)
    List<SentenceNote> findByLesson(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId);

    /** Ghi chú kèm câu và bài; lọc theo bài khi truyền lessonSlug. Mới sửa trước. */
    @Query(value = """
            SELECT n.sentence_id AS sentenceId, n.content AS content, n.updated_at AS updatedAt,
                   l.slug AS lessonSlug, l.title AS lessonTitle, s.sort_order AS sortOrder,
                   s.text AS text, s.text_vi AS textVi
            FROM sentence_notes n
            JOIN sentences s ON s.id = n.sentence_id
            JOIN lessons l ON l.id = s.lesson_id AND l.deleted_at IS NULL
            WHERE n.user_id = :userId AND (CAST(:lessonSlug AS text) IS NULL OR l.slug = CAST(:lessonSlug AS text))
            ORDER BY n.updated_at DESC, n.id""", nativeQuery = true)
    List<NoteEntry> findEntries(@Param("userId") UUID userId, @Param("lessonSlug") String lessonSlug);

    interface NoteEntry {
        UUID getSentenceId();

        String getContent();

        Instant getUpdatedAt();

        String getLessonSlug();

        String getLessonTitle();

        Integer getSortOrder();

        String getText();

        String getTextVi();
    }
}
