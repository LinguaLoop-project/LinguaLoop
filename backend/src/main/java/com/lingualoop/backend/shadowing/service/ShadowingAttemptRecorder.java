package com.lingualoop.backend.shadowing.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.lesson.service.LessonProgressService;
import com.lingualoop.backend.practice.entity.SentenceAttempt;
import com.lingualoop.backend.practice.entity.SentenceAttemptWord;
import com.lingualoop.backend.practice.enums.AttemptOutcome;
import com.lingualoop.backend.shadowing.azure.AzurePhonemeMapper;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment;
import com.lingualoop.backend.shadowing.repository.PhonemeRepository;
import com.lingualoop.backend.shadowing.repository.ShadowingAttemptRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Lưu một Lượt shadowing trong một giao dịch. Tách khỏi {@link ShadowingAttemptService} để lời gọi Azure
 * (vài giây) không giữ giao dịch hay kết nối DB.
 */
@Slf4j
@Service
@RequiredArgsConstructor
class ShadowingAttemptRecorder {

    private final ShadowingAttemptRepository repository;
    private final PhonemeRepository phonemeRepository;
    private final LessonProgressService lessonProgressService;

    @Transactional
    public long save(UUID userId, UUID lessonId, UUID sentenceId, PronunciationAssessment assessment,
            List<List<String>> targets, int durationMs) {
        SentenceAttempt attempt = SentenceAttempt.azureShadowing(userId, sentenceId, assessment.pronunciationScore(),
                assessment.accuracyScore(), assessment.fluencyScore(), assessment.completenessScore(),
                assessment.prosodyScore(), durationMs);

        Map<String, Short> phonemeIds = phonemeRepository.idsBySymbol();
        int position = 0;
        for (PronunciationAssessment.WordResult word : assessment.words()) {
            addWord(attempt, position, word, targets.get(position), phonemeIds);
            position++;
        }
        long attemptId = repository.save(attempt).getId();

        lessonProgressService.recordActivity(userId, lessonId, PracticeMode.shadowing, (durationMs + 999) / 1000);
        return attemptId;
    }

    /** Loại lỗi của Azure đổi sang {@code outcome} của DB; ràng buộc: từ thừa không có từ mong đợi, từ bỏ sót không có từ thực tế. */
    static String outcomeOf(PronunciationAssessment.ErrorType type) {
        return switch (type) {
            case NONE -> "correct";
            case MISPRONUNCIATION -> "mispronounced";
            case OMISSION -> "omitted";
            case INSERTION -> "inserted";
        };
    }

    /** Ràng buộc của DB: từ thừa không có từ mong đợi, từ bỏ sót không có từ thực tế. */
    private void addWord(SentenceAttempt attempt, int position, PronunciationAssessment.WordResult word,
            List<String> targets, Map<String, Short> phonemeIds) {
        String outcome = outcomeOf(word.errorType());
        SentenceAttemptWord row = attempt.addWord(position, "inserted".equals(outcome) ? null : word.word(),
                "omitted".equals(outcome) ? null : word.word(), AttemptOutcome.valueOf(outcome), word.accuracyScore());

        List<String> azure = word.phonemes().stream().map(PronunciationAssessment.PhonemeResult::symbol).toList();
        List<String> table = AzurePhonemeMapper.toTableSymbols(azure);
        for (int i = 0; i < table.size(); i++) {
            PronunciationAssessment.PhonemeResult p = word.phonemes().get(i);
            Short id = table.get(i) == null ? null : phonemeIds.get(table.get(i));
            if (id == null) {
                // Vẫn lưu (phoneme_id rỗng, giữ ký hiệu gốc) để xử lý lại khi bổ sung bộ chuyển đổi
                log.warn("Âm vị Azure '{}' chưa chuyển được sang bảng phonemes (từ '{}'), lưu với ký hiệu gốc",
                        azure.get(i), word.word());
            }
            Short target = targets.get(i) == null ? null : phonemeIds.get(targets.get(i));
            PronunciationAssessment.Candidate alt = topAlternative(p, table.get(i), phonemeIds);
            row.addPhoneme(i, id, p.symbol(), target,
                    alt == null ? null : phonemeIds.get(toTable(alt.symbol())), alt == null ? null : alt.score(),
                    p.accuracyScore());
        }
    }

    /** Ứng viên cao điểm nhất mà chuyển được sang bảng phonemes và khác cách đọc Azure báo. */
    private static PronunciationAssessment.Candidate topAlternative(PronunciationAssessment.PhonemeResult p,
            String reported, Map<String, Short> phonemeIds) {
        PronunciationAssessment.Candidate best = null;
        for (PronunciationAssessment.Candidate c : p.alternatives()) {
            String symbol = toTable(c.symbol());
            if (symbol == null || symbol.equals(reported) || !phonemeIds.containsKey(symbol)) {
                continue;
            }
            if (best == null || c.score() > best.score()) {
                best = c;
            }
        }
        return best;
    }

    private static String toTable(String azureSymbol) {
        return AzurePhonemeMapper.toTableSymbols(List.of(azureSymbol)).get(0);
    }
}
