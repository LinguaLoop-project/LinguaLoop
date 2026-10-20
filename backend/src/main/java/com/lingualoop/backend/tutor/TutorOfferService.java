package com.lingualoop.backend.tutor;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.shadowing.dto.AttemptSnapshot;
import com.lingualoop.backend.shadowing.service.AttemptSnapshots;
import com.lingualoop.backend.tutor.dto.TutorDtos;
import com.lingualoop.backend.tutor.entity.TutorLessonEvent;
import com.lingualoop.backend.tutor.entity.TutorOffer;
import com.lingualoop.backend.tutor.repository.TutorLessonEventRepository;
import com.lingualoop.backend.tutor.repository.TutorOfferRepository;

import lombok.RequiredArgsConstructor;

/** Lời mời gia sư: xét sau một lượt, từ chối, và ghi sự kiện bật/tắt Chế độ gia sư (UC-TUTOR-01, 02, 09). */
@Service
@RequiredArgsConstructor
public class TutorOfferService {

    private final AttemptSnapshots snapshots;
    private final TutorOfferPolicy policy;
    private final PracticeWordSelector selector;
    private final TutorOfferRepository offers;
    private final TutorLessonEventRepository lessonEvents;
    private final TransactionTemplate tx;
    private final Clock clock;

    /**
     * Quyết định có tự mở gia sư sau lượt {@code attemptId} không. Chỉ lưu lời mời khi mời thật.
     *
     * @throws NotFoundException lượt không phải của người gọi hoặc không phải lượt shadowing
     */
    public TutorDtos.OfferResponse evaluate(UUID userId, long attemptId) {
        AttemptSnapshot current = snapshots.load(userId, attemptId);
        List<SentenceResult> previous = SentenceResults.of(
                snapshots.previous(userId, attemptId, TutorThresholds.REPEAT_WINDOW - 1));
        SentenceResult result = SentenceResults.of(current);

        TutorOfferPolicy.Decision decision = policy.decide(
                new TutorOfferPolicy.Context(result, previous, sentencesSinceLastOffer(userId, current)));
        if (!decision.offer()) {
            return new TutorDtos.OfferResponse(false, decision.reason().name(), null, List.of());
        }
        List<PracticeWord> words = selector.select(result, previous);
        if (words.isEmpty()) {
            return new TutorDtos.OfferResponse(false, TutorOfferPolicy.Reason.NO_SIGNIFICANT_ERROR.name(), null, List.of());
        }
        TutorOffer saved = tx.execute(status -> offers.save(
                TutorOffer.of(userId, current.lessonId(), attemptId, decision.reason(), clock.instant())));
        return new TutorDtos.OfferResponse(true, decision.reason().name(), saved.getId(), words);
    }

    /** Học viên bấm "Bỏ qua câu này"; gọi lại không đổi gì. */
    public void decline(UUID userId, UUID offerId) {
        tx.executeWithoutResult(status -> offers.findByIdAndUserId(offerId, userId)
                .orElseThrow(() -> new NotFoundException("Offer not found"))
                .decline(clock.instant()));
    }

    /** @throws IllegalArgumentException {@code event} không thuộc {@link TutorLessonEvent#EVENTS} */
    public void recordLessonEvent(UUID userId, UUID lessonId, String event) {
        lessonEvents.save(TutorLessonEvent.of(userId, lessonId, event, clock.instant()));
    }

    /** Số lượt đã đọc kể từ lượt của lần mời gần nhất trong bài, tính cả lượt hiện tại; null nếu chưa mời lần nào. */
    private Integer sentencesSinceLastOffer(UUID userId, AttemptSnapshot current) {
        return offers.findFirstByUserIdAndLessonIdOrderByCreatedAtDesc(userId, current.lessonId())
                .map(offer -> snapshots.countSince(userId, current.lessonId(), offer.getAttemptId(), current.attemptId()))
                .orElse(null);
    }
}
