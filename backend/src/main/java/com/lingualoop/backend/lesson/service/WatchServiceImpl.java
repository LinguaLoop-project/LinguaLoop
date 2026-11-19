package com.lingualoop.backend.lesson.service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.dto.WatchView;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.lesson.repository.WatchRepository;
import com.lingualoop.backend.lesson.repository.WatchRepository.LessonRow;
import com.lingualoop.backend.lesson.repository.WatchRepository.LineRow;
import com.lingualoop.backend.practice.service.SentenceReviewService;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class WatchServiceImpl implements WatchService {

    private static final int MAX_SEED_LENGTH = 64;

    private final WatchRepository repository;
    private final SubscriptionQueryService subscriptions;
    private final SentenceReviewService reviews;

    @Override
    @Transactional(readOnly = true)
    public WatchView.Feed feed(UUID userId, String seed, int page, UUID start) {
        if (page < 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "page phải từ 0 trở lên");
        }
        boolean pro = subscriptions.isPro(userId);
        String safeSeed = seed == null || seed.isBlank() ? "" : seed.substring(0, Math.min(seed.length(),
                MAX_SEED_LENGTH));
        List<LessonRow> rows = repository.findFeed(userId, pro, MAX_DURATION_SEC, start, safeSeed, page, PAGE_SIZE);
        boolean hasMore = rows.size() > PAGE_SIZE;
        List<LessonRow> pageRows = hasMore ? rows.subList(0, PAGE_SIZE) : rows;

        List<UUID> lessonIds = pageRows.stream().map(LessonRow::id).toList();
        Map<UUID, List<LineRow>> lines = repository.findLines(lessonIds).stream()
                .collect(Collectors.groupingBy(LineRow::lessonId));
        Set<UUID> saved = reviews.findPendingSentenceIds(userId, lessonIds, PracticeMode.shadowing);

        List<WatchView.Item> items = pageRows.stream()
                .map(row -> new WatchView.Item(row.id(), row.title(), row.youtubeId(), row.durationSec(),
                        row.cefrLevel(), row.topicName(), row.pro(), row.likeCount(), row.liked(),
                        lines.getOrDefault(row.id(), List.of()).stream()
                                .map(line -> new WatchView.Line(line.id(), line.textEn(), line.textVi(),
                                        line.ipaUs(), line.startMs(), line.endMs(), saved.contains(line.id())))
                                .toList()))
                .toList();
        boolean proHidden = !pro && repository.existsProInFeed(MAX_DURATION_SEC);
        return new WatchView.Feed(items, page, hasMore, proHidden);
    }

    @Override
    @Transactional
    public WatchView.Like like(UUID userId, UUID lessonId) {
        requireLesson(userId, lessonId);
        repository.like(userId, lessonId);
        return new WatchView.Like(true, repository.countLikes(lessonId));
    }

    @Override
    @Transactional
    public WatchView.Like unlike(UUID userId, UUID lessonId) {
        requireLesson(userId, lessonId);
        repository.unlike(userId, lessonId);
        return new WatchView.Like(false, repository.countLikes(lessonId));
    }

    @Override
    @Transactional
    public WatchView.Saved saveSentence(UUID userId, UUID sentenceId) {
        requireSentence(userId, sentenceId);
        reviews.pinWithoutAttempt(userId, sentenceId, PracticeMode.shadowing);
        return new WatchView.Saved(true);
    }

    @Override
    @Transactional
    public WatchView.Saved unsaveSentence(UUID userId, UUID sentenceId) {
        requireSentence(userId, sentenceId);
        reviews.resolve(userId, sentenceId, PracticeMode.shadowing);
        return new WatchView.Saved(false);
    }

    private void requireLesson(UUID userId, UUID lessonId) {
        boolean pro = repository.findVisibleLessonPro(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        requireAccess(userId, pro);
    }

    private void requireSentence(UUID userId, UUID sentenceId) {
        boolean pro = repository.findVisibleSentencePro(sentenceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        requireAccess(userId, pro);
    }

    private void requireAccess(UUID userId, boolean lessonPro) {
        if (lessonPro && !subscriptions.isPro(userId)) {
            throw new BusinessException(ErrorCode.LESSON_PRO_REQUIRED);
        }
    }
}
