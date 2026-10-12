package com.lingualoop.backend.lesson.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.lingualoop.backend.lesson.dto.LessonDetail;
import com.lingualoop.backend.lesson.dto.LessonSummary;
import com.lingualoop.backend.lesson.dto.LibraryOverview;
import com.lingualoop.backend.lesson.dto.SentenceResponse;
import com.lingualoop.backend.lesson.dto.TopicResponse;
import com.lingualoop.backend.lesson.dto.TopicRow;
import com.lingualoop.backend.lesson.enums.LessonState;

public interface LessonQueryService {

    List<TopicResponse> getTopics(UUID userId);

    TopicRow getTopic(String slug, UUID userId);

    /**
     * Tìm bài trong thư viện.
     *
     * @param state lọc theo tiến độ của {@code userId}; null = không lọc
     */
    Page<LessonSummary> searchLessons(String q, String topic, String difficulty, Boolean free,
                                      LessonState state, UUID userId, Pageable pageable);

    LibraryOverview getOverview(UUID userId);

    LessonDetail getLessonDetail(String slug, UUID userId);

    List<SentenceResponse> getSentences(String slug, UUID userId);
}
