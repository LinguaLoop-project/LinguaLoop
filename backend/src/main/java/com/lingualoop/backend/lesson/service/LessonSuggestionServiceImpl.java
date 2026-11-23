package com.lingualoop.backend.lesson.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.common.exception.ForbiddenException;
import com.lingualoop.backend.credit.AiFeature;
import com.lingualoop.backend.credit.AiUsage;
import com.lingualoop.backend.credit.CreditService;
import com.lingualoop.backend.lesson.dto.request.SuggestSentencesRequest;
import com.lingualoop.backend.lesson.dto.response.SentenceSuggestionResponse;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.Sentence;
import com.lingualoop.backend.lesson.ipa.IpaGenerator;
import com.lingualoop.backend.lesson.ipa.IpaGenerator.SentenceIpa;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.lesson.transcript.SentenceTranslator;
import com.lingualoop.backend.lesson.transcript.SentenceTranslator.Translation;

import lombok.RequiredArgsConstructor;

/**
 * Không đánh dấu {@code @Transactional}: gọi Gemini mất nhiều giây, không giữ kết nối DB. Gợi ý dịch trừ credit mỗi câu
 * (BR-BH-14): kiểm số dư đủ cho mọi câu đã chọn trước khi gọi AI, chỉ trừ cho các câu có gợi ý. IPA không tốn credit.
 */
@Service
@RequiredArgsConstructor
class LessonSuggestionServiceImpl implements LessonSuggestionService {

    private final LessonRepository lessons;
    private final SentenceRepository sentences;
    private final SentenceTranslator translator;
    private final IpaGenerator ipaGenerator;
    private final CreditService credits;

    @Override
    public SentenceSuggestionResponse suggest(UUID teacherId, UUID lessonId, SuggestSentencesRequest request) {
        if (!request.translation() && !request.ipa()) {
            throw new FieldValidationException("translation", "AssertTrue");
        }
        Lesson lesson = lessons.findById(lessonId).filter(l -> Lesson.KIND_LIBRARY.equals(l.getKind()))
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        if (!teacherId.equals(lesson.getOwnerId())) {
            throw new ForbiddenException("Bạn không có quyền với bài học này");
        }
        if (lesson.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.LESSON_NOT_FOUND);
        }
        Set<UUID> ids = sentences.findByLessonIdAndDeletedAtIsNullOrderByStartMsAsc(lessonId).stream()
                .map(Sentence::getId).collect(Collectors.toSet());
        for (SuggestSentencesRequest.Item item : request.sentences()) {
            if (!ids.contains(item.id())) {
                throw new BusinessException(ErrorCode.LESSON_SENTENCE_NOT_FOUND);
            }
        }

        List<String> texts = request.sentences().stream().map(item -> item.textEn().strip()).toList();
        Charged translation = request.translation() ? translate(teacherId, texts) : null;
        List<SentenceIpa> ipa = request.ipa() ? ipaGenerator.generate(texts)
                : Collections.nCopies(texts.size(), SentenceIpa.NONE);

        List<SentenceSuggestionResponse.Item> items = new ArrayList<>(texts.size());
        int ipaCount = 0;
        for (int i = 0; i < texts.size(); i++) {
            String vi = translation == null ? null : translation.translated().translations().get(i);
            SentenceIpa p = ipa.get(i);
            if (p.us() != null) {
                ipaCount++;
            }
            items.add(new SentenceSuggestionResponse.Item(request.sentences().get(i).id(), vi, p.us(), p.uk()));
        }
        return new SentenceSuggestionResponse(items,
                translation == null ? 0 : (int) translation.translated().translatedCount(), ipaCount,
                translation == null ? null : translation.translated().outcome().name(),
                translation == null ? 0 : translation.charged(), credits.balanceOf(teacherId).balance());
    }

    /** Kiểm số dư cho mọi câu (3b), gọi AI rồi trừ credit cho các câu có gợi ý (4a); không câu nào có gợi ý thì ghi lỗi. */
    private Charged translate(UUID teacherId, List<String> texts) {
        credits.requireCanStart(teacherId, AiFeature.LESSON_SUGGEST, texts.size());
        Translation translation = translator.translate(texts);
        int translated = (int) translation.translatedCount();
        int charged = 0;
        if (translated > 0) {
            charged = credits.charge(teacherId, AiFeature.LESSON_SUGGEST,
                    AiUsage.units(translated, translation.inputTokens(), translation.outputTokens(), null));
        } else {
            credits.logFailure(teacherId, AiFeature.LESSON_SUGGEST, false);
        }
        return new Charged(translation, charged);
    }

    /** Bản dịch gợi ý kèm credit đã trừ cho nó. */
    private record Charged(Translation translated, int charged) {
    }
}
