package com.lingualoop.backend.lesson.service;

import java.util.Comparator;
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
    @Transactional(readOnly = true)
    public Page<SavedLessonView> list(UUID userId, String q, LessonState state, boolean oldestFirst,
            Pageable pageable) {
        List<Row> rows = saves.findAll(userId);
        boolean userPro = rows.stream().anyMatch(r -> r.pro() && r.visible()) && subscriptions.isPro(userId);
        List<UUID> ids = rows.stream().map(Row::id).toList();
        Map<UUID, Long> counts = lessonProgress.sentenceCounts(ids);
        Map<UUID, ModeProgressResponse> progress = lessonProgress.of(userId, counts);
        Set<UUID> attempted = state == null ? Set.of() : Set.copyOf(lessons.findAttemptedLessonIds(userId));
        Set<UUID> completed = state == null ? Set.of() : Set.copyOf(lessons.findCompletedLessonIds(userId));
        String needle = q == null ? "" : q.strip().toLowerCase(Locale.ROOT);

        Comparator<SavedLessonView> bySavedAt = Comparator.comparing(SavedLessonView::savedAt);
        List<SavedLessonView> all = rows.stream()
                .filter(r -> needle.isEmpty() || r.title().toLowerCase(Locale.ROOT).contains(needle))
                .filter(r -> matches(state, r.id(), attempted, completed))
                .map(r -> new SavedLessonView(r.id(), r.title(), r.cefrLevel(), r.youtubeId(), r.durationSec(),
                        r.topicName(), r.pro(), availability(r, userPro), counts.getOrDefault(r.id(), 0L),
                        progress.getOrDefault(r.id(), LessonProgress.NONE), r.savedAt()))
                .sorted(oldestFirst ? bySavedAt : bySavedAt.reversed())
                .toList();
        int from = (int) Math.min(pageable.getOffset(), all.size());
        int to = Math.min(from + pageable.getPageSize(), all.size());
        return new PageImpl<>(all.subList(from, to), pageable, all.size());
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
