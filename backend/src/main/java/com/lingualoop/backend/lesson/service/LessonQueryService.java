package com.lingualoop.backend.lesson.service;

import com.lingualoop.backend.lesson.dto.*;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.mapper.LessonMapper;
import com.lingualoop.backend.lesson.mapper.SentenceMapper;
import com.lingualoop.backend.lesson.mapper.TopicMapper;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.LessonSpecification;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.lesson.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonQueryService {

    private final TopicRepository topicRepository;
    private final LessonRepository lessonRepository;
    private final SentenceRepository sentenceRepository;
    private final TopicMapper topicMapper;
    private final LessonMapper lessonMapper;
    private final SentenceMapper sentenceMapper;
    private final PlanService planService;

    private final com.lingualoop.backend.lesson.repository.LessonProgressRepository progressRepository;

    public List<TopicResponse> getTopics(UUID userId) {
        return topicRepository.findAll().stream()
                .map(t -> {
                    TopicResponse tr = topicMapper.toResponse(t);
                    long total = lessonRepository.countByTopicIdAndStatusAndDeletedAtIsNull(t.getId(), com.lingualoop.backend.lesson.enums.LessonStatus.APPROVED);
                    long completed = progressRepository.countCompletedLessonsByUserAndTopic(userId, t.getId());
                    return new TopicResponse(tr.id(), tr.slug(), tr.name(), tr.nameVi(), tr.icon(), tr.sortOrder(), total, completed);
                })
                .collect(Collectors.toList());
    }

    public TopicRow getTopic(String slug, UUID userId) {
        TopicResponse topic = getTopics(userId).stream()
                .filter(t -> t.slug().equals(slug))
                .findFirst()
                .orElseThrow(() -> new com.lingualoop.backend.common.exception.BusinessException(
                        com.lingualoop.backend.common.exception.ErrorCode.NOT_FOUND, "Topic not found"));
        // API requires paginated lessons separately via /lessons?topic=slug, so here we return empty lessons list.
        return new TopicRow(topic, topic.totalLessons(), Collections.emptyList());
    }

    public Page<LessonSummary> searchLessons(String q, String topic, String difficulty, Boolean free, String state, String mode, Pageable pageable) {
        Specification<Lesson> spec = LessonSpecification.filterLessons(q, topic, difficulty, free);
        // TODO: state (todo, doing, done) and mode filtering require joining user_lesson_progress
        // For simplicity in this step, we just filter basic attributes.
        return lessonRepository.findAll(spec, pageable)
                .map(this::mapToSummary);
    }

    private LessonSummary mapToSummary(Lesson lesson) {
        LessonSummary summary = lessonMapper.toSummary(lesson);
        Long count = lessonRepository.getSentenceCount(lesson.getId());
        return new LessonSummary(
                summary.id(), summary.slug(), summary.title(), summary.titleVi(), summary.difficulty(),
                summary.sourceType(), summary.durationSec(), summary.viewCount(), summary.thumbnailUrl(),
                summary.pro(), summary.pro(), // locked if pro, stubbed
                count != null ? count : 0L,
                new ModeProgress(0, 0) // stubbed progress
        );
    }

    public LibraryOverview getOverview(UUID userId) {
        List<LessonSummary> continues = lessonRepository.findContinueLessons(userId, org.springframework.data.domain.PageRequest.of(0, 3))
                .stream().map(this::mapToSummary).collect(Collectors.toList());
        List<TopicRow> rows = getTopics(userId).stream()
                .limit(6)
                .map(t -> {
                    List<LessonSummary> popular = lessonRepository.findTopPopularByTopicSlug(t.slug(), org.springframework.data.domain.PageRequest.of(0, 4))
                            .stream().map(this::mapToSummary).collect(Collectors.toList());
                    return new TopicRow(t, t.totalLessons(), popular);
                })
                .collect(Collectors.toList());
        return new LibraryOverview(continues, rows);
    }

    public LessonDetail getLessonDetail(String slug, UUID userId) {
        Lesson lesson = lessonRepository.findBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new com.lingualoop.backend.common.exception.BusinessException(
                        com.lingualoop.backend.common.exception.ErrorCode.NOT_FOUND, "Lesson not found"));
        
        LessonDetail detail = lessonMapper.toDetail(lesson);
        Long count = lessonRepository.getSentenceCount(lesson.getId());
        List<LessonSummary> related = lessonRepository.findRelatedLessons(lesson.getTopic().getId(), lesson.getId(), org.springframework.data.domain.PageRequest.of(0, 3))
                .stream().map(this::mapToSummary).collect(Collectors.toList());
        
        return new LessonDetail(
                detail.id(), detail.slug(), detail.title(), detail.titleVi(), detail.description(), detail.difficulty(),
                detail.sourceType(), detail.sourceUrl(), detail.durationSec(), detail.viewCount(), detail.thumbnailUrl(),
                detail.pro(), detail.pro(), // locked if pro, stubbed
                count != null ? count : 0L,
                new ModeProgress(0, 0), // stubbed progress
                related
        );
    }

    public List<SentenceResponse> getSentences(String slug, UUID userId) {
        Lesson lesson = lessonRepository.findBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new com.lingualoop.backend.common.exception.BusinessException(
                        com.lingualoop.backend.common.exception.ErrorCode.NOT_FOUND, "Lesson not found"));

        if (lesson.isPro() && !planService.isPro(userId)) {
            throw new com.lingualoop.backend.common.exception.BusinessException(
                    com.lingualoop.backend.common.exception.ErrorCode.LESSON_PRO_REQUIRED, "Bạn cần gói Pro để xem nội dung này");
        }

        return sentenceRepository.findByLessonIdOrderBySortOrderAsc(lesson.getId()).stream()
                .map(sentenceMapper::toResponse)
                .collect(Collectors.toList());
    }
}
