package com.lingualoop.backend.vocab.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.dictionary.service.DictionaryQueryService;
import com.lingualoop.backend.vocab.dto.SavedWordView;
import com.lingualoop.backend.vocab.enums.CardStatus;
import com.lingualoop.backend.vocab.enums.SavedWordSource;
import com.lingualoop.backend.vocab.repository.SavedWordRepository;
import com.lingualoop.backend.vocab.repository.SavedWordRepository.SavedWordRow;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class SavedWordServiceImpl implements SavedWordService {

    private final SavedWordRepository repository;
    private final SavedWordWriter writer;
    private final DictionaryQueryService dictionary;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<SavedWordView> list(UUID userId) {
        Instant now = Instant.now(clock);
        return repository.findRows(userId, null).stream().map(row -> toView(row, now)).toList();
    }

    /**
     * Không chạy trong giao dịch: nếu hai yêu cầu tranh nhau tạo cùng bộ, phần hoặc thẻ thì một bên vi phạm
     * ràng buộc duy nhất; thử lại bằng giao dịch mới sẽ thấy dữ liệu bên kia vừa tạo và trả đúng một từ đã lưu
     * (AC-HT-43).
     */
    @Override
    public SavedWordView save(UUID userId, String headword, int meaningNo, UUID sentenceId) {
        UUID savedWordId;
        try {
            savedWordId = writer.saveOnce(userId, headword, meaningNo, sentenceId);
        } catch (DataIntegrityViolationException lostRace) {
            savedWordId = writer.saveOnce(userId, headword, meaningNo, sentenceId);
        }
        Instant now = Instant.now(clock);
        return repository.findRows(userId, savedWordId).stream().findFirst()
                .map(row -> toView(row, now))
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_SAVED_WORD_NOT_FOUND));
    }

    @Override
    @Transactional
    public void unsave(UUID userId, UUID savedWordId) {
        if (!repository.hideCard(userId, savedWordId)) {
            throw new BusinessException(ErrorCode.VOCAB_SAVED_WORD_NOT_FOUND);
        }
    }

    private SavedWordView toView(SavedWordRow row, Instant now) {
        CardStatus status = CardStatus.fromDb(row.status());
        Instant next = row.dueAt();
        boolean due = status == CardStatus.NEW || next == null || !next.isAfter(now);
        SavedWordView.Lesson lesson = row.lessonId() == null
                ? null
                : new SavedWordView.Lesson(row.lessonId(), row.lessonTitle(), row.sentenceId());
        SavedWordSource source = row.sentenceId() == null ? SavedWordSource.DICTIONARY : SavedWordSource.LESSON;
        return new SavedWordView(row.id(), row.headword(), row.pos(), row.meaningNo(), row.meaningVi(),
                row.definitionEn(), row.definitionVi(), row.exampleEn(), row.exampleVi(), row.ipaUk(), row.ipaUs(),
                dictionary.resolveAudioUrl(row.audioUk()), dictionary.resolveAudioUrl(row.audioUs()), source, lesson,
                row.contextEn(), row.contextVi(), status, next, due, row.savedAt());
    }
}
