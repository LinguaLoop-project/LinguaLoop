package com.lingualoop.backend.lesson.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.lesson.dto.LessonView;
import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.enums.LessonStatus;
import com.lingualoop.backend.lesson.mapper.LessonMapper;
import com.lingualoop.backend.lesson.mapper.SentenceMapper;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;

import lombok.RequiredArgsConstructor;

/** Hợp đồng đọc bài và câu để luyện (planning/README.md §4), feature dictation/shadowing dùng. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SentenceQueryServiceImpl implements SentenceQueryService {

    private final LessonRepository lessonRepository;
    private final SentenceRepository sentenceRepository;
    private final LessonMapper lessonMapper;
    private final SentenceMapper sentenceMapper;
    private final SubscriptionQueryService subscriptionQueryService;

    @Override
    public Optional<LessonView> findLesson(UUID lessonId) {
        return lessonRepository.findByIdAndStatusAndDeletedAtIsNull(lessonId, LessonStatus.APPROVED)
                .map(lessonMapper::toView);
    }

    @Override
    public Optional<LessonView> findLessonBySlug(String slug) {
        return lessonRepository.findBySlugAndStatusAndDeletedAtIsNull(slug, LessonStatus.APPROVED)
                .map(lessonMapper::toView);
    }

    @Override
    public List<SentenceView> findSentences(UUID lessonId) {
        return sentenceRepository.findByLessonIdOrderBySortOrderAsc(lessonId).stream()
                .map(sentenceMapper::toView)
                .toList();
    }

    @Override
    public Optional<SentenceView> findSentence(UUID sentenceId) {
        return sentenceRepository.findById(sentenceId)
                .filter(s -> isVisible(s.getLesson()))
                .map(sentenceMapper::toView);
    }

    @Override
    public void assertCanPractice(UUID userId, UUID lessonId) {
        Lesson lesson = lessonRepository.findByIdAndStatusAndDeletedAtIsNull(lessonId, LessonStatus.APPROVED)
                .orElseThrow(() -> new NotFoundException("Lesson not found"));
        if (lesson.isPro() && !subscriptionQueryService.isPro(userId)) {
            throw new BusinessException(ErrorCode.LESSON_PRO_REQUIRED);
        }
    }

    private static boolean isVisible(Lesson lesson) {
        return lesson.getStatus() == LessonStatus.APPROVED && lesson.getDeletedAt() == null;
    }
}
