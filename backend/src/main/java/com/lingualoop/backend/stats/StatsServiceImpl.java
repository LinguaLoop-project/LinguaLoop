package com.lingualoop.backend.stats;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.aichat.LessonChatStatsQueryService;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.lesson.service.LessonStatsQueryService;
import com.lingualoop.backend.practice.dto.PracticeSessionDetailView;
import com.lingualoop.backend.practice.dto.PracticeSessionView;
import com.lingualoop.backend.practice.dto.SentenceCountsView;
import com.lingualoop.backend.practice.dto.WordClassErrorView;
import com.lingualoop.backend.practice.service.PracticeStatsQueryService;
import com.lingualoop.backend.shadowing.dto.PhonemeDetailView;
import com.lingualoop.backend.shadowing.dto.PhonemeStatView;
import com.lingualoop.backend.shadowing.service.ShadowingStatsQueryService;
import com.lingualoop.backend.stats.dto.DictationErrorsView;
import com.lingualoop.backend.stats.dto.HistoryView;
import com.lingualoop.backend.stats.dto.PronunciationView;
import com.lingualoop.backend.stats.dto.StatsOverviewView;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;
import com.lingualoop.backend.vocab.dto.VocabStatsView;
import com.lingualoop.backend.vocab.service.VocabStatsQueryService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class StatsServiceImpl implements StatsService {

    /** Thứ tự cố định của sáu nhóm từ (BR-TH-12). */
    private static final List<String> WORD_CLASSES =
            List.of("function", "content", "inflected", "number", "proper", "other");

    /** Trang lịch sử tối đa; chặn offset lớn vì mỗi nguồn phải lấy {@code (page + 1) * 20} dòng để trộn. */
    private static final int MAX_HISTORY_PAGE = 500;

    private final UserAccountService users;
    private final SubscriptionQueryService subscriptions;
    private final PracticeStatsQueryService practice;
    private final ShadowingStatsQueryService shadowing;
    private final VocabStatsQueryService vocab;
    private final LessonChatStatsQueryService aiChat;
    private final LessonStatsQueryService lessons;
    private final Clock clock;

    /** Múi giờ và "hôm nay" của học viên; mọi ngày lịch trong thống kê tính theo đây (BR-TH-02). */
    private record Window(ZoneId zone, LocalDate today, Instant since, Instant until, Instant previousSince) {
    }

    private Window window(UUID userId, StatsRange range) {
        UserAccountView user = users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        ZoneId zone = ZoneId.of(user.timezone());
        LocalDate today = LocalDate.now(clock.withZone(zone));
        return new Window(zone, today, range.since(today, zone), today.plusDays(1).atStartOfDay(zone).toInstant(),
                range.previousSince(today, zone));
    }

    @Override
    public StatsOverviewView overview(UUID userId, String rawRange) {
        StatsRange range = StatsRange.parse(rawRange);
        Window w = window(userId, range);

        VocabStatsView.AnswerStats answers = vocab.answerStats(userId, w.since());
        Integer accuracy = answers.total() == 0 ? null : (int) Math.round(answers.correct() * 100.0 / answers.total());
        SentenceCountsView sentences = practice.sentenceCounts(userId, w.since());
        return new StatsOverviewView(range.code(), streakOf(userId, w.today()), sentences, lessons.stateCounts(userId),
                new StatsOverviewView.Vocab(vocab.cardCounts(userId), answers.total(), answers.correct(), accuracy),
                compareSentences(userId, w, sentences.total()));
    }

    /** So số câu với khoảng liền trước; null khi không có khoảng liền trước hoặc khoảng liền trước chưa luyện câu nào (BR-TH-13). */
    private StatsOverviewView.Comparison compareSentences(UUID userId, Window w, long current) {
        if (w.previousSince() == null) {
            return null;
        }
        long previous = practice.sentencesBetween(userId, w.previousSince(), w.since());
        return previous == 0 ? null : new StatsOverviewView.Comparison(previous, current - previous);
    }

    @Override
    public StatsOverviewView.Streak streak(UUID userId) {
        return streakOf(userId, window(userId, StatsRange.DAYS_30).today());
    }

    /** Ngày đã học gộp từ luyện câu, thẻ từ vựng và phiên AI đã hoàn thành (BR-TH-02). */
    private StatsOverviewView.Streak streakOf(UUID userId, LocalDate today) {
        Set<LocalDate> days = new HashSet<>(practice.activeDays(userId));
        days.addAll(vocab.activeDays(userId));
        days.addAll(aiChat.activeDays(userId));
        return StreakCalculator.compute(days, today);
    }

    @Override
    public DictationErrorsView dictationErrors(UUID userId, String rawRange) {
        StatsRange range = StatsRange.parse(rawRange);
        Window w = window(userId, range);
        Map<String, UUID> lessonsByClass = practice.latestOpenLessonByWordClass(userId, subscriptions.isPro(userId));
        Map<String, WordClassErrorView> byClass = practice.dictationErrors(userId, w.since()).stream()
                .collect(Collectors.toMap(WordClassErrorView::wordClass, c -> c));
        List<DictationErrorsView.Row> rows = new ArrayList<>();
        for (String wordClass : WORD_CLASSES) {
            WordClassErrorView c = byClass.get(wordClass);
            rows.add(c == null
                    ? new DictationErrorsView.Row(wordClass, 0, 0, 0, 0, 0, 0, 0, null, null)
                    : new DictationErrorsView.Row(wordClass, c.opportunities(), c.errors(),
                            percent(c.errors(), c.opportunities()), c.omitted(), c.substituted(), c.misspelled(),
                            c.revealed(), c.lastWrongWord(), lessonsByClass.get(wordClass)));
        }
        return new DictationErrorsView(range.code(), rows);
    }

    @Override
    public PageResponse<HistoryView> history(UUID userId, String rawMode, String rawRange, int page) {
        HistoryMode mode = HistoryMode.parse(rawMode);
        StatsRange range = StatsRange.parse(rawRange);
        Window w = window(userId, range);
        int safePage = Math.min(Math.max(page, 0), MAX_HISTORY_PAGE);
        // Mỗi nguồn đã sắp mới trước: lấy đủ (page + 1) trang rồi trộn theo thời gian và cắt đúng trang cần.
        int limit = (safePage + 1) * HISTORY_PAGE_SIZE;

        List<HistoryView> merged = new ArrayList<>();
        long total = 0;
        List<PracticeMode> practiceModes = mode.practiceModes();
        if (!practiceModes.isEmpty()) {
            practice.practiceSessions(userId, w.since(), practiceModes, limit).forEach(s -> merged.add(toHistory(s)));
            total += practice.countPracticeSessions(userId, w.since(), practiceModes);
        }
        if (mode.includesVocab()) {
            vocab.sessions(userId, w.since(), limit).forEach(s -> merged.add(toHistory(s)));
            total += vocab.countSessions(userId, w.since());
        }
        if (mode.includesAi()) {
            aiChat.sessions(userId, w.since(), limit).forEach(s -> merged.add(toHistory(s)));
            total += aiChat.countSessions(userId, w.since());
        }

        merged.sort(Comparator.comparing(HistoryView::at).reversed());
        int from = Math.min(safePage * HISTORY_PAGE_SIZE, merged.size());
        List<HistoryView> items = merged.subList(from, Math.min(from + HISTORY_PAGE_SIZE, merged.size()));
        return PageResponse.of(items, safePage, HISTORY_PAGE_SIZE, total);
    }

    @Override
    public PracticeSessionDetailView practiceSession(UUID userId, UUID lessonId, PracticeMode mode, LocalDate day) {
        return practice.practiceSessionDetail(userId, lessonId, mode, day)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
    }

    @Override
    public PronunciationView.Overview pronunciation(UUID userId, String rawRange) {
        StatsRange range = StatsRange.parse(rawRange);
        Window w = window(userId, range);
        boolean weekly = range == StatsRange.ALL;
        List<PronunciationView.Cell> cells = shadowing.phonemeMap(userId, w.since(), w.zone()).stream()
                .map(StatsServiceImpl::toCell).toList();
        Integer average = shadowing.averageScore(userId, w.since(), w.until()).map(StatsServiceImpl::rounded)
                .orElse(null);
        Integer previous = w.previousSince() == null ? null
                : shadowing.averageScore(userId, w.previousSince(), w.since()).map(StatsServiceImpl::rounded)
                        .orElse(null);
        Integer delta = average == null || previous == null ? null : average - previous;
        return new PronunciationView.Overview(range.code(), weekly, shadowing.scoreTrend(userId, w.since(), weekly),
                average, delta, cells);
    }

    private static int rounded(BigDecimal score) {
        return score.setScale(0, RoundingMode.HALF_UP).intValue();
    }

    @Override
    public PronunciationView.Detail phoneme(UUID userId, String symbol, String rawRange) {
        StatsRange range = StatsRange.parse(rawRange);
        Window w = window(userId, range);
        PhonemeDetailView detail = shadowing.phonemeDetail(userId, symbol, w.since(), w.zone())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        PronunciationView.Cell cell = toCell(detail.stat());
        if (PhonemeLevel.INSUFFICIENT.equals(cell.level())) {
            // Chưa đủ 5 lần gặp thì chưa phân tích chi tiết, chỉ nhắc luyện thêm (BR-TH-09).
            return new PronunciationView.Detail(cell, null, false, null, List.of(), null);
        }
        UUID lesson = shadowing.latestOpenLessonWithError(userId, symbol, subscriptions.isPro(userId)).orElse(null);
        return new PronunciationView.Detail(cell, detail.confusedAs(), detail.mostlyOmitted(), detail.tip(),
                filledTrend(detail.weeklyTrend(), w), lesson);
    }

    /** Đủ {@link ShadowingStatsQueryService#TREND_WEEKS} tuần gần nhất; tuần không luyện có 0 lần gặp. */
    private static List<PronunciationView.WeekPoint> filledTrend(List<PhonemeDetailView.WeekPoint> found, Window w) {
        Map<LocalDate, PhonemeDetailView.WeekPoint> byWeek = found.stream()
                .collect(Collectors.toMap(PhonemeDetailView.WeekPoint::weekStart, p -> p));
        LocalDate thisMonday = w.today().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<PronunciationView.WeekPoint> trend = new ArrayList<>();
        for (int i = ShadowingStatsQueryService.TREND_WEEKS - 1; i >= 0; i--) {
            LocalDate monday = thisMonday.minusWeeks(i);
            PhonemeDetailView.WeekPoint p = byWeek.get(monday);
            long total = p == null ? 0 : p.total();
            long errors = p == null ? 0 : p.errors();
            trend.add(new PronunciationView.WeekPoint(monday, total, errors, PhonemeLevel.percent(total, errors)));
        }
        return trend;
    }

    private static PronunciationView.Cell toCell(PhonemeStatView p) {
        boolean enough = p.total() >= PhonemeLevel.MIN_ENCOUNTERS;
        return new PronunciationView.Cell(p.symbol(), p.kind(), p.exampleWord(), p.total(), p.errors(),
                enough ? PhonemeLevel.percent(p.total(), p.errors()) : null, PhonemeLevel.of(p.total(), p.errors()));
    }

    private static HistoryView toHistory(PracticeSessionView s) {
        return new HistoryView("practice", s.mode(), s.lastAt(), s.lessonTitle(), s.available(), s.lessonId(), null,
                null, s.day(), s.sentences(), s.averageBestScore(), s.retries(), s.gaveUps(), null, null);
    }

    private static HistoryView toHistory(VocabStatsView.Session s) {
        return new HistoryView("vocab", s.kind(), s.startedAt(), s.deckName(), s.deckAvailable(), null, s.deckId(),
                s.deckKind(), null, null, null, null, null, s.answered(), s.correct());
    }

    private static HistoryView toHistory(LessonChatStatsQueryService.Session s) {
        return new HistoryView("ai", s.mode(), s.endedAt(), s.lessonTitle(), s.lessonAvailable(), s.lessonId(), null,
                null, null, null, null, null, null, s.answered(), null);
    }

    private static int percent(long part, long whole) {
        return whole <= 0 ? 0 : (int) Math.round(part * 100.0 / whole);
    }
}
