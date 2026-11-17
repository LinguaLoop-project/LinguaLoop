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

        // "Hôm nay" tính theo múi giờ của học viên (BR-HT-21).
        ZoneId zone = ZoneId.of(user.timezone());
        Instant dayStart = clock.instant().atZone(zone).toLocalDate().atStartOfDay(zone).toInstant();
        List<ReviewPlanSentence> reviewable = sentenceReview.findReviewableToday(userId, subscriptions.isPro(userId),
                dayStart);

        // Chế độ nào thiếu câu thì lấy số câu hiện có, không lấy bù từ chế độ kia (BR-HT-20).
        List<ReviewPlanSentence> chosen = new ArrayList<>();
        for (PracticeMode mode : List.of(PracticeMode.dictation, PracticeMode.shadowing)) {
            reviewable.stream().filter(s -> s.mode() == mode).limit(quota.sentencesPerMode()).forEach(chosen::add);
        }

        return new DailyPlanView(user.dailyMinutes(), quota.cards(), due.dueTotal(), Math.min(quota.cards(), due.dueTotal()),
                due.nextDueAt(), quota.sentencesPerMode(), reviewable.size(), chosen);
    }
}
