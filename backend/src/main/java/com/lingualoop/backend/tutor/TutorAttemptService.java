package com.lingualoop.backend.tutor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment;
import com.lingualoop.backend.shadowing.azure.PronunciationScoringService;
import com.lingualoop.backend.shadowing.dto.AttemptSnapshot;
import com.lingualoop.backend.shadowing.service.AssessmentSnapshots;
import com.lingualoop.backend.shadowing.service.AttemptSnapshots;
import com.lingualoop.backend.shadowing.service.WavAudio;
import com.lingualoop.backend.tutor.dto.TutorDtos;
import com.lingualoop.backend.tutor.entity.TutorSession;
import com.lingualoop.backend.tutor.entity.TutorSessionWord;
import com.lingualoop.backend.user.service.ConsentService;
import com.lingualoop.backend.user.service.ConsentService.ConsentType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Lượt chấm của Phiên gia sư (UC-TUTOR-06): học viên giữ nút để đọc một từ hoặc cả câu, Azure chấm, luật AttemptRule
 * quyết định bước tiếp theo. Không trừ lượt {@code shadowing_assess} và không tạo Lượt shadowing mới. Lời gọi Azure
 * nằm ngoài transaction: kiểm tra trước, chấm, rồi khoá phiên để ghi kết quả.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TutorAttemptService {

    /** Chỉ dẫn cho gia sư khi Lượt chấm không được tính (BR-TUTOR-04). */
    static final String NOT_ASSESSED = "Hệ thống không nghe rõ lượt vừa rồi, lượt này không bị tính. "
            + "Nhắc người học giữ nút, nói to và rõ hơn rồi gọi lại request_retry với cùng target.";

    private final ConsentService consentService;
    private final PronunciationScoringService scoring;
    private final AttemptSnapshots snapshots;
    private final AttemptRule attemptRule;
    private final LockedSessions locked;
    private final TutorViews views;
    private final java.time.Clock clock;

    /** Điều kiện đã kiểm tra trước khi gọi Azure. */
    private record Prepared(AttemptTarget target, String wordKey, String reference, String referenceIpa) {
    }

    /**
     * @param wav        bản ghi WAV PCM 16-bit mono 16 kHz (cùng quy tắc với Lượt shadowing)
     * @param targetWire {@code word} (Từ đang luyện) hoặc {@code sentence}
     */
    public TutorDtos.AttemptResponse attempt(UUID userId, UUID sessionId, byte[] wav, String targetWire) {
        WavAudio.parse(wav);
        AttemptTarget target;
        try {
            target = AttemptTarget.fromWire(targetWire);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "target phải là word hoặc sentence");
        }
        if (!consentService.hasConsent(userId, ConsentType.AI_PROCESSING)) {
            throw new BusinessException(ErrorCode.AI_CONSENT_REQUIRED);
        }

        Prepared prepared = locked.run(userId, sessionId, session -> prepare(userId, session, target));

        PronunciationAssessment assessment;
        try {
            assessment = scoring.assess(wav, prepared.reference());
        } catch (BusinessException e) {
            // Lượt không được tính; kèm chỉ dẫn để gia sư nhắc học viên đọc lại
            throw new BusinessException(e.getErrorCode(), e.getMessage(), Map.of("instruction", NOT_ASSESSED));
        }

        return locked.run(userId, sessionId, session -> finish(session, prepared, assessment));
    }

    private Prepared prepare(UUID userId, TutorSession session, AttemptTarget target) {
        if (session.getStartedAt() == null) {
            throw new IllegalStateException("Phiên chưa bắt đầu: gia sư chưa nói câu đầu tiên.");
        }
        TutorSessionWord current = session.prepareAttempt(target);
        AttemptSnapshot snapshot = snapshots.load(userId, session.getAttemptId());
        if (current == null) {
            return new Prepared(target, null, snapshot.sentenceText(), snapshot.sentenceIpa());
        }
        return new Prepared(target, current.getWordKey(), current.getWord(),
                wordIpa(snapshot.sentenceText(), snapshot.sentenceIpa(), current.getWordKey()));
    }

    private TutorDtos.AttemptResponse finish(TutorSession session, Prepared prepared, PronunciationAssessment assessment) {
        // Phiên có thể đã hết giờ, hoặc học viên đã đổi từ, trong lúc chờ Azure
        session.ensureOpen();
        Map<Short, String> symbols = views.symbolById();
        SentenceResult result = new SentenceResult(assessment.accuracyScore(), SentenceResults.words(
                AssessmentSnapshots.words(prepared.reference(), prepared.referenceIpa(), assessment)));
        return prepared.target() == AttemptTarget.WORD
                ? finishWord(session, prepared, result, symbols)
                : finishSentence(session, assessment, symbols);
    }

    private TutorDtos.AttemptResponse finishWord(TutorSession session, Prepared prepared, SentenceResult result,
            Map<Short, String> symbols) {
        TutorSessionWord current = session.currentWord().orElse(null);
        if (current == null || !current.getWordKey().equals(prepared.wordKey())) {
            throw new IllegalStateException("Từ đang luyện đã đổi trong lúc chấm nên lượt này không được tính. "
                    + "Làm theo từ đang luyện hiện tại.");
        }
        PracticeWord word = views.practice(current, symbols);
        double score = WordScoring.scoreOf(result, word);
        TutorSession.WordAttempt attempt = session.recordWordAttempt(score);
        AttemptRule.WordDecision decision = attemptRule.afterWordAttempt(
                attempt.attemptNumber(), score, attempt.nextPending().isPresent());

        PracticeWord next = null;
        if (decision.nextStep() == AttemptRule.NextStep.NEXT_WORD) {
            TutorSessionWord nextWord = attempt.nextPending().orElseThrow();
            session.switchTo(nextWord.getWordKey(), () -> null);
            next = views.practice(nextWord, symbols);
        }
        String instruction = TutorInstructions.afterWordAttempt(decision, score, attempt.attemptNumber(), word, next);
        return new TutorDtos.AttemptResponse(attempt.attemptNumber(), TutorDtos.wire(AttemptTarget.WORD), word.word(),
                score, result.accuracy(), decision.passed(), TutorDtos.wire(attempt.word().getStatus()),
                TutorDtos.wire(decision.nextStep()), next == null ? null : next.word(), null, instruction,
                views.words(session));
    }

    private TutorDtos.AttemptResponse finishSentence(TutorSession session, PronunciationAssessment assessment,
            Map<Short, String> symbols) {
        double score = assessment.pronunciationScore();
        int attemptNumber = session.recordSentenceAttempt();
        TutorSessionWord pending = session.firstPending(null).orElse(null);
        AttemptRule.NextStep step = attemptRule.afterSentenceAttempt(pending != null);

        PracticeWord next = null;
        String outcome = null;
        if (step == AttemptRule.NextStep.END) {
            session.end(SessionOutcome.COMPLETED, clock.instant());
            outcome = TutorDtos.wire(SessionOutcome.COMPLETED);
        } else {
            session.switchTo(pending.getWordKey(), () -> null);
            next = views.practice(pending, symbols);
        }
        String instruction = TutorInstructions.afterSentenceAttempt(step, score, next);
        return new TutorDtos.AttemptResponse(attemptNumber, TutorDtos.wire(AttemptTarget.SENTENCE), null, score,
                assessment.accuracyScore(), score >= TutorThresholds.PASS_SCORE, null, TutorDtos.wire(step),
                next == null ? null : next.word(), outcome, instruction, views.words(session));
    }

    /** Phiên âm mẫu của một từ trong câu (theo vị trí); null khi câu không có phiên âm hoặc lệch số từ. */
    static String wordIpa(String sentenceText, String sentenceIpa, String wordKey) {
        if (sentenceText == null || sentenceIpa == null || sentenceIpa.isBlank()) {
            return null;
        }
        String[] words = sentenceText.trim().split("\\s+");
        String[] parts = sentenceIpa.trim().split("\\s+");
        if (words.length != parts.length) {
            return null;
        }
        for (int i = 0; i < words.length; i++) {
            if (Words.normalize(words[i]).equals(wordKey)) {
                return parts[i];
            }
        }
        return null;
    }
}
