package com.lingualoop.backend.lesson.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.Sentence;
import com.lingualoop.backend.lesson.enums.LessonStatus;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.SentenceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class LessonModerationServiceImpl implements LessonModerationService {

    private final LessonRepository lessons;
    private final SentenceRepository sentences;

    @Override
    @Transactional
    public void unpublishForReport(UUID lessonId, String reason) {
        lessons.findLibraryForUpdate(lessonId)
                .filter(lesson -> lesson.getStatus() == LessonStatus.PUBLISHED)
                .ifPresent(lesson -> {
                    lesson.setStatus(LessonStatus.DRAFT);
                    lesson.setUnpublishReason(reason);
                });
    }

    @Override
    @Transactional
    public void publishApproved(UUID lessonId) {
        Lesson lesson = lessons.findLibraryForUpdate(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        // Thứ tự câu theo mốc bắt đầu, như SentenceView.sortOrder (BR-BH-11).
        List<Sentence> active = sentences.findByLessonIdAndDeletedAtIsNullOrderByStartMsAsc(lessonId);
        List<Integer> missing = new ArrayList<>();
        for (int i = 0; i < active.size(); i++) {
            String textVi = active.get(i).getTextVi();
            if (textVi == null || textVi.isBlank()) {
                missing.add(i + 1);
            }
        }
        if (active.isEmpty() || !missing.isEmpty()) {
            throw new BusinessException(ErrorCode.LESSON_NOT_PUBLISHABLE,
                    Map.of("noSentences", active.isEmpty(), "missingTranslation", missing));
        }
        lesson.setStatus(LessonStatus.PUBLISHED);
        lesson.setUnpublishReason(null);
    }

    @Override
    @Transactional
    public String applyReportFix(UUID sentenceId, String column, String value) {
        Sentence sentence = sentences.findActiveForUpdate(sentenceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_TARGET_NOT_FOUND));
        String fixed = value.strip();
        String old;
        switch (column) {
            case "text_en" -> {
                old = sentence.getTextEn();
                sentence.setTextEn(fixed);
            }
            case "ipa_us" -> {
                old = sentence.getIpaUs();
                sentence.setIpaUs(fixed);
            }
            case "ipa_uk" -> {
                old = sentence.getIpaUk();
                sentence.setIpaUk(fixed);
            }
            case "text_vi" -> {
                old = sentence.getTextVi();
                sentence.setTextVi(fixed);
            }
            default -> throw new IllegalArgumentException("Không phải trường sửa được của câu: " + column);
        }
        return old;
    }
}
