package com.lingualoop.backend.vocab.service;

import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.dictionary.dto.MeaningSnapshot;
import com.lingualoop.backend.dictionary.service.DictionaryQueryService;
import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.lesson.service.SentenceQueryService;
import com.lingualoop.backend.vocab.entity.UserSavedWord;
import com.lingualoop.backend.vocab.enums.SavedWordSource;
import com.lingualoop.backend.vocab.repository.SavedWordRepository;

import lombok.RequiredArgsConstructor;

/**
 * Một lần lưu từ trong một giao dịch. Tách khỏi {@link SavedWordServiceImpl} để dịch vụ đó thử lại được bằng một giao
 * dịch mới khi hai yêu cầu lưu cùng lúc tranh nhau tạo bộ, thẻ hoặc dòng từ đã lưu.
 */
@Component
@RequiredArgsConstructor
class SavedWordWriter {

    private final SavedWordRepository repository;
    private final DictionaryQueryService dictionary;
    private final SentenceQueryService sentences;

    /** Trả id dòng từ đã lưu: dòng có sẵn nếu nghĩa đã được lưu, không thì dòng mới cùng thẻ mới hoặc thẻ khôi phục. */
    @Transactional
    UUID saveOnce(UUID userId, String headword, int meaningNo, UUID sentenceId) {
        MeaningSnapshot meaning = dictionary.findMeaning(headword, meaningNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_MEANING_NOT_FOUND));
        var existing = repository.findByUserIdAndWordIdAndMeaningNo(userId, meaning.wordId(), meaningNo);
        if (existing.isPresent()) {
            return existing.get().getId();
        }

        String contextEn = null;
        String contextVi = null;
        if (sentenceId != null) {
            SentenceView sentence = sentences.findSentence(sentenceId)
                    .orElseThrow(() -> new NotFoundException("Sentence not found"));
            sentences.assertCanPractice(userId, sentence.lessonId());
            contextEn = sentence.text();
            contextVi = sentence.textVi();
        }

        UUID cardId = repository.upsertCard(savedGroupId(userId), meaning.wordId(), meaningNo, meaning.headword(),
                meaning.pos(), meaning.translationVi(), meaning.exampleEn(), meaning.exampleVi(), contextEn,
                contextVi, meaning.cefrLevel());
        insertPhonetic(cardId, "us", meaning.ipaUs(), meaning.audioUs());
        insertPhonetic(cardId, "uk", meaning.ipaUk(), meaning.audioUk());

        SavedWordSource source = sentenceId == null ? SavedWordSource.DICTIONARY : SavedWordSource.LESSON;
        UserSavedWord saved = repository.saveAndFlush(
                new UserSavedWord(userId, meaning.wordId(), meaningNo, sentenceId, source.dbValue(), cardId));
        return saved.getId();
    }

    /** Phần duy nhất của bộ "Từ đã lưu"; tạo bộ và phần khi học viên lưu từ lần đầu (BR-VOCAB-02). */
    private UUID savedGroupId(UUID userId) {
        UUID deckId = repository.findSavedDeckId(userId).orElseGet(() -> repository.insertSavedDeck(userId));
        return repository.findFirstGroupId(deckId).orElseGet(() -> repository.insertGroup(deckId));
    }

    /** Thẻ cần có ít nhất phiên âm hoặc âm thanh mới ghi được (ràng buộc của bảng). */
    private void insertPhonetic(UUID cardId, String accent, String ipa, String audioPath) {
        if (ipa != null || audioPath != null) {
            repository.insertPhonetic(cardId, accent, ipa, audioPath);
        }
    }
}
