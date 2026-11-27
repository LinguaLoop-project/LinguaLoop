package com.lingualoop.backend.stats.service;

import static com.lingualoop.backend.stats.service.StatsNumbers.pct;
import static com.lingualoop.backend.stats.service.StatsNumbers.score;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.stats.dto.DailySeries;
import com.lingualoop.backend.stats.dto.Metric;
import com.lingualoop.backend.stats.dto.StatsPeriod;
import com.lingualoop.backend.stats.dto.TeacherDeckStatsView;
import com.lingualoop.backend.stats.dto.TeacherLessonStatsView;
import com.lingualoop.backend.stats.dto.TeacherOverviewView;
import com.lingualoop.backend.stats.repository.TeacherContentStatsRepository;
import com.lingualoop.backend.stats.repository.TeacherContentStatsRepository.ContentRef;
import com.lingualoop.backend.stats.repository.TeacherContentStatsRepository.StateCount;

import lombok.RequiredArgsConstructor;

/**
 * Phần tính số liệu của thống kê giáo viên, tách khỏi {@link TeacherContentStatsServiceImpl} để bộ nhớ đệm 1 giờ
 * (BR-TN-06) chỉ bọc phần tính, còn kiểm quyền luôn chạy lại mỗi lần xem.
 */
@Component
@RequiredArgsConstructor
class TeacherContentStatsReader {

    /** Số mục tối đa của mỗi danh sách xếp hạng (BR-TN-04). */
    static final int RANKING_SIZE = 5;
    /** Câu hoặc thẻ có dưới số lượt này là chưa đủ dữ liệu, không vào danh sách khó nhất (BR-TN-04). */
    static final int MIN_ATTEMPTS = 10;

    private static final String NEW = "new";
    private static final String LEARNING = "learning";
    private static final String REVIEWING = "reviewing";
    private static final String MASTERED = "mastered";

    private final TeacherContentStatsRepository repository;
    private final Clock clock;

    @Transactional(readOnly = true)
    @Cacheable(TeacherContentStatsService.CACHE_OVERVIEW)
    public TeacherOverviewView overview(UUID teacherId, StatsPeriod period) {
        StatsWindow w = StatsWindow.of(period, clock);
        TeacherContentStatsRepository.ContentCounts c = repository.contentCounts(teacherId);
        Map<String, Map<LocalDate, Long>> raw = repository.overviewDaily(teacherId, w.from(), w.to());
        return new TeacherOverviewView(clock.instant(), period,
                new TeacherOverviewView.ContentCounts(c.publishedLessons(), c.draftLessons(), c.publishedDecks(),
                        c.draftDecks()),
                Metric.of(repository.practiceAttempts(teacherId, w.from(), w.to()),
                        repository.practiceAttempts(teacherId, w.previousFrom(), w.from())),
                repository.learners(teacherId, w.from(), w.to()), 0,
                series(w, raw, TeacherOverviewView.SERIES_DICTATION, TeacherOverviewView.SERIES_SHADOWING,
                        TeacherOverviewView.SERIES_REVIEW),
                repository.topLessons(teacherId, w.from(), w.to(), RANKING_SIZE).stream()
                        .map(r -> new TeacherOverviewView.TopLesson(r.id(), r.title(), r.learners(), r.attempts(),
                                score(r.dictationAvg()), score(r.shadowingAvg())))
                        .toList(),
                repository.topDecks(teacherId, w.from(), w.to(), RANKING_SIZE).stream()
                        .map(r -> new TeacherOverviewView.TopDeck(r.id(), r.name(), r.learners(), r.reviews(),
                                pct(r.correct(), r.reviews())))
                        .toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(TeacherContentStatsService.CACHE_LESSON)
    public TeacherLessonStatsView lesson(UUID lessonId, ContentRef lesson, StatsPeriod period) {
        StatsWindow w = StatsWindow.of(period, clock);
        TeacherContentStatsRepository.LessonTotals t = repository.lessonTotals(lessonId, w.from(), w.to());
        long completed = repository.lessonCompleted(lessonId, w.from(), w.to());
        Map<String, Map<LocalDate, Long>> raw = repository.lessonDaily(lessonId, w.from(), w.to());

        return new TeacherLessonStatsView(clock.instant(), period, lessonId, lesson.name(), lesson.status(),
                t.started(), completed, pct(completed, t.started()), t.dictation(), t.shadowing(),
                score(t.dictationAvg()), score(t.shadowingAvg()),
                series(w, raw, TeacherLessonStatsView.SERIES_DICTATION, TeacherLessonStatsView.SERIES_SHADOWING),
                hardest(lessonId, TeacherLessonStatsView.SERIES_DICTATION, w),
                hardest(lessonId, TeacherLessonStatsView.SERIES_SHADOWING, w));
    }

    @Transactional(readOnly = true)
    @Cacheable(TeacherContentStatsService.CACHE_DECK)
    public TeacherDeckStatsView deck(UUID deckId, ContentRef deck, StatsPeriod period) {
        StatsWindow w = StatsWindow.of(period, clock);
        TeacherContentStatsRepository.DeckTotals t = repository.deckTotals(deckId, w.from(), w.to());
        Map<String, Map<LocalDate, Long>> raw = repository.deckDaily(deckId, w.from(), w.to());

        Map<String, Long> states = new HashMap<>();
        for (StateCount row : repository.deckStates(deckId, w.from(), w.to())) {
            states.merge(row.status(), row.pairs(), Long::sum);
        }
        long pairs = states.values().stream().mapToLong(Long::longValue).sum();
        TeacherDeckStatsView.CardStates cardStates = new TeacherDeckStatsView.CardStates(
                pct(states.getOrDefault(NEW, 0L), pairs), pct(states.getOrDefault(LEARNING, 0L), pairs),
                pct(states.getOrDefault(REVIEWING, 0L), pairs), pct(states.getOrDefault(MASTERED, 0L), pairs));

        Map<UUID, List<TeacherDeckStatsView.HardCard>> cardsByGroup = new HashMap<>();
        repository.hardCards(deckId, w.from(), w.to(), MIN_ATTEMPTS, RANKING_SIZE).forEach(r -> cardsByGroup
                .computeIfAbsent(r.groupId(), k -> new ArrayList<>())
                .add(new TeacherDeckStatsView.HardCard(r.id(), r.word(), r.reviews(), pct(r.correct(), r.reviews()))));
        List<TeacherDeckStatsView.GroupRow> groups = repository.deckGroups(deckId).stream()
                .map(g -> new TeacherDeckStatsView.GroupRow(g.id(), g.name(),
                        cardsByGroup.getOrDefault(g.id(), List.of())))
                .toList();

        return new TeacherDeckStatsView(clock.instant(), period, deckId, deck.name(), deck.status(), t.learners(),
                t.reviews(), pct(t.correct(), t.reviews()),
                series(w, raw, TeacherDeckStatsView.SERIES_REVIEWS, TeacherDeckStatsView.SERIES_CORRECT),
                cardStates, groups);
    }

    private List<TeacherLessonStatsView.HardSentence> hardest(UUID lessonId, String mode, StatsWindow w) {
        return repository.hardSentences(lessonId, mode, w.from(), w.to(), MIN_ATTEMPTS, RANKING_SIZE).stream()
                .map(r -> new TeacherLessonStatsView.HardSentence(r.id(), r.order(), r.text(), r.attempts(),
                        score(r.avgScore())))
                .toList();
    }

    /** Dựng biểu đồ theo ngày với các chuỗi theo đúng thứ tự {@code names}; chuỗi vắng mặt thành toàn 0. */
    private static DailySeries series(StatsWindow w, Map<String, Map<LocalDate, Long>> raw, String... names) {
        Map<String, Map<LocalDate, Long>> ordered = new LinkedHashMap<>();
        for (String name : names) {
            ordered.put(name, raw.getOrDefault(name, Map.of()));
        }
        return DailySeries.of(w.days(), ordered);
    }
}
