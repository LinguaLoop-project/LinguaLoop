package com.lingualoop.backend.lesson.repository;

import com.lingualoop.backend.lesson.entity.Sentence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SentenceRepository extends JpaRepository<Sentence, UUID> {
    List<Sentence> findByLessonIdOrderBySortOrderAsc(UUID lessonId);
}
