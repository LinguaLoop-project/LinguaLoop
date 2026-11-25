package com.lingualoop.backend.review;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
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
import com.lingualoop.backend.vocab.dto.LearnView;
import com.lingualoop.backend.vocab.dto.NewWordsSuggestion;
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

        // Định mức tính cho cả ngày (BR-HT-24): phiên chỉ lấy phần còn lại sau những gì đã ôn hôm nay, lấp theo khung bài
        // ngày: thẻ đến hạn, rồi từ mới, rồi thẻ củng cố (BR-HT-29).
        DailyFrame frame = cardFrame(user, quota, dayStart, cardsDone, due.dueTotal());
        int cardsInPlan = frame.total();
        // Câu: Câu cần ôn trước, chế độ nào thiếu thì lấp bằng câu luyện thêm của chính chế độ đó (BR-HT-31).
        List<ReviewPlanSentence> extras = sentenceReview.findExtraToday(userId, subscriptions.isPro(userId), dayStart,
                quota.sentencesPerMode());
        List<ReviewPlanSentence> chosen = choose(reviewable, extras, mode ->
                Math.max(0, quota.sentencesPerMode() - sentencesDone.getOrDefault(mode, 0)));

        // Mục tiêu của ngày: định mức, hoặc ít hơn nếu cả ba nguồn cộng lại không đủ; tiến độ không vượt mục tiêu.
        int cardsTarget = Math.min(quota.cards(), cardsDone + cardsInPlan);
        int sentencesTarget = 0;
        int sentencesDoneCapped = 0;
        for (PracticeMode mode : SENTENCE_MODES) {
            int done = sentencesDone.getOrDefault(mode, 0);
            long pending = reviewable.stream().filter(s -> s.mode() == mode).count()
                    + extras.stream().filter(s -> s.mode() == mode).count();
            int target = (int) Math.min(quota.sentencesPerMode(), done + pending);
            sentencesTarget += target;
            sentencesDoneCapped += Math.min(done, target);
        }

        // Đã đủ định mức hoặc hết việc thì đề xuất việc khác thay vì để học viên đứng trước một màn trống.
        TodaySuggestions suggestions = cardsInPlan == 0 && chosen.isEmpty() ? suggestionsFor(userId) : null;

        return new DailyPlanView(user.dailyMinutes(), quota.cards(), due.dueTotal(), cardsInPlan,
                new DailyPlanView.CardSources(frame.due(), frame.newWords(), frame.reinforce()),
                Math.min(cardsDone, cardsTarget), cardsTarget, Math.min(quota.cards(), due.dueTotal()), due.nextDueAt(),
                quota.sentencesPerMode(), reviewable.size(), sentencesDoneCapped, sentencesTarget, chosen, suggestions);
    }

    @Override
    public DailyCardsView dailyCards(UUID userId, boolean extra) {
        UserAccountView user = users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        DailyQuota quota = DailyQuota.of(user.dailyMinutes());
        List<DailyCardsView.Item> items = new ArrayList<>();
        if (extra) {
            // "Ôn thêm" chỉ gồm thẻ đến hạn, không tính định mức (BR-HT-24).
            addAll(items, vocabReview.queue(userId, null, quota.cards()).cards(), DailyCardsView.Source.DUE);
            return new DailyCardsView(items);
        }
        Instant dayStart = dayStart(user);
        DailyFrame frame = cardFrame(user, quota, dayStart, vocabReview.countReviewedSince(userId, dayStart),
                vocabReview.dueSummary(userId).dueTotal());
        if (frame.due() > 0) {
            addAll(items, vocabReview.queue(userId, null, frame.due()).cards(), DailyCardsView.Source.DUE);
        }
        if (frame.newWords() > 0) {
            addAll(items, vocabReview.newWordCards(userId, frame.newWordsDeck(), frame.newWords()),
                    DailyCardsView.Source.NEW_WORD);
        }
        if (frame.reinforce() > 0) {
            addAll(items, vocabReview.reinforceCards(userId, dayStart, frame.reinforce()),
                    DailyCardsView.Source.REINFORCE);
        }
        return new DailyCardsView(items);
    }

    private static void addAll(List<DailyCardsView.Item> items, List<LearnView.Card> cards,
            DailyCardsView.Source source) {
        cards.forEach(card -> items.add(new DailyCardsView.Item(card, source)));
    }

    /**
     * Lấp phần thẻ còn lại của định mức (BR-HT-29). Chỉ truy vấn nguồn dưới khi nguồn trên chưa lấp đủ: ngày nhiều thẻ đến
     * hạn thì không phải tìm từ mới hay thẻ củng cố.
     */
    private DailyFrame cardFrame(UserAccountView user, DailyQuota quota, Instant dayStart, int cardsDone, int dueTotal) {
        UUID userId = user.id();
        int remaining = Math.max(0, quota.cards() - cardsDone);
        if (remaining <= dueTotal) {
            return DailyFrame.fill(remaining, dueTotal, 0, 0, 0, null);
        }
        int left = remaining - dueTotal;

        int newWordsAllowed = 0;
        int newWordsAvailable = 0;
        UUID newWordsDeck = null;
        int cap = DailyFrame.newWordCap(quota.cards(), scheduledTomorrow(user));
        newWordsAllowed = Math.max(0, cap - vocabReview.countNewWordsStartedSince(userId, dayStart));
        if (newWordsAllowed > 0) {
            newWordsDeck = vocabSuggestions.nextNewWords(userId, currentLevel(userId)).map(NewWordsSuggestion::deckId)
                    .orElse(null);
            if (newWordsDeck != null) {
                newWordsAvailable = vocabReview.countNewWords(userId, newWordsDeck, Math.min(left, newWordsAllowed));
            }
        }
        int reinforceAvailable = vocabReview.countReinforce(userId, dayStart, left);
        return DailyFrame.fill(remaining, dueTotal, newWordsAllowed, newWordsAvailable, reinforceAvailable, newWordsDeck);
    }

    /** Số thẻ hẹn ôn vào ngày mai theo múi giờ của học viên, để giới hạn từ mới của hôm nay (BR-HT-29). */
    private int scheduledTomorrow(UserAccountView user) {
        ZoneId zone = ZoneId.of(user.timezone());
        LocalDate today = clock.instant().atZone(zone).toLocalDate();
        return vocabReview.countScheduledBetween(user.id(), today.plusDays(1).atStartOfDay(zone).toInstant(),
                today.plusDays(2).atStartOfDay(zone).toInstant());
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
        // Phiên Ôn câu riêng chỉ có Câu cần ôn, không lấp bằng câu luyện thêm (BR-HT-31).
        return choose(reviewableToday(userId, dayStart(user)), List.of(), mode -> limit);
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

    /**
     * Mỗi chế độ lấy tối đa {@code limitOf(mode)} câu, Nghe chép trước rồi tới Shadowing; chế độ thiếu câu thì không lấy bù
     * từ chế độ kia (BR-HT-20). Trong một chế độ, Câu cần ôn đứng trước rồi mới tới câu luyện thêm lấp chỗ còn thiếu
     * (BR-HT-31).
     */
    private static List<ReviewPlanSentence> choose(List<ReviewPlanSentence> reviewable, List<ReviewPlanSentence> extras,
            ToIntFunction<PracticeMode> limitOf) {
        List<ReviewPlanSentence> chosen = new ArrayList<>();
        for (PracticeMode mode : SENTENCE_MODES) {
            int limit = limitOf.applyAsInt(mode);
            List<ReviewPlanSentence> fromList = reviewable.stream().filter(s -> s.mode() == mode).limit(limit).toList();
            chosen.addAll(fromList);
            extras.stream().filter(s -> s.mode() == mode).limit(Math.max(0, limit - fromList.size())).forEach(chosen::add);
        }
        return chosen;
    }
}
