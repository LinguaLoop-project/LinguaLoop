package com.lingualoop.backend.tutor;

import java.time.Clock;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.shadowing.dto.AttemptSnapshot;
import com.lingualoop.backend.shadowing.repository.PhonemeRepository;
import com.lingualoop.backend.shadowing.service.AttemptSnapshots;
import com.lingualoop.backend.subscription.dto.FeatureUsage;
import com.lingualoop.backend.subscription.service.UsageService;
import com.lingualoop.backend.tutor.dto.TutorDtos;
import com.lingualoop.backend.tutor.entity.TutorSession;
import com.lingualoop.backend.tutor.entity.TutorSessionWord;
import com.lingualoop.backend.tutor.repository.TutorOfferRepository;
import com.lingualoop.backend.tutor.repository.TutorSessionRepository;
import com.lingualoop.backend.user.service.ConsentService;
import com.lingualoop.backend.user.service.ConsentService.ConsentType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Điều phối Phiên gia sư. Luật nằm ở TutorOfferPolicy, PracticeWordSelector, AttemptRule và TutorSession; lớp này chỉ
 * ghép chúng với dữ liệu, hạn mức, consent và Gemini. Cố ý không có {@code @Transactional} ở mức lớp để lời gọi
 * Gemini không giữ kết nối DB.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TutorSessionService {

    static final String FEATURE = "tutor_session";

    private final AttemptSnapshots snapshots;
    private final ConsentService consentService;
    private final UsageService usageService;
    private final PracticeWordSelector selector;
    private final TutorPromptBuilder promptBuilder;
    private final LiveTokenIssuer tokenIssuer;
    private final TutorSessionRepository sessions;
    private final TutorOfferRepository offers;
    private final PhonemeRepository phonemes;
    private final TutorViews views;
    private final LockedSessions locked;
    private final TransactionTemplate tx;
    private final Clock clock;

    /**
     * Tạo phiên về câu của lượt {@code attemptId}. Câu đọc tốt vẫn mở được (Danh sách từ lỗi rỗng). Chỉ kiểm tra
     * hạn mức, lượt được trừ khi {@code started} (UC-TUTOR-04).
     *
     * @param offerId null khi học viên tự bấm "Hỏi gia sư"
     * @throws NotFoundException lượt hoặc lời mời không phải của người gọi
     * @throws BusinessException chưa đồng ý AI, hết lượt, hoặc không cấp được token (kèm Danh sách từ lỗi)
     */
    public TutorDtos.SessionResponse createSession(UUID userId, long attemptId, UUID offerId) {
        AttemptSnapshot current = snapshots.load(userId, attemptId);
        if (!consentService.hasConsent(userId, ConsentType.AI_PROCESSING)) {
            throw new BusinessException(ErrorCode.AI_CONSENT_REQUIRED);
        }
        FeatureUsage usage = usageService.usageOf(userId, FEATURE);
        if (usage.remaining() != null && usage.remaining() <= 0) {
            throw new BusinessException(ErrorCode.QUOTA_EXCEEDED,
                    Map.of("feature", FEATURE, "limit", usage.limit() == null ? 0 : usage.limit()));
        }

        SentenceResult result = SentenceResults.of(current);
        List<PracticeWord> words = selector.select(result, SentenceResults.of(
                snapshots.previous(userId, attemptId, TutorThresholds.REPEAT_WINDOW - 1)));

        if (offerId != null) {
            // Học viên đã nhận lời (hoặc đếm ngược xong), kể cả khi sau đó không kết nối được
            tx.executeWithoutResult(status -> offers.findByIdAndUserId(offerId, userId)
                    .orElseThrow(() -> new NotFoundException("Offer not found")).accept(clock.instant()));
        }

        LiveTokenIssuer.LiveToken token;
        try {
            token = tokenIssuer.issue(promptBuilder.build(current.sentenceText(), words));
        } catch (RuntimeException e) {
            log.warn("Không cấp được token Gemini Live: {}", e.toString());
            throw new BusinessException(ErrorCode.TUTOR_LIVE_UNAVAILABLE, Map.of("words", fallbackWords(words)));
        }

        Map<String, Short> phonemeIds = phonemes.idsBySymbol();
        List<TutorSession.WordSeed> seeds = words.stream()
                .map(w -> new TutorSession.WordSeed(w.word(), w.key(),
                        w.phoneme() == null ? null : phonemeIds.get(w.phoneme()), w.score()))
                .toList();
        TutorSession session = tx.execute(status -> sessions.save(
                TutorSession.open(userId, attemptId, offerId, token.model(), clock.instant(), seeds)));

        List<TutorDtos.WordView> wordViews = tx.execute(status -> views.words(sessions.findById(session.getId()).orElseThrow()));
        String currentWord = words.isEmpty() ? null : words.get(0).word();
        return new TutorDtos.SessionResponse(session.getId(), token.token(), token.model(), token.expiresAt(), wordViews,
                currentWord, TutorDtos.Limits.current());
    }

    // --- bắt đầu (trừ lượt) ---

    /**
     * Gia sư đã nói câu đầu: lúc này mới trừ lượt (BR-TUTOR-07). Gọi lại không trừ thêm. Hết lượt giữa lúc tạo và lúc
     * này (vd hai tab) thì phiên kết thúc {@code connect_failed} và báo hết hạn mức.
     */
    public void started(UUID userId, UUID sessionId) {
        boolean exhausted = locked.run(userId, sessionId, session -> {
            session.ensureOpen();
            if (session.getStartedAt() != null) {
                return false;
            }
            FeatureUsage usage = usageService.usageOf(userId, FEATURE);
            if (usage.remaining() != null && usage.remaining() <= 0) {
                session.end(SessionOutcome.CONNECT_FAILED, clock.instant());
                return true;
            }
            usageService.tryConsume(userId, FEATURE);
            // tryConsume dùng truy vấn @Modifying(clearAutomatically) nên bối cảnh JPA bị xoá và {@code session} đã
            // tách khỏi nó: lấy lại bản đang được quản lý rồi mới ghi (dòng vẫn đang bị khoá)
            TutorSession managed = sessions.findById(session.getId()).orElseThrow();
            managed.markStarted(clock.instant());
            managed.markCharged();
            return false;
        });
        if (exhausted) {
            Integer limit = usageService.usageOf(userId, FEATURE).limit();
            throw new BusinessException(ErrorCode.QUOTA_EXCEEDED, Map.of("feature", FEATURE, "limit", limit == null ? 0 : limit));
        }
    }

    // --- từ luyện ---

    /** Đổi Từ đang luyện sang một từ trong câu (gia sư gọi switch_word, hoặc học viên bấm chip). */
    public TutorDtos.SwitchResponse switchWord(UUID userId, UUID sessionId, String input) {
        return locked.run(userId, sessionId, session -> {
            AttemptSnapshot snapshot = snapshots.load(userId, session.getAttemptId());
            String key = Words.normalize(input);
            if (key.isEmpty() || !Words.tokens(snapshot.sentenceText()).contains(key)) {
                throw new BusinessException(ErrorCode.TUTOR_WORD_NOT_IN_SENTENCE, "Từ \"" + input
                        + "\" không có trong câu. Các từ trong câu: "
                        + String.join(", ", Words.tokens(snapshot.sentenceText()).stream().distinct().toList()) + ".");
            }
            Map<String, Short> phonemeIds = phonemes.idsBySymbol();
            TutorSessionWord word = session.switchTo(key, () -> {
                PracticeWord pick = selector.forWord(SentenceResults.of(snapshot),
                        Words.displayFor(snapshot.sentenceText(), key));
                return new TutorSession.WordSeed(pick.word(), key,
                        pick.phoneme() == null ? null : phonemeIds.get(pick.phoneme()), pick.score());
            });
            Map<Short, String> symbols = views.symbolById();
            WordProgress progress = views.progress(word, symbols);
            return new TutorDtos.SwitchResponse(views.word(word, symbols), progress.attemptsLeft(),
                    TutorInstructions.afterSwitch(progress), views.words(session));
        });
    }

    // --- chủ đề và kết thúc ---

    /**
     * Ghi một lượt học viên nói (gia sư báo qua log_turn): đủ {@link TutorThresholds#OFF_TOPIC_END_STREAK} lượt lạc
     * đề liên tiếp thì backend kết thúc phiên (BR-TUTOR-05).
     */
    public TutorDtos.EventResponse recordTopic(UUID userId, UUID sessionId, String topicWire) {
        TopicCategory topic;
        try {
            topic = TopicCategory.fromWire(topicWire);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "topic phải là on_topic hoặc off_topic");
        }
        return locked.run(userId, sessionId, session -> {
            int streak = session.logTopic(topic == TopicCategory.ON_TOPIC);
            if (topic == TopicCategory.ON_TOPIC) {
                return new TutorDtos.EventResponse(0, false, TutorInstructions.onTopic(), null);
            }
            if (streak >= TutorThresholds.OFF_TOPIC_END_STREAK) {
                session.end(SessionOutcome.OFF_TOPIC, clock.instant());
                return new TutorDtos.EventResponse(streak, true, TutorInstructions.offTopic(streak),
                        TutorDtos.wire(SessionOutcome.OFF_TOPIC));
            }
            return new TutorDtos.EventResponse(streak, false, TutorInstructions.offTopic(streak), null);
        });
    }

    /**
     * Kết thúc phiên theo yêu cầu của trình duyệt hoặc tool end_session. Gọi lại khi đã kết thúc thì giữ nguyên kết
     * quả cũ. Backend chỉ tin "hoàn thành" và "lạc đề" do chính nó quyết định; trình duyệt tự quan sát được "học
     * viên thoát", "im lặng" và "hết giờ" nên các giá trị đó được nhận nguyên (UC-TUTOR-08).
     */
    public TutorDtos.EventResponse end(UUID userId, UUID sessionId, String outcomeWire) {
        SessionOutcome requested;
        try {
            requested = SessionOutcome.fromWire(outcomeWire);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "outcome không hợp lệ");
        }
        return locked.run(userId, sessionId, session -> {
            if (session.getOutcome() == null) {
                SessionOutcome outcome = switch (requested) {
                    case COMPLETED, OFF_TOPIC -> SessionOutcome.LEARNER_EXIT;
                    case CONNECT_FAILED -> session.getStartedAt() == null
                            ? SessionOutcome.CONNECT_FAILED : SessionOutcome.LEARNER_EXIT;
                    default -> requested;
                };
                session.end(outcome, clock.instant());
            }
            return new TutorDtos.EventResponse(null, true, null, TutorDtos.wire(session.getOutcome()));
        });
    }

    /** Xem lại phiên: lý do kết thúc, tiến độ và điểm trước/sau từng từ (UC-TUTOR-08). */
    public TutorDtos.SessionSummary get(UUID userId, UUID sessionId) {
        return locked.run(userId, sessionId, session -> new TutorDtos.SessionSummary(session.getId(),
                session.getCreatedAt(), session.getStartedAt(), session.getEndedAt(),
                TutorDtos.wire(session.getOutcome()), session.isCharged(), views.words(session)));
    }

    /** Danh sách từ lỗi dạng đơn giản để giao diện hiện mẹo bằng chữ khi gia sư không dùng được (BR-TUTOR-10). */
    private static List<Map<String, Object>> fallbackWords(List<PracticeWord> words) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (PracticeWord w : words) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("word", w.word());
            item.put("phoneme", w.phoneme());
            item.put("score", w.score());
            item.put("tipVi", w.tipVi());
            result.add(item);
        }
        return result;
    }
}
