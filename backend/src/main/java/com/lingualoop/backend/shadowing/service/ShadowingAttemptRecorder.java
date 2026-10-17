package com.lingualoop.backend.shadowing.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.lesson.service.LessonProgressService;
import com.lingualoop.backend.shadowing.azure.AzurePhonemeMapper;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment;
import com.lingualoop.backend.shadowing.repository.ShadowingAttemptRepository;
import com.lingualoop.backend.shadowing.repository.ShadowingAttemptRepository.AttemptRow;
import com.lingualoop.backend.shadowing.repository.ShadowingAttemptRepository.PhonemeRow;
import com.lingualoop.backend.shadowing.repository.ShadowingAttemptRepository.WordRow;

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
    private final LessonProgressService lessonProgressService;

    @Transactional
    public long save(UUID userId, UUID lessonId, UUID sentenceId, PronunciationAssessment assessment, int durationMs) {
        long attemptId = repository.insertAttempt(new AttemptRow(userId, sentenceId, assessment.pronunciationScore(),
                assessment.accuracyScore(), assessment.fluencyScore(), assessment.completenessScore(),
                assessment.prosodyScore(), durationMs));

        Map<String, Short> phonemeIds = repository.phonemeIdsBySymbol();
        int position = 0;
        for (PronunciationAssessment.WordResult word : assessment.words()) {
            long wordId = repository.insertWord(attemptId, toWordRow(position, word));
            repository.insertPhonemes(wordId, toPhonemeRows(word, phonemeIds));
            position++;
        }

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

    private static WordRow toWordRow(int position, PronunciationAssessment.WordResult word) {
        String outcome = outcomeOf(word.errorType());
        String expected = "inserted".equals(outcome) ? null : word.word();
        String actual = "omitted".equals(outcome) ? null : word.word();
        return new WordRow(position, expected, actual, outcome, word.accuracyScore());
    }

    private List<PhonemeRow> toPhonemeRows(PronunciationAssessment.WordResult word, Map<String, Short> phonemeIds) {
        List<String> azure = word.phonemes().stream().map(PronunciationAssessment.PhonemeResult::symbol).toList();
        List<String> table = AzurePhonemeMapper.toTableSymbols(azure);
        List<PhonemeRow> rows = new ArrayList<>();
        for (int i = 0; i < table.size(); i++) {
            Short id = table.get(i) == null ? null : phonemeIds.get(table.get(i));
            if (id == null) {
                log.warn("Âm vị Azure '{}' chưa chuyển được sang bảng phonemes (từ '{}'), bỏ qua khi lưu",
                        azure.get(i), word.word());
                continue;
            }
            rows.add(new PhonemeRow(i, id, word.phonemes().get(i).accuracyScore()));
        }
        return rows;
    }
}
