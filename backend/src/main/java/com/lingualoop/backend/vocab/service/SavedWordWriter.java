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
import com.lingualoop.backend.vocab.repository.SavedWordRepository;

import lombok.RequiredArgsConstructor;

/**
 * Một lần lưu từ trong một giao dịch. Tách khỏi {@link SavedWordServiceImpl} để dịch vụ đó thử lại được bằng một giao
 * dịch mới khi hai yêu cầu lưu cùng lúc tranh nhau tạo bộ, phần hoặc thẻ.
 */
@Component
@RequiredArgsConstructor
class SavedWordWriter {

    private final SavedWordRepository repository;
    private final DictionaryQueryService dictionary;
    private final SentenceQueryService sentences;

    /** Trả id thẻ: thẻ đang hiện nếu nghĩa đã được lưu, không thì thẻ mới hoặc thẻ khôi phục. */
    @Transactional
    UUID saveOnce(UUID userId, String headword, int meaningNo, UUID sentenceId) {
        MeaningSnapshot meaning = dictionary.findMeaning(headword, meaningNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_MEANING_NOT_FOUND));
        UUID deckId = repository.findSavedDeckId(userId).orElseGet(() -> repository.insertSavedDeck(userId));
        var existing = repository.findVisibleCard(deckId, meaning.wordId(), meaningNo);
        if (existing.isPresent()) {
            return existing.get();
        }
        if (sentenceId != null) {
            SentenceView sentence = sentences.findSentence(sentenceId)
                    .orElseThrow(() -> new NotFoundException("Sentence not found"));
            sentences.assertCanPractice(userId, sentence.lessonId());
        }
        UUID groupId = repository.findFirstGroupId(deckId).orElseGet(() -> repository.insertGroup(deckId));
        String pos = DictionaryCardContent.pos(meaning.pos());
        return repository.upsertCard(deckId, groupId, new SavedWordRepository.CardContent(meaning.wordId(), meaningNo,
                meaning.headword(), pos, clip(meaning.meaningVi() == null ? "" : meaning.meaningVi()),
                clip(meaning.definitionEn()), clip(meaning.definitionVi()), clip(meaning.exampleEn()),
                clip(meaning.exampleVi()), meaning.ipaUk(), meaning.ipaUs(), meaning.audioUk(), meaning.audioUs(),
                sentenceId));
    }

    private static String clip(String text) {
        return DictionaryCardContent.clip(text);
    }
}
