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
import com.lingualoop.backend.vocab.entity.UserSavedWord;
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
     * Không chạy trong giao dịch: nếu hai yêu cầu tranh nhau tạo cùng bộ, thẻ hoặc dòng từ đã lưu thì một bên vi phạm
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
        UserSavedWord saved = repository.findByIdAndUserId(savedWordId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_SAVED_WORD_NOT_FOUND));
        repository.delete(saved);
        if (saved.getCardId() != null) {
            repository.hideCard(saved.getCardId());
        }
    }

    private SavedWordView toView(SavedWordRow row, Instant now) {
        CardStatus status = CardStatus.fromDb(row.getStatus());
        Instant next = row.getNextReviewAt();
        boolean due = status == CardStatus.NEW || next == null || !next.isAfter(now);
        SavedWordView.Lesson lesson = row.getLessonSlug() == null
                ? null
                : new SavedWordView.Lesson(row.getLessonSlug(), row.getLessonTitle(), row.getSentenceId());
        return new SavedWordView(row.getId(), row.getHeadword(), row.getCefrLevel(), row.getPos(),
                row.getMeaningNo(), row.getTranslationVi(), row.getExampleEn(), row.getExampleVi(),
                row.getIpaUk(), row.getIpaUs(), dictionary.resolveAudioUrl(row.getAudioUk()),
                dictionary.resolveAudioUrl(row.getAudioUs()), SavedWordSource.fromDb(row.getSource()), lesson,
                row.getContextEn(), row.getContextVi(), status, next, due, row.getSavedAt());
    }
}
