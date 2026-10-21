package com.lingualoop.backend.practice.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.practice.dto.request.AttemptWordRequest;
import com.lingualoop.backend.practice.dto.request.DictationAttemptRequest;
import com.lingualoop.backend.practice.dto.DictationAttemptDetailView;
import com.lingualoop.backend.practice.dto.DictationAttemptView;
import com.lingualoop.backend.practice.enums.AttemptOutcome;
import com.lingualoop.backend.practice.mapper.SentenceAttemptMapper;
import com.lingualoop.backend.practice.repository.SentenceAttemptRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class PracticeAttemptServiceImpl implements PracticeAttemptService {

    private final SentenceAttemptRepository attempts;
    private final SentenceAttemptMapper mapper;

    @Override
    @Transactional
    public long recordDictationAttempt(DictationAttemptRequest record) {
        record.words().forEach(PracticeAttemptServiceImpl::validate);
        return attempts.save(mapper.toEntity(record)).getId();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DictationAttemptView> findLatestDictationAttempts(UUID userId, UUID lessonId) {
        return mapper.toViews(attempts.findLatestDictationPerSentence(userId, lessonId));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DictationAttemptDetailView> findLatestDictationAttempt(UUID userId, UUID sentenceId) {
        return attempts.findLatestDictationOfSentence(userId, sentenceId).map(mapper::toDetailView);
    }

    @Override
    @Transactional(readOnly = true)
    public List<List<Integer>> findRecentBlankPositions(UUID userId, UUID sentenceId, int limit) {
        if (limit <= 0) {
            return List.of();
        }
        return attempts.findRecentEasyAttempts(userId, sentenceId, limit).stream()
                .map(mapper::toBlankPositions)
                .toList();
    }

    /** Từ thừa không có từ đúng nên cũng không có nhóm từ, nếu không sẽ bị đếm thành "cơ hội". */
    private static void validate(AttemptWordRequest w) {
        boolean inserted = w.outcome() == AttemptOutcome.inserted;
        if (inserted && (w.expectedWord() != null || w.expectedWordClass() != null)) {
            throw new IllegalArgumentException(
                    "Inserted word at position " + w.position() + " must not have an expected word or word class");
        }
        if (!inserted && w.expectedWord() == null) {
            throw new IllegalArgumentException("Word at position " + w.position() + " is missing its expected word");
        }
    }
}
