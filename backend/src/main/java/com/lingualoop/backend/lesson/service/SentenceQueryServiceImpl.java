package com.lingualoop.backend.lesson.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.lesson.dto.LessonView;
import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.Sentence;
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
class SentenceQueryServiceImpl implements SentenceQueryService {

    private final LessonRepository lessonRepository;
    private final SentenceRepository sentenceRepository;
    private final LessonMapper lessonMapper;
    private final SentenceMapper sentenceMapper;
    private final SubscriptionQueryService subscriptionQueryService;

    @Override
    public Optional<LessonView> findLesson(UUID lessonId) {
        return lessonRepository.findVisibleById(lessonId).map(lessonMapper::toView);
    }

    @Override
    public List<SentenceView> findSentences(UUID lessonId) {
        List<Sentence> sentences = sentenceRepository.findByLessonIdAndDeletedAtIsNullOrderByStartMsAsc(lessonId);
        return IntStream.range(0, sentences.size())
                .mapToObj(i -> sentenceMapper.toView(sentences.get(i), i + 1))
                .toList();
    }

    @Override
    public Optional<SentenceView> findSentence(UUID sentenceId) {
        return sentenceRepository.findById(sentenceId)
                .filter(s -> s.getDeletedAt() == null && isVisible(s.getLesson()))
                .map(s -> sentenceMapper.toView(s, (int) sentenceRepository
                        .countByLessonIdAndDeletedAtIsNullAndStartMsLessThan(s.getLesson().getId(), s.getStartMs()) + 1));
    }

    @Override
    public void assertCanPractice(UUID userId, UUID lessonId) {
        Lesson lesson = lessonRepository.findVisibleById(lessonId)
                .orElseThrow(() -> new NotFoundException("Lesson not found"));
        if (lesson.isPro() && !subscriptionQueryService.isPro(userId)) {
            throw new BusinessException(ErrorCode.LESSON_PRO_REQUIRED);
        }
    }

    private static boolean isVisible(Lesson lesson) {
        return Lesson.KIND_LIBRARY.equals(lesson.getKind()) && lesson.getStatus() == LessonStatus.PUBLISHED
                && lesson.getDeletedAt() == null;
    }
}
