package com.lingualoop.backend.lesson.service;

import com.lingualoop.backend.lesson.dto.LessonDetail;
import com.lingualoop.backend.lesson.dto.LessonSummary;
import com.lingualoop.backend.lesson.dto.SentenceResponse;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.Topic;
import com.lingualoop.backend.lesson.mapper.LessonMapper;
import com.lingualoop.backend.lesson.mapper.SentenceMapper;
import com.lingualoop.backend.lesson.mapper.TopicMapper;
import com.lingualoop.backend.lesson.repository.LessonProgressRepository;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.lesson.repository.TopicRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class LessonQueryServiceTest {

    @Mock private TopicRepository topicRepository;
    @Mock private LessonRepository lessonRepository;
    @Mock private SentenceRepository sentenceRepository;
    @Mock private TopicMapper topicMapper;
    @Mock private LessonMapper lessonMapper;
    @Mock private SentenceMapper sentenceMapper;
    @Mock private PlanService planService;
    @Mock private LessonProgressRepository progressRepository;

    @InjectMocks
    private LessonQueryService lessonQueryService;

    private UUID userId;
    private Lesson lesson;
    private Topic topic;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        topic = new Topic();
        ReflectionTestUtils.setField(topic, "id", UUID.randomUUID());
        topic.setSlug("test-topic");

        lesson = new Lesson();
        ReflectionTestUtils.setField(lesson, "id", UUID.randomUUID());
        lesson.setSlug("test-lesson");
        lesson.setTopic(topic);
    }

    @Test
    void searchLessons_shouldReturnPagedSummaries() {
        // Arrange
        when(lessonRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(lesson)));
        LessonSummary mockSummary = new LessonSummary(lesson.getId(), "test-lesson", "Title", null, null, null, 100, 0, null, false, false, 0L, null);
        when(lessonMapper.toSummary(lesson)).thenReturn(mockSummary);
        when(lessonRepository.getSentenceCount(lesson.getId())).thenReturn(10L);

        // Act
        Page<LessonSummary> result = lessonQueryService.searchLessons(null, null, null, null, null, null, Pageable.unpaged());

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(10L, result.getContent().get(0).sentenceCount());
    }

    @Test
    void getLessonDetail_shouldReturnDetail_whenFound() {
        // Arrange
        when(lessonRepository.findBySlugAndDeletedAtIsNull("test-lesson")).thenReturn(Optional.of(lesson));
        LessonDetail mockDetail = new LessonDetail(lesson.getId(), "test-lesson", "Title", null, null, null, null, null, 100, 0, null, false, false, 0L, null, null);
        when(lessonMapper.toDetail(lesson)).thenReturn(mockDetail);
        when(lessonRepository.getSentenceCount(lesson.getId())).thenReturn(5L);
        when(lessonRepository.findRelatedLessons(any(), any(), any())).thenReturn(List.of());

        // Act
        LessonDetail result = lessonQueryService.getLessonDetail("test-lesson", userId);

        // Assert
        assertNotNull(result);
        assertEquals(5L, result.sentenceCount());
    }

    @Test
    void getLessonDetail_shouldThrowException_whenNotFound() {
        // Arrange
        when(lessonRepository.findBySlugAndDeletedAtIsNull("non-existent")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(com.lingualoop.backend.common.exception.BusinessException.class, () -> {
            lessonQueryService.getLessonDetail("non-existent", userId);
        });
    }
}
