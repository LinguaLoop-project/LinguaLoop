package com.lingualoop.backend.lesson.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.lingualoop.backend.lesson.dto.response.LessonDetailResponse;
import com.lingualoop.backend.lesson.dto.response.LessonSuggestionResponse;
import com.lingualoop.backend.lesson.dto.response.LessonSummaryResponse;
import com.lingualoop.backend.lesson.dto.response.LibraryOverviewResponse;
import com.lingualoop.backend.lesson.dto.response.SentenceResponse;
import com.lingualoop.backend.lesson.dto.response.TopicResponse;
import com.lingualoop.backend.lesson.dto.response.TopicRowResponse;
import com.lingualoop.backend.lesson.enums.LessonState;

public interface LessonQueryService {

    List<TopicResponse> getTopics(UUID userId);

    TopicRowResponse getTopic(UUID topicId, UUID userId);

    /**
     * Tìm bài trong thư viện.
     *
     * @param cefrLevel một hoặc nhiều mức CEFR cách nhau dấu phẩy
     * @param state     lọc theo tiến độ của {@code userId}; null = không lọc
     */
    Page<LessonSummaryResponse> searchLessons(String q, UUID topicId, String cefrLevel, Boolean free,
                                      LessonState state, UUID userId, Pageable pageable);

    LibraryOverviewResponse getOverview(UUID userId);

    /**
     * Một bài chưa từng luyện nghe chép để gợi ý khi người học không còn gì để ôn: mức CEFR thấp trước, rồi bài nhiều lượt
     * xem. Rỗng nếu người học đã luyện mọi bài họ xem được.
     */
    Optional<LessonSuggestionResponse> suggestDictationLesson(UUID userId, boolean userPro);

    /**
     * Một bài chưa từng luyện Shadowing để gợi ý: bài đã luyện nghe chép đứng trước, rồi mức CEFR thấp và nhiều lượt xem.
     * Rỗng nếu người học đã luyện Shadowing mọi bài họ xem được.
     */
    Optional<LessonSuggestionResponse> suggestShadowingLesson(UUID userId, boolean userPro);

    LessonDetailResponse getLessonDetail(UUID lessonId, UUID userId);

    List<SentenceResponse> getSentences(UUID lessonId, UUID userId);
}
