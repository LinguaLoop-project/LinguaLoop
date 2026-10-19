package com.lingualoop.backend.dictation.service;

import java.time.Clock;
import java.time.Duration;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.random.RandomGenerator;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.dictation.dto.request.SubmitAttemptRequest;
import com.lingualoop.backend.dictation.dto.response.AttemptResultResponse;
import com.lingualoop.backend.dictation.dto.response.AttemptResultResponse.ClassResultResponse;
import com.lingualoop.backend.dictation.dto.response.DictationLessonResponse;
import com.lingualoop.backend.dictation.dto.response.DictationLessonResponse.LatestResult;
import com.lingualoop.backend.dictation.dto.response.DictationLessonResponse.SentenceItem;
import com.lingualoop.backend.dictation.dto.response.PromptResponse;
import com.lingualoop.backend.dictation.dto.response.PromptResponse.PromptToken;
import com.lingualoop.backend.dictation.mapper.DictationMapper;
import com.lingualoop.backend.dictation.service.grading.DictationGrader;
import com.lingualoop.backend.dictation.service.grading.GradedAttempt;
import com.lingualoop.backend.dictation.service.grading.GradedWord;
import com.lingualoop.backend.dictation.service.grading.WordOutcome;
import com.lingualoop.backend.dictation.service.prompt.BlankPicker;
import com.lingualoop.backend.lesson.dto.LessonView;
import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.lesson.service.LessonProgressService;
import com.lingualoop.backend.lesson.service.SentenceQueryService;
import com.lingualoop.backend.practice.dto.ClassCountsView;
import com.lingualoop.backend.practice.dto.DictationAttemptView;
import com.lingualoop.backend.practice.dto.request.AttemptWordRequest;
import com.lingualoop.backend.practice.dto.request.DictationAttemptRequest;
import com.lingualoop.backend.practice.enums.DictationLevel;
import com.lingualoop.backend.practice.service.DictationStatsQueryService;
import com.lingualoop.backend.practice.service.PracticeAttemptService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class DictationServiceImpl implements DictationService {

    private static final Duration STATS_WINDOW = Duration.ofDays(30);
    private static final int RECENT_EASY_ATTEMPTS = 3;
    private static final int MAX_BLANK_VALUE_LENGTH = 200;

    private final SentenceQueryService sentenceQueryService;
    private final PracticeAttemptService practiceAttemptService;
    private final LessonProgressService lessonProgressService;
    private final DictationStatsQueryService statsQueryService;
    private final SentenceTokenService tokenService;
    private final BlankPicker blankPicker;
    private final DictationGrader grader;
    private final DictationMapper mapper;
    private final Clock clock;
    private final RandomGenerator random;

    @Override
    public DictationLessonResponse getLesson(UUID userId, String slug) {
        LessonView lesson = sentenceQueryService.findLessonBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Lesson not found"));
        sentenceQueryService.assertCanPractice(userId, lesson.id());

        Map<UUID, LatestResult> latest = practiceAttemptService.findLatestDictationAttempts(userId, lesson.id())
                .stream().collect(Collectors.toMap(DictationAttemptView::sentenceId, mapper::toLatest));
        List<SentenceItem> sentences = sentenceQueryService.findSentences(lesson.id()).stream()
                .map(s -> toItem(s, latest.get(s.id())))
                .toList();
        return new DictationLessonResponse(lesson.id(), lesson.slug(), lesson.title(), lesson.titleVi(),
                lesson.difficulty(), lesson.pro(), lesson.sourceType(), lesson.sourceUrl(), lesson.durationSec(),
                sentences);
    }

    @Override
    public PromptResponse getPrompt(UUID userId, UUID sentenceId, DictationLevel level) {
        SentenceView sentence = loadPracticeSentence(userId, sentenceId);
        List<SentenceToken> tokens = tokenService.tokenize(sentence.text());
        List<SentenceToken> words = tokens.stream().filter(t -> !t.normalized().isEmpty()).toList();
        return switch (level) {
            case hard -> new PromptResponse(level, words.size(), List.of());
            case normal -> new PromptResponse(level, words.size(), words.stream()
                    .map(t -> new PromptToken(t.position(), null, t.normalized().length(), true)).toList());
            case easy -> new PromptResponse(level, words.size(), easyTokens(userId, sentence.id(), tokens));
        };
    }

    @Override
    @Transactional
    public AttemptResultResponse submitAttempt(UUID userId, UUID sentenceId, SubmitAttemptRequest request) {
        SentenceView sentence = loadPracticeSentence(userId, sentenceId);
        List<SentenceToken> tokens = tokenService.tokenize(sentence.text());
        boolean easy = request.level() == DictationLevel.easy;

        GradedAttempt graded;
        String submittedText = null;
        if (easy) {
            validateBlanks(request, tokens);
            graded = grader.gradeBlanks(sentence.text(), blankValues(request), request.revealedPositions());
        } else {
            if (!request.gaveUp() && (request.typedText() == null || request.typedText().isBlank())) {
                throw new FieldValidationException("typedText", "NotBlank");
            }
            submittedText = request.gaveUp() ? null : request.typedText();
            graded = grader.gradeFull(sentence.text(), submittedText, request.revealedPositions());
        }

        long attemptId = practiceAttemptService.recordDictationAttempt(new DictationAttemptRequest(userId,
                sentence.id(), request.level(), request.playbackRate(), request.replayCount(), request.durationMs(),
                request.retry(), request.gaveUp(), submittedText, graded.score(),
                attemptWords(graded.words(), tokens.size())));
        int seconds = request.durationMs() == null ? 0 : request.durationMs() / 1000;
        lessonProgressService.recordActivity(userId, sentence.lessonId(), PracticeMode.dictation, seconds);

        return new AttemptResultResponse(attemptId, request.level(), graded.score(), request.gaveUp(),
                graded.words().stream().map(mapper::toResponse).toList(), classResults(graded.words()),
                sentence.text(), sentence.textVi());
    }

    /** Easy: các ô phải là từ khoét được, không trùng, không nhiều hơn số ô tối đa của câu. */
    private void validateBlanks(SubmitAttemptRequest request, List<SentenceToken> tokens) {
        List<Integer> positions = request.blankPositions();
        if (positions.isEmpty()) {
            throw new FieldValidationException("blankPositions", "NotEmpty");
        }
        if (new HashSet<>(positions).size() != positions.size()) {
            throw new FieldValidationException("blankPositions", "Unique");
        }
        Map<Integer, SentenceToken> byPosition = new LinkedHashMap<>();
        tokens.forEach(t -> byPosition.put(t.position(), t));
        if (!positions.stream().allMatch(p -> byPosition.containsKey(p) && blankPicker.isBlankable(byPosition.get(p)))) {
            throw new FieldValidationException("blankPositions", "InvalidPosition");
        }
        if (positions.size() > blankPicker.blankCount(tokens)) {
            throw new FieldValidationException("blankPositions", "Size");
        }
        if (request.blanks().values().stream().anyMatch(v -> v != null && v.length() > MAX_BLANK_VALUE_LENGTH)) {
            throw new FieldValidationException("blanks", "Size");
        }
    }

    /** Giá trị mỗi ô; bỏ cuộc thì coi như chưa điền gì. */
    private Map<Integer, String> blankValues(SubmitAttemptRequest request) {
        Map<Integer, String> values = new LinkedHashMap<>();
        for (Integer position : request.blankPositions()) {
            String value = request.gaveUp() ? null : request.blanks().get(position);
            values.put(position, value == null ? "" : value);
        }
        return values;
    }

    /** Từ thừa không có vị trí trong câu: lưu ở vị trí sau token cuối để không trùng (attempt_id, position). */
    private List<AttemptWordRequest> attemptWords(List<GradedWord> words, int tokenCount) {
        List<AttemptWordRequest> result = new ArrayList<>();
        int inserted = 0;
        for (GradedWord word : words) {
            int stored = word.position() != null ? word.position() : tokenCount + inserted++;
            result.add(mapper.toAttemptWord(word, stored));
        }
        return result;
    }

    private List<ClassResultResponse> classResults(List<GradedWord> words) {
        Map<WordClass, int[]> totals = new EnumMap<>(WordClass.class);
        for (GradedWord word : words) {
            if (word.wordClass() != null) {
                int[] counts = totals.computeIfAbsent(word.wordClass(), c -> new int[2]);
                counts[0]++;
                if (word.outcome() != WordOutcome.correct) {
                    counts[1]++;
                }
            }
        }
        return totals.entrySet().stream()
                .map(e -> new ClassResultResponse(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .toList();
    }

    /** Ô trống chỉ có vị trí và độ dài; chữ của ô không rời khỏi server. */
    private List<PromptToken> easyTokens(UUID userId, UUID sentenceId, List<SentenceToken> tokens) {
        Map<String, ClassCountsView> counts = statsQueryService.countsByWordClass(userId,
                clock.instant().minus(STATS_WINDOW));
        List<List<Integer>> recent = practiceAttemptService.findRecentBlankPositions(userId, sentenceId,
                RECENT_EASY_ATTEMPTS);
        Set<Integer> blanks = new HashSet<>(blankPicker.pick(tokens, counts, recent, random));
        if (blanks.isEmpty()) {
            throw new BusinessException(ErrorCode.DICTATION_EASY_UNAVAILABLE);
        }
        return tokens.stream()
                .map(t -> blanks.contains(t.position())
                        ? new PromptToken(t.position(), null, t.normalized().length(), true)
                        : new PromptToken(t.position(), t.display(), null, false))
                .toList();
    }

    private SentenceView loadPracticeSentence(UUID userId, UUID sentenceId) {
        SentenceView sentence = sentenceQueryService.findSentence(sentenceId)
                .orElseThrow(() -> new NotFoundException("Sentence not found"));
        sentenceQueryService.assertCanPractice(userId, sentence.lessonId());
        return sentence;
    }

    /** Chữ của câu chỉ lộ ra khi câu đã có kết quả. */
    private SentenceItem toItem(SentenceView sentence, LatestResult latest) {
        boolean done = latest != null;
        return new SentenceItem(sentence.id(), sentence.sortOrder(), sentence.startMs(), sentence.endMs(),
                wordCount(sentence.text()), done ? sentence.text() : null, done ? sentence.textVi() : null, latest);
    }

    private int wordCount(String text) {
        return (int) tokenService.tokenize(text).stream().filter(t -> !t.normalized().isEmpty()).count();
    }
}
