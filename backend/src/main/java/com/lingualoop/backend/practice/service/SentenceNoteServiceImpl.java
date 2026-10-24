package com.lingualoop.backend.practice.service;

import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.practice.dto.SentenceNoteEntryView;
import com.lingualoop.backend.practice.dto.SentenceNoteView;
import com.lingualoop.backend.practice.entity.SentenceNote;
import com.lingualoop.backend.practice.repository.SentenceNoteRepository;
import com.lingualoop.backend.practice.repository.SentenceReviewRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class SentenceNoteServiceImpl implements SentenceNoteService {

    private final SentenceNoteRepository notes;
    private final SentenceReviewRepository reviews;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public Optional<SentenceNoteView> find(UUID userId, UUID sentenceId) {
        return notes.findByUserIdAndSentenceId(userId, sentenceId).map(SentenceNoteServiceImpl::toView);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, String> findContentsByLesson(UUID userId, UUID lessonId) {
        return notes.findByLesson(userId, lessonId).stream()
                .collect(Collectors.toMap(SentenceNote::getSentenceId, SentenceNote::getContent));
    }

    @Override
    @Transactional
    public SentenceNoteView save(UUID userId, UUID sentenceId, String content) {
        if (!reviews.hasDictationAttempt(userId, sentenceId)) {
            throw new BusinessException(ErrorCode.PRACTICE_SENTENCE_NOT_PRACTICED);
        }
        SentenceNote note = notes.findByUserIdAndSentenceId(userId, sentenceId).orElseGet(() -> {
            SentenceNote created = new SentenceNote();
            created.setUserId(userId);
            created.setSentenceId(sentenceId);
            return created;
        });
        note.setContent(content);
        note.setUpdatedAt(clock.instant());
        return toView(notes.save(note));
    }

    @Override
    @Transactional
    public void delete(UUID userId, UUID sentenceId) {
        notes.deleteByUserIdAndSentenceId(userId, sentenceId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SentenceNoteEntryView> list(UUID userId, String lessonSlug) {
        return notes.findEntries(userId, lessonSlug).stream()
                .map(e -> new SentenceNoteEntryView(e.getSentenceId(), e.getContent(), e.getUpdatedAt(),
                        e.getLessonSlug(), e.getLessonTitle(), e.getSortOrder(), e.getText(), e.getTextVi()))
                .toList();
    }

    private static SentenceNoteView toView(SentenceNote note) {
        return new SentenceNoteView(note.getSentenceId(), note.getContent(), note.getUpdatedAt());
    }
}
