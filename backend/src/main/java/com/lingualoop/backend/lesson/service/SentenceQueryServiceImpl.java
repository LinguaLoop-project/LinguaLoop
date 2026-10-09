package com.lingualoop.backend.lesson.service;

import com.lingualoop.backend.lesson.dto.LessonView;
import com.lingualoop.backend.lesson.dto.SentenceView;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SentenceQueryServiceImpl implements SentenceQueryService {

    @Override
    public Optional<LessonView> findLesson(UUID lessonId) {
        // Stub implementation
        return Optional.of(new LessonView(
            lessonId, "stub-lesson", "Stub Lesson", "Bài học mẫu", "A2", false, "youtube", "https://youtube.com/watch?v=stub", 120
        ));
    }

    @Override
    public Optional<LessonView> findLessonBySlug(String slug) {
        // Stub implementation
        return Optional.of(new LessonView(
            UUID.randomUUID(), slug, "Stub Lesson", "Bài học mẫu", "A2", false, "youtube", "https://youtube.com/watch?v=stub", 120
        ));
    }

    @Override
    public List<SentenceView> findSentences(UUID lessonId) {
        // Stub implementation
        return List.of(
            new SentenceView(UUID.randomUUID(), lessonId, 1, "Hello world", "Xin chào", "hɛˈloʊ wɜrld", 0, 2000, "A1"),
            new SentenceView(UUID.randomUUID(), lessonId, 2, "How are you?", "Bạn khỏe không?", "haʊ ɑr ju", 2000, 4000, "A1")
        );
    }

    @Override
    public Optional<SentenceView> findSentence(UUID sentenceId) {
        // Stub implementation
        return Optional.of(new SentenceView(
            sentenceId, UUID.randomUUID(), 1, "Hello world", "Xin chào", "hɛˈloʊ wɜrld", 0, 2000, "A1"
        ));
    }

    @Override
    public void assertCanPractice(UUID userId, UUID lessonId) {
        // Stub: Do nothing, assume always can practice
    }
}
