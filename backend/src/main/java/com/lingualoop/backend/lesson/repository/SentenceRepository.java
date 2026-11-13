package com.lingualoop.backend.lesson.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.lesson.entity.Sentence;

@Repository
public interface SentenceRepository extends JpaRepository<Sentence, UUID> {

    /** Câu chưa xoá của bài, theo thứ tự thời gian. */
    List<Sentence> findByLessonIdAndDeletedAtIsNullOrderByStartMsAsc(UUID lessonId);

    /** Số câu chưa xoá của bài đứng trước mốc {@code startMs}; cộng 1 là vị trí của câu trong bài. */
    long countByLessonIdAndDeletedAtIsNullAndStartMsLessThan(UUID lessonId, Integer startMs);
}
