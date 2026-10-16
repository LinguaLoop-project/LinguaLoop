package com.lingualoop.backend.lesson.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.lingualoop.backend.lesson.dto.response.LessonDetailResponse;
import com.lingualoop.backend.lesson.dto.response.LessonSummaryResponse;
import com.lingualoop.backend.lesson.dto.response.LibraryOverviewResponse;
import com.lingualoop.backend.lesson.dto.response.SentenceResponse;
import com.lingualoop.backend.lesson.dto.response.TopicResponse;
import com.lingualoop.backend.lesson.dto.response.TopicRowResponse;
import com.lingualoop.backend.lesson.enums.LessonState;

public interface LessonQueryService {

    List<TopicResponse> getTopics(UUID userId);

    TopicRowResponse getTopic(String slug, UUID userId);

    /**
     * Tìm bài trong thư viện.
     *
     * @param state lọc theo tiến độ của {@code userId}; null = không lọc
     */
    Page<LessonSummaryResponse> searchLessons(String q, String topic, String difficulty, Boolean free,
                                      LessonState state, UUID userId, Pageable pageable);

    LibraryOverviewResponse getOverview(UUID userId);

    LessonDetailResponse getLessonDetail(String slug, UUID userId);

    List<SentenceResponse> getSentences(String slug, UUID userId);
}
