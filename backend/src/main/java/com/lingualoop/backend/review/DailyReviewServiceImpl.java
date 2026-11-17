package com.lingualoop.backend.review;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.ReviewPlanSentence;
import com.lingualoop.backend.practice.service.SentenceReviewService;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;
import com.lingualoop.backend.vocab.dto.ReviewView;
import com.lingualoop.backend.vocab.service.VocabReviewService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class DailyReviewServiceImpl implements DailyReviewService {

    /** Số câu tối đa mỗi chế độ cho phiên Ôn câu riêng. */
    private static final int MAX_PER_MODE = 10;

    private final UserAccountService users;
    private final SubscriptionQueryService subscriptions;
    private final VocabReviewService vocabReview;
    private final SentenceReviewService sentenceReview;
    private final Clock clock;

    @Override
    public DailyPlanView plan(UUID userId) {
        UserAccountView user = users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        DailyQuota quota = DailyQuota.of(user.dailyMinutes());

        ReviewView.DueSummary due = vocabReview.dueSummary(userId);
        List<ReviewPlanSentence> reviewable = reviewableToday(userId, user);

        return new DailyPlanView(user.dailyMinutes(), quota.cards(), due.dueTotal(), Math.min(quota.cards(), due.dueTotal()),
                due.nextDueAt(), quota.sentencesPerMode(), reviewable.size(),
                choose(reviewable, quota.sentencesPerMode()));
    }

    @Override
    public List<ReviewPlanSentence> sentencePlan(UUID userId, int perMode) {
        UserAccountView user = users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        return choose(reviewableToday(userId, user), Math.max(1, Math.min(perMode, MAX_PER_MODE)));
    }

    private List<ReviewPlanSentence> reviewableToday(UUID userId, UserAccountView user) {
        // "Hôm nay" tính theo múi giờ của học viên (BR-HT-21).
        ZoneId zone = ZoneId.of(user.timezone());
        Instant dayStart = clock.instant().atZone(zone).toLocalDate().atStartOfDay(zone).toInstant();
        return sentenceReview.findReviewableToday(userId, subscriptions.isPro(userId), dayStart);
    }

    /** Mỗi chế độ lấy tối đa {@code perMode} câu, Nghe chép trước rồi tới Shadowing; chế độ thiếu câu thì không lấy bù (BR-HT-20). */
    private static List<ReviewPlanSentence> choose(List<ReviewPlanSentence> reviewable, int perMode) {
        List<ReviewPlanSentence> chosen = new ArrayList<>();
        for (PracticeMode mode : List.of(PracticeMode.dictation, PracticeMode.shadowing)) {
            reviewable.stream().filter(s -> s.mode() == mode).limit(perMode).forEach(chosen::add);
        }
        return chosen;
    }
}
