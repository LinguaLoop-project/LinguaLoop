package com.lingualoop.backend.review;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.ToIntFunction;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.lesson.service.LessonQueryService;
import com.lingualoop.backend.practice.dto.ReviewPlanSentence;
import com.lingualoop.backend.practice.service.SentenceReviewService;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;
import com.lingualoop.backend.vocab.dto.ReviewView;
import com.lingualoop.backend.vocab.service.VocabReviewService;
import com.lingualoop.backend.vocab.service.VocabSuggestionService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class DailyReviewServiceImpl implements DailyReviewService {

    /** Số câu tối đa mỗi chế độ cho phiên Ôn câu riêng. */
    private static final int MAX_PER_MODE = 10;

    /** Khoảng thời gian tính cấp độ hiện tại của học viên (BR-HT-32). */
    private static final Duration LEVEL_WINDOW = Duration.ofDays(30);

    private static final List<PracticeMode> SENTENCE_MODES = List.of(PracticeMode.dictation, PracticeMode.shadowing);

    private final UserAccountService users;
    private final SubscriptionQueryService subscriptions;
    private final VocabReviewService vocabReview;
    private final SentenceReviewService sentenceReview;
    private final VocabSuggestionService vocabSuggestions;
    private final LessonQueryService lessons;
    private final Clock clock;

    @Override
    public DailyPlanView plan(UUID userId) {
        UserAccountView user = users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        DailyQuota quota = DailyQuota.of(user.dailyMinutes());
        Instant dayStart = dayStart(user);

        ReviewView.DueSummary due = vocabReview.dueSummary(userId);
        List<ReviewPlanSentence> reviewable = reviewableToday(userId, dayStart);
        int cardsDone = vocabReview.countReviewedSince(userId, dayStart);
        Map<PracticeMode, Integer> sentencesDone = sentenceReview.countReviewedSince(userId, dayStart);

        // Định mức tính cho cả ngày (BR-HT-24): phiên chỉ lấy phần còn lại sau những gì đã ôn hôm nay.
        int cardsInPlan = Math.min(Math.max(0, quota.cards() - cardsDone), due.dueTotal());
        List<ReviewPlanSentence> chosen = choose(reviewable, mode ->
                Math.max(0, quota.sentencesPerMode() - sentencesDone.getOrDefault(mode, 0)));

        // Mục tiêu của ngày: định mức, hoặc ít hơn nếu hôm nay không có đủ việc; tiến độ không vượt mục tiêu.
        int cardsTarget = Math.min(quota.cards(), cardsDone + due.dueTotal());
        int sentencesTarget = 0;
        int sentencesDoneCapped = 0;
        for (PracticeMode mode : SENTENCE_MODES) {
            int done = sentencesDone.getOrDefault(mode, 0);
            long pending = reviewable.stream().filter(s -> s.mode() == mode).count();
            int target = (int) Math.min(quota.sentencesPerMode(), done + pending);
            sentencesTarget += target;
            sentencesDoneCapped += Math.min(done, target);
        }

        // Đã đủ định mức hoặc hết việc thì đề xuất việc khác thay vì để học viên đứng trước một màn trống.
        TodaySuggestions suggestions = cardsInPlan == 0 && chosen.isEmpty() ? suggestionsFor(userId) : null;

        return new DailyPlanView(user.dailyMinutes(), quota.cards(), due.dueTotal(), cardsInPlan,
                Math.min(cardsDone, cardsTarget), cardsTarget, Math.min(quota.cards(), due.dueTotal()), due.nextDueAt(),
                quota.sentencesPerMode(), reviewable.size(), sentencesDoneCapped, sentencesTarget, chosen, suggestions);
    }

    private TodaySuggestions suggestionsFor(UUID userId) {
        boolean pro = subscriptions.isPro(userId);
        return new TodaySuggestions(
                vocabSuggestions.nextNewWords(userId, currentLevel(userId)).orElse(null),
                lessons.suggestDictationLesson(userId, pro).orElse(null),
                lessons.suggestShadowingLesson(userId, pro).orElse(null));
    }

    /** Cấp độ hiện tại của học viên: mức CEFR luyện nhiều nhất trong 30 ngày gần nhất, chưa luyện thì A1 (BR-HT-32). */
    private String currentLevel(UUID userId) {
        return lessons.mostPracticedLevel(userId, clock.instant().minus(LEVEL_WINDOW)).orElse("A1");
    }

    @Override
    public List<ReviewPlanSentence> sentencePlan(UUID userId, int perMode) {
        UserAccountView user = users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        int limit = Math.max(1, Math.min(perMode, MAX_PER_MODE));
        return choose(reviewableToday(userId, dayStart(user)), mode -> limit);
    }

    @Override
    public List<ReviewPlanSentence> sentencePlan(UUID userId, int perMode, UUID sentenceId, PracticeMode mode) {
        if (sentenceId != null && mode != null) {
            return sentenceReview.findSingleReviewSentence(userId, sentenceId, mode, subscriptions.isPro(userId));
        }
        return sentencePlan(userId, perMode);
    }

    /** "Hôm nay" tính theo múi giờ của học viên (BR-HT-21). */
    private Instant dayStart(UserAccountView user) {
        ZoneId zone = ZoneId.of(user.timezone());
        return clock.instant().atZone(zone).toLocalDate().atStartOfDay(zone).toInstant();
    }

    private List<ReviewPlanSentence> reviewableToday(UUID userId, Instant dayStart) {
        return sentenceReview.findReviewableToday(userId, subscriptions.isPro(userId), dayStart);
    }

    /** Mỗi chế độ lấy tối đa {@code limitOf(mode)} câu, Nghe chép trước rồi tới Shadowing; chế độ thiếu câu thì không lấy bù (BR-HT-20). */
    private static List<ReviewPlanSentence> choose(List<ReviewPlanSentence> reviewable, ToIntFunction<PracticeMode> limitOf) {
        List<ReviewPlanSentence> chosen = new ArrayList<>();
        for (PracticeMode mode : SENTENCE_MODES) {
            reviewable.stream().filter(s -> s.mode() == mode).limit(limitOf.applyAsInt(mode)).forEach(chosen::add);
        }
        return chosen;
    }
}
