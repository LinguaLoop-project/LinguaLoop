package com.lingualoop.backend.lesson.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
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
import com.lingualoop.backend.lesson.dto.response.SentenceResponse.BestScores;
import com.lingualoop.backend.lesson.dto.response.TopicResponse;
import com.lingualoop.backend.lesson.dto.response.TopicRowResponse;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.Sentence;
import com.lingualoop.backend.lesson.entity.Topic;
import com.lingualoop.backend.lesson.enums.LessonState;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.lesson.mapper.LessonMapper;
import com.lingualoop.backend.lesson.mapper.SentenceMapper;
import com.lingualoop.backend.lesson.mapper.TopicMapper;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.LessonSpecification;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.lesson.repository.TopicRepository;
import com.lingualoop.backend.practice.service.PracticeProgressQueryService;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class LessonQueryServiceImpl implements LessonQueryService {

    private static final int CONTINUE_LIMIT = 3;
    /** Số bài gần nhất lấy ra trước khi loại bài đã hoàn thành, để vẫn đủ {@link #CONTINUE_LIMIT} bài đang học. */
    private static final int RECENT_WINDOW = 30;
    private static final int POPULAR_PER_TOPIC = 6;
    private static final int RELATED_LIMIT = 3;

    private static final ModeProgressResponse NO_PROGRESS = new ModeProgressResponse(0, 0);

    private final TopicRepository topicRepository;
    private final LessonRepository lessonRepository;
    private final SentenceRepository sentenceRepository;
    private final TopicMapper topicMapper;
    private final LessonMapper lessonMapper;
    private final SentenceMapper sentenceMapper;
    private final SubscriptionQueryService subscriptionQueryService;
    private final PracticeProgressQueryService practiceProgress;

    @Override
    public List<TopicResponse> getTopics(UUID userId) {
        List<Topic> topics = topicRepository.findAllByOrderByNameAsc();
        Map<UUID, Long> totals = lessonRepository.countVisibleGroupByTopic().stream().collect(
                Collectors.toMap(LessonRepository.TopicCount::getTopicId, LessonRepository.TopicCount::getTotal));
        Map<UUID, Long> completed = completedByTopic(userId);
        return topics.stream()
                .map(t -> withCounts(t, totals.getOrDefault(t.getId(), 0L), completed.getOrDefault(t.getId(), 0L)))
                .toList();
    }

    @Override
    public TopicRowResponse getTopic(UUID topicId, UUID userId) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new NotFoundException("Topic not found"));
        long total = lessonRepository.countVisibleByTopic(topicId);
        long completed = completedByTopic(userId).getOrDefault(topicId, 0L);
        // Danh sách bài của chủ đề lấy phân trang ở GET /lessons?topicId=.
        return new TopicRowResponse(withCounts(topic, total, completed), total, Collections.emptyList());
    }

    @Override
    public Page<LessonSummaryResponse> searchLessons(String q, UUID topicId, String cefrLevel, Boolean free,
                                             LessonState state, UUID userId, Pageable pageable) {
        Set<UUID> attempted = Set.of();
        Set<UUID> completed = Set.of();
        if (state != null) {
            attempted = new HashSet<>(lessonRepository.findAttemptedLessonIds(userId));
            completed = new HashSet<>(lessonRepository.findCompletedLessonIds(userId));
        }
        Specification<Lesson> spec = LessonSpecification.filterLessons(
                q, topicId, cefrLevel, free, state, attempted, completed);
        Page<Lesson> page = lessonRepository.findAll(spec, pageable);
        return new PageImpl<>(toSummaries(page.getContent(), userId), pageable, page.getTotalElements());
    }

    @Override
    public LibraryOverviewResponse getOverview(UUID userId) {
        List<Lesson> continueLessons = continueLessons(userId);
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
    public LessonDetailResponse getLessonDetail(UUID lessonId, UUID userId) {
        Lesson lesson = findVisibleLesson(lessonId);
        LessonDetailResponse detail = lessonMapper.toDetail(lesson);
        long sentenceCount = sentenceCounts(List.of(lesson.getId())).getOrDefault(lesson.getId(), 0L);
        // Bài thư viện luôn có chủ đề (CHECK chk_lesson_topic)
        List<LessonSummaryResponse> related = toSummaries(lessonRepository.findRelatedLessons(
                lesson.getTopic().getId(), lesson.getId(), PageRequest.of(0, RELATED_LIMIT)), userId);
        boolean locked = lesson.isPro() && !subscriptionQueryService.isPro(userId);

        return new LessonDetailResponse(
                detail.id(), detail.title(), detail.cefrLevel(), detail.youtubeId(), detail.durationSec(),
                detail.viewCount(), detail.thumbnailUrl(), detail.pro(), locked, sentenceCount,
                progressOf(userId, Map.of(lesson.getId(), sentenceCount)).getOrDefault(lesson.getId(), NO_PROGRESS),
                topicMapper.toResponse(lesson.getTopic()),
                related);
    }

    @Override
    public List<SentenceResponse> getSentences(UUID lessonId, UUID userId) {
        Lesson lesson = findVisibleLesson(lessonId);
        if (lesson.isPro() && !subscriptionQueryService.isPro(userId)) {
            throw new BusinessException(ErrorCode.LESSON_PRO_REQUIRED);
        }
        List<Sentence> items = sentenceRepository.findByLessonIdAndDeletedAtIsNullOrderByStartMsAsc(lesson.getId());
        Map<UUID, Map<PracticeMode, BigDecimal>> best = practiceProgress.bestScores(userId, items.stream().map(Sentence::getId).toList());
        return items.stream().map(sentence -> withBestScore(sentenceMapper.toResponse(sentence),
                best.getOrDefault(sentence.getId(), Map.of()))).toList();
    }

    /** Bài thư viện đã xuất bản và chưa xoá mềm; bài nháp hay đã xoá coi như không tồn tại. */
    private Lesson findVisibleLesson(UUID lessonId) {
        return lessonRepository.findVisibleById(lessonId)
                .orElseThrow(() -> new NotFoundException("Lesson not found"));
    }

    /** Tối đa {@link #CONTINUE_LIMIT} bài đang học (đã làm nhưng chưa hoàn thành), bài làm gần nhất trước. */
    private List<Lesson> continueLessons(UUID userId) {
        if (userId == null) {
            return List.of();
        }
        Set<UUID> completed = new HashSet<>(lessonRepository.findCompletedLessonIds(userId));
        List<UUID> ids = lessonRepository.findRecentLessonIds(userId, PageRequest.of(0, RECENT_WINDOW)).stream()
                .filter(id -> !completed.contains(id))
                .limit(CONTINUE_LIMIT)
                .toList();
        Map<UUID, Lesson> byId = lessonRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Lesson::getId, Function.identity()));
        return ids.stream().map(byId::get).toList();
    }

    /** Số bài đã hoàn thành của người dùng theo từng chủ đề. */
    private Map<UUID, Long> completedByTopic(UUID userId) {
        if (userId == null) {
            return Map.of();
        }
        List<UUID> completedIds = lessonRepository.findCompletedLessonIds(userId);
        if (completedIds.isEmpty()) {
            return Map.of();
        }
        return lessonRepository.findAllById(completedIds).stream()
                .filter(l -> Lesson.KIND_LIBRARY.equals(l.getKind()) && l.getDeletedAt() == null
                        && l.getStatus() == com.lingualoop.backend.lesson.enums.LessonStatus.PUBLISHED
                        && l.getTopic() != null)
                .collect(Collectors.groupingBy(l -> l.getTopic().getId(), Collectors.counting()));
    }

    private TopicResponse withCounts(Topic topic, long total, long completed) {
        TopicResponse base = topicMapper.toResponse(topic);
        return new TopicResponse(base.id(), base.name(), total, completed);
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
            return new LessonSummaryResponse(s.id(), s.title(), s.cefrLevel(), s.youtubeId(), s.durationSec(),
                    s.viewCount(), s.thumbnailUrl(), s.pro(), lesson.isPro() && !userIsPro,
                    counts.getOrDefault(lesson.getId(), 0L), progress.getOrDefault(lesson.getId(), NO_PROGRESS));
        }).toList();
    }

    /**
     * Tiến độ theo bài: phần trăm = số câu đã có lượt / tổng số câu của bài, theo từng chế độ. Một truy vấn theo lô
     * cho mọi bài trong danh sách; bài chưa có hoạt động nhận 0%.
     */
    private Map<UUID, ModeProgressResponse> progressOf(UUID userId, Map<UUID, Long> sentenceCounts) {
        if (userId == null || sentenceCounts.isEmpty()) {
            return Map.of();
        }
        Set<UUID> lessonIds = sentenceCounts.keySet();
        Map<UUID, Map<String, Long>> attempted = new HashMap<>();
        for (LessonRepository.AttemptedCount c : lessonRepository.countAttemptedSentences(userId, lessonIds)) {
            attempted.computeIfAbsent(c.getLessonId(), k -> new HashMap<>()).put(c.getMode(), c.getAttempted());
        }

        Map<UUID, ModeProgressResponse> result = new HashMap<>();
        for (UUID lessonId : lessonIds) {
            long total = sentenceCounts.getOrDefault(lessonId, 0L);
            Map<String, Long> byMode = attempted.getOrDefault(lessonId, Map.of());
            result.put(lessonId, new ModeProgressResponse(
                    percent(byMode.getOrDefault("dictation", 0L), total),
                    percent(byMode.getOrDefault("shadowing", 0L), total)));
        }
        return result;
    }

    private static int percent(long attempted, long total) {
        return total <= 0 ? 0 : (int) Math.min(100, Math.round(attempted * 100.0 / total));
    }

    private static SentenceResponse withBestScore(SentenceResponse s, Map<PracticeMode, BigDecimal> best) {
        BestScores scores = new BestScores(rounded(best.get(PracticeMode.dictation)),
                rounded(best.get(PracticeMode.shadowing)));
        return new SentenceResponse(s.id(), s.textEn(), s.textVi(), s.ipaUs(), s.ipaUk(), s.startMs(), s.endMs(), scores);
    }

    private static Integer rounded(BigDecimal score) {
        return score == null ? null : score.setScale(0, RoundingMode.HALF_UP).intValue();
    }

    private Map<UUID, Long> sentenceCounts(Collection<UUID> lessonIds) {
        return lessonRepository.findSentenceCounts(lessonIds).stream()
                .collect(Collectors.toMap(LessonRepository.SentenceCount::getLessonId,
                        LessonRepository.SentenceCount::getSentenceCount));
    }
}
