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
