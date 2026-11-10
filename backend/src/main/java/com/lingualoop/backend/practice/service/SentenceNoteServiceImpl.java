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
import com.lingualoop.backend.lesson.enums.PracticeMode;
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
    public Optional<SentenceNoteView> find(UUID userId, UUID sentenceId, PracticeMode mode) {
        return notes.findOne(userId, sentenceId, mode.name()).map(SentenceNoteServiceImpl::toView);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, String> findContentsByLesson(UUID userId, UUID lessonId, PracticeMode mode) {
        return notes.findByLesson(userId, lessonId, mode.name()).stream()
                .collect(Collectors.toMap(SentenceNote::getSentenceId, SentenceNote::getContent));
    }

    @Override
    @Transactional
    public SentenceNoteView save(UUID userId, UUID sentenceId, PracticeMode mode, String content) {
        if (!reviews.hasAttempt(userId, sentenceId, mode.name())) {
            throw new BusinessException(ErrorCode.PRACTICE_SENTENCE_NOT_PRACTICED);
        }
        SentenceNote note = notes.findOne(userId, sentenceId, mode.name()).orElseGet(() -> {
            SentenceNote created = new SentenceNote();
            created.setUserId(userId);
            created.setSentenceId(sentenceId);
            created.setMode(mode);
            return created;
        });
        note.setContent(content);
        note.setUpdatedAt(clock.instant());
        return toView(notes.save(note));
    }

    @Override
    @Transactional
    public void delete(UUID userId, UUID sentenceId, PracticeMode mode) {
        notes.deleteOne(userId, sentenceId, mode.name());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SentenceNoteEntryView> list(UUID userId, PracticeMode mode, UUID lessonId) {
        return notes.findEntries(userId, mode == null ? null : mode.name(), lessonId).stream()
                .map(e -> new SentenceNoteEntryView(e.getSentenceId(), PracticeMode.valueOf(e.getMode()),
                        e.getContent(), e.getUpdatedAt(), e.getLessonId(), e.getLessonTitle(), e.getSortOrder(),
                        e.getText(), e.getTextVi()))
                .toList();
    }

    private static SentenceNoteView toView(SentenceNote note) {
        return new SentenceNoteView(note.getSentenceId(), note.getMode(), note.getContent(), note.getUpdatedAt());
    }
}
