package com.lingualoop.backend.practice.service;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.practice.dto.ReviewSentenceView;
import com.lingualoop.backend.practice.enums.DictationLevel;
import com.lingualoop.backend.practice.enums.ReviewReason;
import com.lingualoop.backend.practice.repository.SentenceReviewRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class SentenceReviewServiceImpl implements SentenceReviewService {

    /** Dưới ngưỡng này câu vào danh sách (BR-DICT-14). */
    static final BigDecimal ADD_BELOW = BigDecimal.valueOf(60);
    /** Từ ngưỡng này trở lên câu ra khỏi danh sách, cùng ngưỡng "tốt" của BR-DICT-03. */
    static final BigDecimal RESOLVE_AT = BigDecimal.valueOf(80);

    private final SentenceReviewRepository reviews;

    @Override
    @Transactional
    public boolean recordDictationScore(UUID userId, UUID sentenceId, BigDecimal score) {
        if (score.compareTo(ADD_BELOW) < 0) {
            reviews.addDictation(userId, sentenceId, ReviewReason.low_score.name());
            return true;
        }
        if (score.compareTo(RESOLVE_AT) >= 0) {
            reviews.resolveDictation(userId, sentenceId);
            return false;
        }
        return reviews.isPendingDictation(userId, sentenceId);
    }

    @Override
    @Transactional
    public void pin(UUID userId, UUID sentenceId) {
        if (!reviews.hasDictationAttempt(userId, sentenceId)) {
            throw new BusinessException(ErrorCode.PRACTICE_SENTENCE_NOT_PRACTICED);
        }
        reviews.addDictation(userId, sentenceId, ReviewReason.manual.name());
    }

    @Override
    @Transactional
    public void resolve(UUID userId, UUID sentenceId) {
        reviews.resolveDictation(userId, sentenceId);
    }

    @Override
    @Transactional(readOnly = true)
    public Set<UUID> findPendingSentenceIds(UUID userId, UUID lessonId) {
        return new HashSet<>(reviews.findPendingDictationSentenceIds(userId, lessonId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewSentenceView> list(UUID userId) {
        return reviews.findDictationEntries(userId).stream()
                .map(e -> new ReviewSentenceView(e.getSentenceId(), ReviewReason.valueOf(e.getReason()),
                        e.getAddedAt(), e.getLessonSlug(), e.getLessonTitle(), e.getSortOrder(), e.getText(),
                        e.getTextVi(), e.getLastScore(),
                        e.getLastLevel() == null ? null : DictationLevel.valueOf(e.getLastLevel()),
                        e.getLastAttemptedAt()))
                .toList();
    }
}
