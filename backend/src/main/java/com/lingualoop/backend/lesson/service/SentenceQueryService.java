package com.lingualoop.backend.lesson.service;

import com.lingualoop.backend.lesson.dto.LessonView;
import com.lingualoop.backend.lesson.dto.SentenceView;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SentenceQueryService {
    Optional<LessonView> findLesson(UUID lessonId);
    Optional<LessonView> findLessonBySlug(String slug);
    List<SentenceView> findSentences(UUID lessonId);
    Optional<SentenceView> findSentence(UUID sentenceId);
    void assertCanPractice(UUID userId, UUID lessonId);
}
