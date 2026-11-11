package com.lingualoop.backend.vocab.service;

import java.util.Set;
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

    /** Loại từ thẻ nhận (CHECK của {@code vocab_cards.pos}); loại khác trong từ điển thì để trống. */
    private static final Set<String> CARD_POS = Set.of("noun", "verb", "adjective", "adverb", "preposition", "pronoun",
            "conjunction", "determiner", "interjection", "phrasal verb", "idiom", "phrase", "collocation", "modal verb");
    private static final int MAX_TEXT = 500;

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
        String pos = meaning.pos() != null && CARD_POS.contains(meaning.pos()) ? meaning.pos() : null;
        return repository.upsertCard(deckId, groupId, new SavedWordRepository.CardContent(meaning.wordId(), meaningNo,
                meaning.headword(), pos, clip(meaning.meaningVi() == null ? "" : meaning.meaningVi()),
                clip(meaning.definitionEn()), clip(meaning.definitionVi()), clip(meaning.exampleEn()),
                clip(meaning.exampleVi()), meaning.ipaUk(), meaning.ipaUs(), meaning.audioUk(), meaning.audioUs(),
                sentenceId));
    }

    /** Cột văn bản của thẻ tối đa 500 ký tự; từ điển hiếm khi dài hơn nên cắt bớt thay vì báo lỗi. */
    private static String clip(String text) {
        return text == null || text.length() <= MAX_TEXT ? text : text.substring(0, MAX_TEXT);
    }
}
