package com.lingualoop.backend.lesson.service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.dto.SavedLessonView;
import com.lingualoop.backend.lesson.dto.SavedLessonView.Availability;
import com.lingualoop.backend.lesson.dto.response.ModeProgressResponse;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.enums.LessonState;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.LessonSaveRepository;
import com.lingualoop.backend.lesson.repository.LessonSaveRepository.Row;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class LessonSaveServiceImpl implements LessonSaveService {

    private final LessonSaveRepository saves;
    private final LessonRepository lessons;
    private final LessonProgress lessonProgress;
    private final SubscriptionQueryService subscriptions;

    @Override
    @Transactional
    public SavedLessonView.Saved save(UUID userId, UUID lessonId) {
        Lesson lesson = lessons.findVisibleById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        if (lesson.isPro() && !subscriptions.isPro(userId)) {
            throw new BusinessException(ErrorCode.LESSON_PRO_REQUIRED);
        }
        saves.save(userId, lessonId);
        return new SavedLessonView.Saved(true);
    }

    @Override
    @Transactional
    public SavedLessonView.Saved unsave(UUID userId, UUID lessonId) {
        saves.unsave(userId, lessonId);
        return new SavedLessonView.Saved(false);
    }

    @Override
    @Transactional
    public SavedLessonView.Cleared clearCompleted(UUID userId) {
        List<Row> rows = saves.findAll(userId);
        if (rows.isEmpty()) {
            return new SavedLessonView.Cleared(0, List.of());
        }
        Set<UUID> completed = Set.copyOf(lessons.findCompletedLessonIds(userId));
        List<UUID> toRemove = rows.stream().map(Row::id).filter(completed::contains).toList();
        int removed = saves.unsaveAll(userId, toRemove);
        return new SavedLessonView.Cleared(removed, toRemove);
    }

    @Override
    @Transactional(readOnly = true)
    public SavedLessonView.Summary summary(UUID userId) {
        List<Row> rows = saves.findAll(userId);
        if (rows.isEmpty()) {
            return new SavedLessonView.Summary(0, 0, 0, 0, 0, List.of());
        }
        Set<UUID> attempted = Set.copyOf(lessons.findAttemptedLessonIds(userId));
        Set<UUID> completed = Set.copyOf(lessons.findCompletedLessonIds(userId));
        long todo = 0;
        long doing = 0;
        long done = 0;
        long totalDurationSec = 0;
        Map<String, Long> topicCounts = new LinkedHashMap<>();
        for (Row r : rows) {
            if (completed.contains(r.id())) {
                done++;
            } else if (attempted.contains(r.id())) {
                doing++;
            } else {
                todo++;
            }
            if (r.durationSec() != null && r.durationSec() > 0) {
                totalDurationSec += r.durationSec();
            }
            if (r.topicName() != null && !r.topicName().isBlank()) {
                topicCounts.merge(r.topicName(), 1L, Long::sum);
            }
        }
        List<SavedLessonView.TopicCount> topics = topicCounts.entrySet().stream()
                .map(e -> new SavedLessonView.TopicCount(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(SavedLessonView.TopicCount::count).reversed()
                        .thenComparing(SavedLessonView.TopicCount::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new SavedLessonView.Summary(rows.size(), todo, doing, done, totalDurationSec, topics);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SavedLessonView> list(UUID userId, Filter filter, Pageable pageable) {
        List<Row> rows = saves.findAll(userId);
        boolean userPro = rows.stream().anyMatch(r -> r.pro() && r.visible()) && subscriptions.isPro(userId);
        List<UUID> ids = rows.stream().map(Row::id).toList();
        Map<UUID, Long> counts = lessonProgress.sentenceCounts(ids);
        Map<UUID, ModeProgressResponse> progress = lessonProgress.of(userId, counts);
        LessonState state = filter.state();
        Set<UUID> attempted = state == null ? Set.of() : Set.copyOf(lessons.findAttemptedLessonIds(userId));
        Set<UUID> completed = state == null ? Set.of() : Set.copyOf(lessons.findCompletedLessonIds(userId));
        String needle = filter.q() == null ? "" : filter.q().strip().toLowerCase(Locale.ROOT);
        Set<String> cefrLevels = filter.cefrLevels() == null ? Set.of() : filter.cefrLevels();
        String topic = filter.topic() == null ? "" : filter.topic().strip();
        boolean freeOnly = Boolean.TRUE.equals(filter.freeOnly());
        Integer maxDurationSec = filter.maxDurationSec();

        List<SavedLessonView> all = rows.stream()
                .filter(r -> needle.isEmpty() || r.title().toLowerCase(Locale.ROOT).contains(needle))
                .filter(r -> matches(state, r.id(), attempted, completed))
                .filter(r -> cefrLevels.isEmpty()
                        || (r.cefrLevel() != null && cefrLevels.contains(r.cefrLevel().toUpperCase(Locale.ROOT))))
                .filter(r -> topic.isEmpty()
                        || (r.topicName() != null && r.topicName().equalsIgnoreCase(topic)))
                .filter(r -> !freeOnly || !r.pro())
                .filter(r -> maxDurationSec == null
                        || (r.durationSec() != null && r.durationSec() > 0 && r.durationSec() <= maxDurationSec))
                .map(r -> new SavedLessonView(r.id(), r.title(), r.cefrLevel(), r.youtubeId(), r.durationSec(),
                        r.topicName(), r.pro(), availability(r, userPro), counts.getOrDefault(r.id(), 0L),
                        progress.getOrDefault(r.id(), LessonProgress.NONE), r.savedAt()))
                .sorted(comparatorFor(filter.sort()))
                .toList();
        int from = (int) Math.min(pageable.getOffset(), all.size());
        int to = Math.min(from + pageable.getPageSize(), all.size());
        return new PageImpl<>(all.subList(from, to), pageable, all.size());
    }

    private static Comparator<SavedLessonView> comparatorFor(String sort) {
        Comparator<SavedLessonView> bySavedAt = Comparator.comparing(SavedLessonView::savedAt);
        if ("saved_asc".equals(sort)) {
            return bySavedAt;
        }
        if ("short".equals(sort)) {
            return Comparator.comparing(SavedLessonView::durationSec,
                    Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(bySavedAt.reversed());
        }
        if ("progress_desc".equals(sort)) {
            return Comparator.comparingDouble((SavedLessonView v) -> (v.progress().dictationPercent()
                    + v.progress().shadowingPercent()) / 2.0)
                    .reversed()
                    .thenComparing(bySavedAt.reversed());
        }
        return bySavedAt.reversed();
    }

    private static boolean matches(LessonState state, UUID id, Set<UUID> attempted, Set<UUID> completed) {
        if (state == null) {
            return true;
        }
        return switch (state) {
            case TODO -> !attempted.contains(id);
            case DOING -> attempted.contains(id) && !completed.contains(id);
            case DONE -> completed.contains(id);
        };
    }

    private static Availability availability(Row row, boolean userPro) {
        if (!row.visible()) {
            return Availability.unavailable;
        }
        return row.pro() && !userPro ? Availability.pro_required : Availability.available;
    }
}
