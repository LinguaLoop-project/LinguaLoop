package com.lingualoop.backend.lesson.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.dto.AuditChanges;
import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditService;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.Sentence;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import com.lingualoop.backend.lesson.enums.LessonStatus;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.lesson.repository.TopicRepository;
import com.lingualoop.backend.security.Role;

import lombok.RequiredArgsConstructor;

/**
 * Lưu bài Nháp cùng các câu trong một giao dịch ngắn. Tách khỏi {@link TeacherLessonImportServiceImpl} vì phần gọi
 * YouTube và Gemini kéo dài hàng chục giây, không được giữ kết nối DB suốt thời gian đó.
 */
@Component
@RequiredArgsConstructor
class LessonDraftWriter {

    /** Dữ liệu một câu đã qua hậu kiểm. */
    record DraftSentence(int startMs, int endMs, String textEn, String textVi, String ipaUs, String ipaUk) {
    }

    /** Thông tin bài cần lưu. */
    record DraftLesson(UUID ownerId, UUID topicId, String title, String youtubeId, int durationSec,
            CefrLevel cefrLevel, boolean pro) {
    }

    private final LessonRepository lessons;
    private final SentenceRepository sentences;
    private final TopicRepository topics;
    private final AuditService auditService;

    /**
     * @throws BusinessException {@code LESSON_TITLE_TAKEN} khi bài cùng tiêu đề, {@code LESSON_VIDEO_TAKEN} khi bài cùng
     *         video vừa được tạo song song
     */
    @Transactional
    public Lesson save(DraftLesson draft, List<DraftSentence> rows) {
        if (lessons.existsActiveTitle(draft.ownerId(), draft.title())) {
            throw new BusinessException(ErrorCode.LESSON_TITLE_TAKEN);
        }
        Lesson lesson = new Lesson();
        lesson.setOwnerId(draft.ownerId());
        lesson.setKind(Lesson.KIND_LIBRARY);
        lesson.setTopic(topics.getReferenceById(draft.topicId()));
        lesson.setTitle(draft.title());
        lesson.setYoutubeId(draft.youtubeId());
        lesson.setDurationSec(draft.durationSec());
        lesson.setCefrLevel(draft.cefrLevel());
        lesson.setPro(draft.pro());
        lesson.setStatus(LessonStatus.DRAFT);
        try {
            lessons.saveAndFlush(lesson);
        } catch (DataIntegrityViolationException e) {
            String message = e.getMostSpecificCause().getMessage();
            if (message != null && message.contains(LessonManageServiceImpl.UNIQUE_VIDEO_INDEX)) {
                throw new BusinessException(ErrorCode.LESSON_VIDEO_TAKEN);
            }
            throw new BusinessException(ErrorCode.LESSON_TITLE_TAKEN);
        }

        List<Sentence> entities = rows.stream().map(row -> {
            Sentence s = new Sentence();
            s.setLesson(lesson);
            s.setStartMs(row.startMs());
            s.setEndMs(row.endMs());
            s.setTextEn(row.textEn());
            s.setTextVi(row.textVi());
            s.setIpaUs(row.ipaUs());
            s.setIpaUk(row.ipaUk());
            return s;
        }).toList();
        sentences.saveAll(entities);
        // Một mục Tạo cho bài kèm số câu; không ghi riêng từng câu được tạo cùng bài (BR-NK-18).
        Map<String, Object> created = AuditChanges.create()
                .field("title", null, lesson.getTitle())
                .field("topic", null, lesson.getTopic().getName())
                .field("cefrLevel", null, lesson.getCefrLevel().name())
                .field("pro", null, lesson.isPro())
                .field("sentenceCount", null, entities.size())
                .build();
        auditService.record(new AuditEntryRequest(draft.ownerId(), null, Role.TEACHER, AuditAction.CREATE,
                AuditEntityType.LESSON, lesson.getId(), lesson.getTitle(), created, "Tạo từ YouTube"));
        return lesson;
    }
}
