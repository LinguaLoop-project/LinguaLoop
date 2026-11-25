package com.lingualoop.backend.practice.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.ReviewPlanSentence;
import com.lingualoop.backend.practice.dto.ReviewSentenceView;
import com.lingualoop.backend.practice.enums.DictationLevel;
import com.lingualoop.backend.practice.enums.ReviewReason;
import com.lingualoop.backend.practice.repository.SentenceReviewRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class SentenceReviewServiceImpl implements SentenceReviewService {

    /** Lượt luyện phải mới hơn mốc này mới được đánh dấu "đã ôn hôm nay". */
    private static final Duration RECENT_ATTEMPT = Duration.ofHours(1);

    private final SentenceReviewRepository reviews;
    private final Clock clock;

    @Override
    @Transactional
    public void pin(UUID userId, UUID sentenceId, PracticeMode mode, ReviewReason reason) {
        if (!reviews.hasAttempt(userId, sentenceId, mode.name())) {
            throw new BusinessException(ErrorCode.PRACTICE_SENTENCE_NOT_PRACTICED);
        }
        reviews.add(userId, sentenceId, mode.name(), reason.name());
    }

    @Override
    @Transactional
    public void pinWithoutAttempt(UUID userId, UUID sentenceId, PracticeMode mode) {
        reviews.add(userId, sentenceId, mode.name(), ReviewReason.manual.name());
    }

    @Override
    @Transactional
    public void resolve(UUID userId, UUID sentenceId, PracticeMode mode) {
        reviews.resolve(userId, sentenceId, mode.name());
    }

    @Override
    @Transactional(readOnly = true)
    public Set<UUID> findPendingSentenceIds(UUID userId, UUID lessonId, PracticeMode mode) {
        return new HashSet<>(reviews.findPendingSentenceIds(userId, lessonId, mode.name()));
    }

    @Override
    @Transactional(readOnly = true)
    public Set<UUID> findPendingSentenceIds(UUID userId, Collection<UUID> lessonIds, PracticeMode mode) {
        if (lessonIds.isEmpty()) {
            return Set.of();
        }
        return new HashSet<>(reviews.findPendingSentenceIdsIn(userId, lessonIds, mode.name()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewPlanSentence> findReviewableToday(UUID userId, boolean userPro, Instant dayStart) {
        return reviews.findReviewableToday(userId, userPro, dayStart).stream()
                .map(e -> planSentence(e, false))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewPlanSentence> findExtraToday(UUID userId, boolean userPro, Instant dayStart, int perMode) {
        if (perMode <= 0) {
            return List.of();
        }
        return reviews.findExtraToday(userId, userPro, dayStart, perMode).stream().map(e -> planSentence(e, true)).toList();
    }

    private static ReviewPlanSentence planSentence(SentenceReviewRepository.PlanEntry e, boolean extra) {
        return new ReviewPlanSentence(e.getSentenceId(), PracticeMode.valueOf(e.getMode()), e.getLessonId(),
                e.getLessonTitle(), e.getYoutubeId(), e.getStartMs(), e.getEndMs(), e.getText(), e.getTextVi(),
                e.getLastScore(), extra);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewPlanSentence> findSingleReviewSentence(UUID userId, UUID sentenceId, PracticeMode mode,
            boolean userPro) {
        return reviews.findSinglePlanEntry(userId, sentenceId, mode.name(), userPro).stream()
                .map(e -> planSentence(e, false))
                .toList();
    }

    @Override
    @Transactional
    public void skip(UUID userId, UUID sentenceId, PracticeMode mode) {
        Instant now = Instant.now(clock);
        if (reviews.skip(userId, sentenceId, mode.name(), now) > 0) {
            return;
        }
        // Câu ngoài danh sách chỉ bỏ qua được khi là câu luyện thêm: học viên đã luyện nó ở chế độ này (BR-HT-31).
        if (!reviews.hasAttempt(userId, sentenceId, mode.name())) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        reviews.skipExtra(userId, sentenceId, mode.name(), now);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<PracticeMode, Integer> countReviewedSince(UUID userId, Instant since) {
        Map<PracticeMode, Integer> counts = new EnumMap<>(PracticeMode.class);
        for (SentenceReviewRepository.ModeCount row : reviews.countReviewedSince(userId, since)) {
            counts.put(PracticeMode.valueOf(row.getMode()), (int) row.getTotal());
        }
        return counts;
    }

    @Override
    @Transactional
    public void markReviewed(UUID userId, UUID sentenceId, PracticeMode mode) {
        Instant now = Instant.now(clock);
        Instant recent = now.minus(RECENT_ATTEMPT);
        boolean inList = reviews.isInList(userId, sentenceId, mode.name());
        // Câu ngoài danh sách chỉ đánh dấu được khi là câu luyện thêm: học viên đã luyện nó ở chế độ này (BR-HT-31).
        if (!inList && !reviews.hasAttempt(userId, sentenceId, mode.name())) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        int marked = inList ? reviews.markReviewed(userId, sentenceId, mode.name(), now, recent)
                : reviews.markExtraReviewed(userId, sentenceId, mode.name(), now, recent);
        if (marked == 0) {
            throw new BusinessException(ErrorCode.PRACTICE_SENTENCE_NOT_PRACTICED);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewSentenceView> list(UUID userId, PracticeMode mode, UUID lessonId) {
        return reviews.findEntries(userId, mode == null ? null : mode.name(), lessonId).stream()
                .map(e -> new ReviewSentenceView(e.getSentenceId(), PracticeMode.valueOf(e.getMode()),
                        ReviewReason.valueOf(e.getReason()),
                        e.getAddedAt(), e.getLessonId(), e.getLessonTitle(), e.getSortOrder(), e.getText(),
                        e.getTextVi(), e.getLastScore(),
                        e.getLastLevel() == null ? null : DictationLevel.valueOf(e.getLastLevel()),
                        e.getLastAttemptedAt()))
                .toList();
    }
}
