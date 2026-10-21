package com.lingualoop.backend.lesson.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.lesson.dto.response.LessonDetailResponse;
import com.lingualoop.backend.lesson.dto.response.LessonSummaryResponse;
import com.lingualoop.backend.lesson.dto.response.LibraryOverviewResponse;
import com.lingualoop.backend.lesson.dto.response.ModeProgressResponse;
import com.lingualoop.backend.lesson.dto.response.SentenceResponse;
import com.lingualoop.backend.lesson.dto.response.TopicResponse;
import com.lingualoop.backend.lesson.dto.response.TopicRowResponse;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.Topic;
import com.lingualoop.backend.lesson.enums.LessonState;
import com.lingualoop.backend.lesson.enums.LessonStatus;
import com.lingualoop.backend.lesson.mapper.LessonMapper;
import com.lingualoop.backend.lesson.mapper.SentenceMapper;
import com.lingualoop.backend.lesson.mapper.TopicMapper;
import com.lingualoop.backend.lesson.repository.LessonModeProgressRepository;
import com.lingualoop.backend.lesson.repository.LessonProgressRepository;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.LessonSpecification;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.lesson.repository.TopicRepository;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class LessonQueryServiceImpl implements LessonQueryService {

    private static final int CONTINUE_LIMIT = 3;
    private static final int POPULAR_PER_TOPIC = 6;
    private static final int RELATED_LIMIT = 3;

    private static final ModeProgressResponse NO_PROGRESS = new ModeProgressResponse(0, 0, 0);

    private final TopicRepository topicRepository;
    private final LessonRepository lessonRepository;
    private final SentenceRepository sentenceRepository;
    private final LessonProgressRepository progressRepository;
    private final LessonModeProgressRepository modeProgressRepository;
    private final TopicMapper topicMapper;
    private final LessonMapper lessonMapper;
    private final SentenceMapper sentenceMapper;
    private final SubscriptionQueryService subscriptionQueryService;

    @Override
    public List<TopicResponse> getTopics(UUID userId) {
        List<Topic> topics = topicRepository.findByStatusOrderBySortOrderAsc(LessonStatus.APPROVED);
        Map<UUID, Long> totals = toMap(lessonRepository.countApprovedGroupByTopic());
        Map<UUID, Long> completed = toMap(progressRepository.countCompletedGroupByTopic(userId));
        return topics.stream()
                .map(t -> withCounts(t, totals.getOrDefault(t.getId(), 0L), completed.getOrDefault(t.getId(), 0L)))
                .toList();
    }

    @Override
    public TopicRowResponse getTopic(String slug, UUID userId) {
        Topic topic = topicRepository.findBySlugAndStatus(slug, LessonStatus.APPROVED)
                .orElseThrow(() -> new NotFoundException("Topic not found"));
        long total = lessonRepository.countByTopicIdAndStatusAndDeletedAtIsNull(topic.getId(), LessonStatus.APPROVED);
        long completed = progressRepository.countCompletedLessonsByUserAndTopic(userId, topic.getId());
        // Danh sách bài của chủ đề lấy phân trang ở GET /lessons?topic=slug.
        return new TopicRowResponse(withCounts(topic, total, completed), total, Collections.emptyList());
    }

    @Override
    public Page<LessonSummaryResponse> searchLessons(String q, String topic, String difficulty, Boolean free,
                                             LessonState state, UUID userId, Pageable pageable) {
        Specification<Lesson> spec = LessonSpecification.filterLessons(q, topic, difficulty, free, state, userId);
        Page<Lesson> page = lessonRepository.findAll(spec, pageable);
        return new PageImpl<>(toSummaries(page.getContent(), userId), pageable, page.getTotalElements());
    }

    @Override
    public LibraryOverviewResponse getOverview(UUID userId) {
        List<Lesson> continueLessons = lessonRepository.findContinueLessons(userId, PageRequest.of(0, CONTINUE_LIMIT));
        List<Lesson> popular = lessonRepository.findTopPopularPerTopic(POPULAR_PER_TOPIC);

        // Dựng summary một lần cho mọi bài của cả hai danh sách để đếm câu và kiểm tra Pro theo lô.
        Map<UUID, Lesson> distinct = new LinkedHashMap<>();
        Stream.concat(continueLessons.stream(), popular.stream()).forEach(l -> distinct.putIfAbsent(l.getId(), l));
        Map<UUID, LessonSummaryResponse> summaries = toSummaries(new ArrayList<>(distinct.values()), userId).stream()
                .collect(Collectors.toMap(LessonSummaryResponse::id, Function.identity()));

        Map<UUID, List<LessonSummaryResponse>> popularByTopic = new LinkedHashMap<>();
        for (Lesson lesson : popular) {
            popularByTopic.computeIfAbsent(lesson.getTopic().getId(), k -> new ArrayList<>())
                    .add(summaries.get(lesson.getId()));
        }

        List<TopicRowResponse> rows = getTopics(userId).stream()
                .filter(t -> popularByTopic.containsKey(t.id()))
                .map(t -> new TopicRowResponse(t, t.totalLessons(), popularByTopic.get(t.id())))
                .toList();
        List<LessonSummaryResponse> continues = continueLessons.stream().map(l -> summaries.get(l.getId())).toList();
        return new LibraryOverviewResponse(continues, rows);
    }

    @Override
    public LessonDetailResponse getLessonDetail(String slug, UUID userId) {
        Lesson lesson = findVisibleLesson(slug);
        LessonDetailResponse detail = lessonMapper.toDetail(lesson);
        long sentenceCount = sentenceCounts(List.of(lesson.getId())).getOrDefault(lesson.getId(), 0L);
        // lessons.topic_id là NOT NULL nên topic luôn có mặt
        List<LessonSummaryResponse> related = toSummaries(lessonRepository.findRelatedLessons(
                lesson.getTopic().getId(), lesson.getId(), PageRequest.of(0, RELATED_LIMIT)), userId);
        boolean locked = lesson.isPro() && !subscriptionQueryService.isPro(userId);

        return new LessonDetailResponse(
                detail.id(), detail.slug(), detail.title(), detail.titleVi(), detail.description(),
                detail.difficulty(), detail.sourceType(), detail.sourceUrl(), detail.durationSec(),
                detail.viewCount(), detail.thumbnailUrl(), detail.pro(), locked, sentenceCount,
                progressOf(userId, Map.of(lesson.getId(), sentenceCount)).getOrDefault(lesson.getId(), NO_PROGRESS),
                topicMapper.toResponse(lesson.getTopic()),
                related);
    }

    @Override
    public List<SentenceResponse> getSentences(String slug, UUID userId) {
        Lesson lesson = findVisibleLesson(slug);
        if (lesson.isPro() && !subscriptionQueryService.isPro(userId)) {
            throw new BusinessException(ErrorCode.LESSON_PRO_REQUIRED);
        }
        return sentenceRepository.findByLessonIdOrderBySortOrderAsc(lesson.getId()).stream()
                .map(sentenceMapper::toResponse)
                .toList();
    }

    /** Bài đã duyệt và chưa xoá mềm; bài DRAFT/PENDING/REJECTED coi như không tồn tại. */
    private Lesson findVisibleLesson(String slug) {
        return lessonRepository.findBySlugAndStatusAndDeletedAtIsNull(slug, LessonStatus.APPROVED)
                .orElseThrow(() -> new NotFoundException("Lesson not found"));
    }

    private TopicResponse withCounts(Topic topic, long total, long completed) {
        TopicResponse base = topicMapper.toResponse(topic);
        return new TopicResponse(base.id(), base.slug(), base.name(), base.nameVi(), base.icon(),
                base.sortOrder(), total, completed);
    }

    /** Chuyển bài sang summary: đếm câu một truy vấn, kiểm tra Pro một lần (chỉ khi có bài Pro). */
    private List<LessonSummaryResponse> toSummaries(List<Lesson> lessons, UUID userId) {
        if (lessons.isEmpty()) {
            return List.of();
        }
        Map<UUID, Long> counts = sentenceCounts(lessons.stream().map(Lesson::getId).toList());
        boolean hasProLesson = lessons.stream().anyMatch(Lesson::isPro);
        boolean userIsPro = hasProLesson && subscriptionQueryService.isPro(userId);
        Map<UUID, ModeProgressResponse> progress = progressOf(userId, counts);
        return lessons.stream().map(lesson -> {
            LessonSummaryResponse s = lessonMapper.toSummary(lesson);
            return new LessonSummaryResponse(s.id(), s.slug(), s.title(), s.titleVi(), s.difficulty(), s.sourceType(),
                    s.durationSec(), s.viewCount(), s.thumbnailUrl(), s.pro(), lesson.isPro() && !userIsPro,
                    counts.getOrDefault(lesson.getId(), 0L), progress.getOrDefault(lesson.getId(), NO_PROGRESS));
        }).toList();
    }

    /**
     * Tiến độ theo bài: phần trăm = số câu đã có lượt / tổng số câu của bài, theo từng chế độ, cùng tổng thời gian học.
     * Hai truy vấn theo lô cho mọi bài trong danh sách; bài chưa có hoạt động không có trong kết quả.
     */
    private Map<UUID, ModeProgressResponse> progressOf(UUID userId, Map<UUID, Long> sentenceCounts) {
        if (userId == null || sentenceCounts.isEmpty()) {
            return Map.of();
        }
        Set<UUID> lessonIds = sentenceCounts.keySet();
        Map<UUID, Map<String, Long>> attempted = new HashMap<>();
        for (LessonProgressRepository.AttemptedCount c : progressRepository.countAttemptedSentences(userId, lessonIds)) {
            attempted.computeIfAbsent(c.getLessonId(), k -> new HashMap<>()).put(c.getMode(), c.getAttempted());
        }
        Map<UUID, Long> seconds = modeProgressRepository.sumStudyTime(userId, lessonIds).stream()
                .collect(Collectors.toMap(LessonModeProgressRepository.StudyTime::getLessonId,
                        LessonModeProgressRepository.StudyTime::getSeconds));

        Map<UUID, ModeProgressResponse> result = new HashMap<>();
        for (UUID lessonId : lessonIds) {
            long total = sentenceCounts.getOrDefault(lessonId, 0L);
            Map<String, Long> byMode = attempted.getOrDefault(lessonId, Map.of());
            result.put(lessonId, new ModeProgressResponse(
                    percent(byMode.getOrDefault("dictation", 0L), total),
                    percent(byMode.getOrDefault("shadowing", 0L), total),
                    (int) Math.min(Integer.MAX_VALUE, seconds.getOrDefault(lessonId, 0L))));
        }
        return result;
    }

    private static int percent(long attempted, long total) {
        return total <= 0 ? 0 : (int) Math.min(100, Math.round(attempted * 100.0 / total));
    }

    private Map<UUID, Long> sentenceCounts(Collection<UUID> lessonIds) {
        return lessonRepository.findSentenceCounts(lessonIds).stream()
                .collect(Collectors.toMap(LessonRepository.SentenceCount::getLessonId,
                        LessonRepository.SentenceCount::getSentenceCount));
    }

    private static Map<UUID, Long> toMap(List<LessonRepository.TopicCount> counts) {
        return counts.stream().collect(Collectors.toMap(
                LessonRepository.TopicCount::getTopicId, LessonRepository.TopicCount::getTotal));
    }
}
