package com.lingualoop.backend.lesson.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditService;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.common.exception.ForbiddenException;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.lesson.dto.LessonManageView;
import com.lingualoop.backend.lesson.dto.request.RestoreLessonRequest;
import com.lingualoop.backend.lesson.dto.request.UnpublishLessonRequest;
import com.lingualoop.backend.lesson.dto.request.UpdateLessonRequest;
import com.lingualoop.backend.lesson.dto.request.UpdateSentencesRequest;
import com.lingualoop.backend.lesson.dto.request.UpdateSentencesRequest.NewSentence;
import com.lingualoop.backend.lesson.dto.request.UpdateSentencesRequest.SentenceEdit;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.Sentence;
import com.lingualoop.backend.lesson.enums.LessonStatus;
import com.lingualoop.backend.lesson.ipa.IpaGenerator;
import com.lingualoop.backend.lesson.ipa.IpaGenerator.SentenceIpa;
import com.lingualoop.backend.lesson.repository.LessonManageRepository;
import com.lingualoop.backend.lesson.repository.LessonManageRepository.LessonManageRow;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.lesson.repository.TopicRepository;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class LessonManageServiceImpl implements LessonManageService {

    static final int PAGE_SIZE = 10;
    static final int TITLE_MAX = 100;
    static final int TEXT_MAX = 500;
    static final int REASON_MAX = 500;
    static final int MIN_SENTENCE_MS = 500;
    static final Duration DELETED_RETENTION = Duration.ofDays(30);

    /** Chỉ mục duy nhất trong migration; vi phạm khi hai yêu cầu lọt qua bước kiểm tra cùng lúc. */
    static final String UNIQUE_TITLE_INDEX = "uq_lessons_owner_title";
    static final String UNIQUE_VIDEO_INDEX = "uq_lessons_library_video";

    private static final String STATUS_ALL = "all";
    private static final String STATUS_DELETED = "deleted";
    private static final Set<String> TEACHER_STATUSES = Set.of(STATUS_ALL, "draft", "published", STATUS_DELETED);

    private final LessonManageRepository manageRepository;
    private final LessonRepository lessons;
    private final SentenceRepository sentences;
    private final TopicRepository topics;
    private final AuditService auditService;
    private final UserAccountService users;
    private final IpaGenerator ipaGenerator;
    private final Clock clock;

    // ------------------------------------------------------------------ danh sách (UC-BH-01)

    @Override
    @Transactional(readOnly = true)
    public PageResponse<LessonManageView.Item> listForTeacher(UUID teacherId, ListQuery query, int page) {
        String status = query.status() == null || query.status().isBlank() ? STATUS_ALL
                : query.status().strip().toLowerCase(java.util.Locale.ROOT);
        if (!TEACHER_STATUSES.contains(status)) {
            throw new FieldValidationException("status", "Pattern");
        }
        Instant deletedSince = clock.instant().minus(DELETED_RETENTION);
        String pattern = LessonManageRepository.containsPattern(query.q());
        String level = query.cefrLevel() == null ? null : query.cefrLevel().name();
        List<LessonManageRow> rows = manageRepository.findTeacherLessons(teacherId, status, deletedSince, pattern,
                query.topicId(), level, query.pro(), PAGE_SIZE, offsetOf(page));
        long total = manageRepository.countTeacherLessons(teacherId, status, deletedSince, pattern, query.topicId(),
                level, query.pro());
        return pageOf(rows, LessonManageServiceImpl::toItem, page, total);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<LessonManageView.Item> listForAdmin(ListQuery query, int page) {
        if (query.status() != null && !query.status().isBlank()
                && !"published".equalsIgnoreCase(query.status().strip())) {
            throw new ForbiddenException("Quản trị viên chỉ xem được bài học Đã xuất bản");
        }
        String pattern = LessonManageRepository.containsPattern(query.q());
        String level = query.cefrLevel() == null ? null : query.cefrLevel().name();
        List<LessonManageRow> rows = manageRepository.findAdminLessons(query.ownerId(), pattern, query.topicId(),
                level, query.pro(), PAGE_SIZE, offsetOf(page));
        long total = manageRepository.countAdminLessons(query.ownerId(), pattern, query.topicId(), level,
                query.pro());
        return pageOf(rows, LessonManageServiceImpl::toItem, page, total);
    }

    // ------------------------------------------------------------------ chi tiết (UC-BH-02)

    @Override
    @Transactional(readOnly = true)
    public LessonManageView.Detail getForTeacher(UUID teacherId, UUID lessonId) {
        teacherLesson(lessons.findById(lessonId), teacherId);
        return detailOf(lessonId);
    }

    @Override
    @Transactional(readOnly = true)
    public LessonManageView.Detail getForAdmin(UUID lessonId) {
        Lesson lesson = libraryLesson(lessons.findById(lessonId));
        if (lesson.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.LESSON_NOT_FOUND);
        }
        if (lesson.getStatus() != LessonStatus.PUBLISHED) {
            throw new ForbiddenException("Quản trị viên chỉ xem được bài học Đã xuất bản");
        }
        return detailOf(lessonId);
    }

    // ------------------------------------------------------------------ sửa thông tin (UC-BH-04)

    @Override
    @Transactional
    public LessonManageView.Detail updateInfo(UUID teacherId, UUID lessonId, UpdateLessonRequest request) {
        Lesson lesson = teacherLesson(lessons.lockById(lessonId), teacherId);
        String title = validTitle(request.title());
        if (request.topicId() == null) {
            throw new FieldValidationException("topicId", "NotNull");
        }
        if (request.cefrLevel() == null) {
            throw new FieldValidationException("cefrLevel", "NotNull");
        }
        if (!topics.existsById(request.topicId())) {
            throw new BusinessException(ErrorCode.LESSON_TOPIC_NOT_FOUND);
        }
        if (lessons.existsOtherActiveTitle(teacherId, title, lessonId)) {
            throw new BusinessException(ErrorCode.LESSON_TITLE_TAKEN);
        }

        Map<String, Object> diff = new LinkedHashMap<>();
        UUID oldTopic = lesson.getTopic() == null ? null : lesson.getTopic().getId();
        change(diff, "title", lesson.getTitle(), title);
        change(diff, "topicId", oldTopic, request.topicId());
        change(diff, "cefrLevel", lesson.getCefrLevel().name(), request.cefrLevel().name());
        change(diff, "pro", lesson.isPro(), request.pro());
        if (!diff.isEmpty()) {
            lesson.setTitle(title);
            lesson.setTopic(topics.getReferenceById(request.topicId()));
            lesson.setCefrLevel(request.cefrLevel());
            lesson.setPro(request.pro());
            flushLesson(lesson);
            audit(teacherId, Role.TEACHER, AuditAction.UPDATE, AuditEntityType.LESSON, lesson.getId(), title, diff,
                    null);
        }
        return detailOf(lessonId);
    }

    // ------------------------------------------------------------------ sửa câu (UC-BH-05)

    /**
     * Câu sau khi áp các thay đổi, trước khi lưu. {@code key} là mã câu (câu đã có) hoặc khóa trình duyệt đặt (câu mới),
     * dùng để trả lỗi về đúng câu; {@code id} trống với câu mới.
     */
    private record Draft(Object key, UUID id, String textEn, String ipaUs, String ipaUk, String textVi, Integer startMs,
            Integer endMs) {

        Draft withIpa(SentenceIpa ipa) {
            return new Draft(key, id, textEn, ipa.us(), ipa.uk(), textVi, startMs, endMs);
        }
    }

    @Override
    @Transactional
    public LessonManageView.Detail updateSentences(UUID teacherId, UUID lessonId, UpdateSentencesRequest request) {
        Lesson lesson = teacherLesson(lessons.lockById(lessonId), teacherId);
        if (!request.added().isEmpty() && lesson.getFirstPublishedAt() != null) {
            throw new BusinessException(ErrorCode.LESSON_STRUCTURE_LOCKED);
        }
        List<Sentence> current = sentences.findByLessonIdAndDeletedAtIsNullOrderByStartMsAsc(lessonId);
        Map<UUID, Sentence> byId = new LinkedHashMap<>();
        current.forEach(s -> byId.put(s.getId(), s));

        Set<UUID> deleted = new HashSet<>();
        for (UUID id : request.deletedIds()) {
            if (id == null || !byId.containsKey(id)) {
                throw new BusinessException(ErrorCode.LESSON_SENTENCE_NOT_FOUND);
            }
            deleted.add(id);
        }
        Map<UUID, SentenceEdit> edits = new LinkedHashMap<>();
        for (SentenceEdit edit : request.sentences()) {
            if (edit == null || edit.id() == null || !byId.containsKey(edit.id())) {
                throw new BusinessException(ErrorCode.LESSON_SENTENCE_NOT_FOUND);
            }
            if (!deleted.contains(edit.id())) {
                edits.put(edit.id(), edit);
            }
        }

        List<Draft> remaining = new ArrayList<>();
        for (Sentence s : current) {
            if (deleted.contains(s.getId())) {
                continue;
            }
            SentenceEdit e = edits.get(s.getId());
            remaining.add(e == null
                    ? new Draft(s.getId(), s.getId(), s.getTextEn(), s.getIpaUs(), s.getIpaUk(), s.getTextVi(),
                            s.getStartMs(), s.getEndMs())
                    : new Draft(s.getId(), s.getId(), strip(e.textEn()), blankToNull(e.ipaUs()),
                            blankToNull(e.ipaUk()), blankToNull(e.textVi()), e.startMs(), e.endMs()));
        }
        Set<String> keys = new HashSet<>();
        for (NewSentence n : request.added()) {
            String key = n == null || n.key() == null || n.key().isBlank() ? null : n.key().strip();
            if (key == null || !keys.add(key)) {
                throw new FieldValidationException("added.key", "NotBlank");
            }
            remaining.add(new Draft(key, null, strip(n.textEn()), blankToNull(n.ipaUs()), blankToNull(n.ipaUk()),
                    blankToNull(n.textVi()), n.startMs(), n.endMs()));
        }

        List<Map<String, Object>> errors = validateSentences(remaining, lesson.getDurationSec() * 1000);
        if (!errors.isEmpty()) {
            throw new BusinessException(ErrorCode.LESSON_SENTENCES_INVALID, Map.of("errors", errors));
        }
        if (remaining.isEmpty() && lesson.getStatus() == LessonStatus.PUBLISHED) {
            throw new BusinessException(ErrorCode.LESSON_MUST_KEEP_SENTENCE);
        }
        remaining = fillMissingIpa(remaining, byId);

        Instant now = clock.instant();
        List<Sentence> changed = new ArrayList<>();
        for (UUID id : deleted) {
            Sentence s = byId.get(id);
            s.setDeletedAt(now);
            changed.add(s);
            audit(teacherId, Role.TEACHER, AuditAction.DELETE, AuditEntityType.SENTENCE, id, s.getTextEn(), null,
                    lesson.getTitle());
        }
        List<Sentence> created = new ArrayList<>();
        for (Draft d : remaining) {
            if (d.id() == null) {
                Sentence s = new Sentence();
                s.setLesson(lesson);
                apply(s, d);
                created.add(s);
                continue;
            }
            Sentence s = byId.get(d.id());
            Map<String, Object> diff = new LinkedHashMap<>();
            change(diff, "textEn", s.getTextEn(), d.textEn());
            change(diff, "ipaUs", s.getIpaUs(), d.ipaUs());
            change(diff, "ipaUk", s.getIpaUk(), d.ipaUk());
            change(diff, "textVi", s.getTextVi(), d.textVi());
            change(diff, "startMs", s.getStartMs(), d.startMs());
            change(diff, "endMs", s.getEndMs(), d.endMs());
            if (diff.isEmpty()) {
                continue;
            }
            apply(s, d);
            changed.add(s);
            audit(teacherId, Role.TEACHER, AuditAction.UPDATE, AuditEntityType.SENTENCE, s.getId(), d.textEn(), diff,
                    lesson.getTitle());
        }
        changed.addAll(created);
        if (!changed.isEmpty()) {
            sentences.saveAllAndFlush(changed);
            lessons.touch(lessonId);
        }
        for (Sentence s : created) {
            audit(teacherId, Role.TEACHER, AuditAction.CREATE, AuditEntityType.SENTENCE, s.getId(), s.getTextEn(),
                    null, lesson.getTitle());
        }
        return detailOf(lessonId);
    }

    private static void apply(Sentence s, Draft d) {
        s.setTextEn(d.textEn());
        s.setIpaUs(d.ipaUs());
        s.setIpaUk(d.ipaUk());
        s.setTextVi(d.textVi());
        s.setStartMs(d.startMs());
        s.setEndMs(d.endMs());
    }

    /**
     * Câu mới, hoặc câu đổi chữ tiếng Anh mà IPA để trống (trình duyệt xóa IPA cũ khi tách, gộp câu), được tạo lại IPA
     * bằng công cụ phiên âm, không tốn credit (BR-BH-14). Không tạo được thì để trống, giáo viên nhập tay.
     */
    private List<Draft> fillMissingIpa(List<Draft> drafts, Map<UUID, Sentence> byId) {
        List<Integer> targets = new ArrayList<>();
        for (int i = 0; i < drafts.size(); i++) {
            Draft d = drafts.get(i);
            Sentence old = d.id() == null ? null : byId.get(d.id());
            boolean textChanged = old == null || !Objects.equals(old.getTextEn(), d.textEn());
            if (d.ipaUs() == null && textChanged) {
                targets.add(i);
            }
        }
        if (targets.isEmpty()) {
            return drafts;
        }
        List<SentenceIpa> ipa = ipaGenerator.generate(targets.stream().map(i -> drafts.get(i).textEn()).toList());
        List<Draft> out = new ArrayList<>(drafts);
        for (int j = 0; j < targets.size(); j++) {
            int i = targets.get(j);
            out.set(i, out.get(i).withIpa(ipa.get(j)));
        }
        return out;
    }

    /**
     * Kiểm các câu còn lại theo BR-BH-09: câu tiếng Anh 1 đến 500 ký tự; IPA, bản dịch tối đa 500; mốc bắt đầu nhỏ hơn
     * mốc kết thúc, đoạn ít nhất 0,5 giây, không vượt độ dài video và không chồng lấn câu kề bên.
     */
    private static List<Map<String, Object>> validateSentences(List<Draft> drafts, int videoMs) {
        List<Map<String, Object>> errors = new ArrayList<>();
        for (Draft d : drafts) {
            if (d.textEn() == null || d.textEn().isEmpty()) {
                errors.add(error(d.key(), "textEn", "NotBlank"));
            } else if (tooLong(d.textEn())) {
                errors.add(error(d.key(), "textEn", "Size"));
            }
            if (tooLong(d.ipaUs())) {
                errors.add(error(d.key(), "ipaUs", "Size"));
            }
            if (tooLong(d.ipaUk())) {
                errors.add(error(d.key(), "ipaUk", "Size"));
            }
            if (tooLong(d.textVi())) {
                errors.add(error(d.key(), "textVi", "Size"));
            }
            if (d.startMs() == null || d.startMs() < 0) {
                errors.add(error(d.key(), "startMs", "NotNull"));
            }
            if (d.endMs() == null) {
                errors.add(error(d.key(), "endMs", "NotNull"));
            }
            if (d.startMs() != null && d.endMs() != null && d.startMs() >= 0) {
                if (d.startMs() >= d.endMs()) {
                    errors.add(error(d.key(), "endMs", "StartBeforeEnd"));
                } else if (d.endMs() - d.startMs() < MIN_SENTENCE_MS) {
                    errors.add(error(d.key(), "endMs", "MinDuration"));
                }
                if (d.endMs() > videoMs) {
                    errors.add(error(d.key(), "endMs", "ExceedsVideo"));
                }
            }
        }
        if (!errors.isEmpty()) {
            return errors;
        }
        List<Draft> ordered = drafts.stream().sorted(Comparator.comparing(Draft::startMs)).toList();
        for (int i = 1; i < ordered.size(); i++) {
            Draft prev = ordered.get(i - 1);
            Draft next = ordered.get(i);
            if (next.startMs() < prev.endMs()) {
                errors.add(error(prev.key(), "endMs", "Overlap"));
                errors.add(error(next.key(), "startMs", "Overlap"));
            }
        }
        return errors;
    }

    private static Map<String, Object> error(Object sentenceId, String field, String code) {
        return Map.of("sentenceId", sentenceId, "field", field, "code", code);
    }

    private static boolean tooLong(String text) {
        return text != null && text.codePointCount(0, text.length()) > TEXT_MAX;
    }

    // ------------------------------------------------------------------ xuất bản, gỡ xuất bản (UC-BH-06, 07)

    @Override
    @Transactional
    public void publish(UUID teacherId, UUID lessonId) {
        Lesson lesson = teacherLesson(lessons.lockById(lessonId), teacherId);
        if (lesson.getStatus() == LessonStatus.PUBLISHED) {
            throw new BusinessException(ErrorCode.LESSON_ALREADY_PUBLISHED);
        }
        List<Sentence> rows = sentences.findByLessonIdAndDeletedAtIsNullOrderByStartMsAsc(lessonId);
        List<Integer> missing = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            String vi = rows.get(i).getTextVi();
            if (vi == null || vi.isBlank()) {
                missing.add(i + 1);
            }
        }
        if (rows.isEmpty() || !missing.isEmpty()) {
            throw new BusinessException(ErrorCode.LESSON_NOT_PUBLISHABLE,
                    Map.of("noSentences", rows.isEmpty(), "missingTranslation", missing));
        }
        lesson.setStatus(LessonStatus.PUBLISHED);
        lesson.setUnpublishReason(null);
        if (lesson.getFirstPublishedAt() == null) {
            lesson.setFirstPublishedAt(clock.instant());
        }
        flushLesson(lesson);
        audit(teacherId, Role.TEACHER, AuditAction.PUBLISH, AuditEntityType.LESSON, lessonId, lesson.getTitle(),
                null, null);
    }

    @Override
    @Transactional
    public void unpublishByTeacher(UUID teacherId, UUID lessonId) {
        Lesson lesson = teacherLesson(lessons.lockById(lessonId), teacherId);
        if (lesson.getStatus() != LessonStatus.PUBLISHED) {
            throw new BusinessException(ErrorCode.LESSON_NOT_PUBLISHED);
        }
        lesson.setStatus(LessonStatus.DRAFT);
        lesson.setUnpublishReason(null);
        flushLesson(lesson);
        audit(teacherId, Role.TEACHER, AuditAction.UNPUBLISH, AuditEntityType.LESSON, lessonId, lesson.getTitle(),
                null, null);
    }

    @Override
    @Transactional
    public void unpublishByAdmin(UUID adminId, UUID lessonId, UnpublishLessonRequest request) {
        String reason = request == null || request.reason() == null ? "" : request.reason().strip();
        if (reason.isEmpty()) {
            throw new FieldValidationException("reason", "NotBlank");
        }
        if (reason.codePointCount(0, reason.length()) > REASON_MAX) {
            throw new FieldValidationException("reason", "Size");
        }
        Lesson lesson = libraryLesson(lessons.lockById(lessonId));
        if (lesson.getDeletedAt() != null || lesson.getStatus() != LessonStatus.PUBLISHED) {
            throw new BusinessException(ErrorCode.LESSON_NOT_PUBLISHED);
        }
        lesson.setStatus(LessonStatus.DRAFT);
        lesson.setUnpublishReason(reason);
        flushLesson(lesson);
        audit(adminId, Role.ADMIN, AuditAction.UNPUBLISH, AuditEntityType.LESSON, lessonId, lesson.getTitle(), null,
                reason);
    }

    // ------------------------------------------------------------------ xóa, khôi phục (UC-BH-08, 09)

    @Override
    @Transactional
    public void delete(UUID teacherId, UUID lessonId) {
        Lesson lesson = ownedLesson(lessons.lockById(lessonId), teacherId);
        if (lesson.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.LESSON_ALREADY_DELETED);
        }
        lesson.setDeletedAt(clock.instant());
        flushLesson(lesson);
        audit(teacherId, Role.TEACHER, AuditAction.DELETE, AuditEntityType.LESSON, lessonId, lesson.getTitle(), null,
                null);
    }

    @Override
    @Transactional
    public void restore(UUID teacherId, UUID lessonId, RestoreLessonRequest request) {
        Lesson lesson = ownedLesson(lessons.lockById(lessonId), teacherId);
        if (lesson.getDeletedAt() == null) {
            throw new BusinessException(ErrorCode.LESSON_NOT_DELETED);
        }
        if (lesson.getDeletedAt().isBefore(clock.instant().minus(DELETED_RETENTION))) {
            throw new BusinessException(ErrorCode.LESSON_RESTORE_EXPIRED);
        }
        String requested = request == null ? null : request.title();
        String title = requested == null || requested.isBlank() ? lesson.getTitle() : validTitle(requested);
        if (lessons.existsOtherActiveTitle(teacherId, title, lessonId)) {
            throw new BusinessException(ErrorCode.LESSON_TITLE_TAKEN);
        }
        if (lessons.findActiveByVideo(lesson.getYoutubeId()).filter(other -> !other.getId().equals(lessonId))
                .isPresent()) {
            throw new BusinessException(ErrorCode.LESSON_VIDEO_TAKEN);
        }
        Map<String, Object> diff = new LinkedHashMap<>();
        change(diff, "title", lesson.getTitle(), title);
        lesson.setTitle(title);
        lesson.setDeletedAt(null);
        lesson.setStatus(LessonStatus.DRAFT);
        lesson.setUnpublishReason(null);
        flushLesson(lesson);
        audit(teacherId, Role.TEACHER, AuditAction.RESTORE, AuditEntityType.LESSON, lessonId, title,
                diff.isEmpty() ? null : diff, null);
    }

    // ------------------------------------------------------------------ quyền (BR-BH-01, 02)

    /** Bài thư viện; bài cá nhân hoặc không tồn tại = không tìm thấy. */
    private static Lesson libraryLesson(Optional<Lesson> found) {
        return found.filter(l -> Lesson.KIND_LIBRARY.equals(l.getKind()))
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
    }

    /** Bài thư viện của chính giáo viên, kể cả đã xóa. */
    private static Lesson ownedLesson(Optional<Lesson> found, UUID teacherId) {
        Lesson lesson = libraryLesson(found);
        if (!teacherId.equals(lesson.getOwnerId())) {
            throw new ForbiddenException("Bạn không có quyền với bài học này");
        }
        return lesson;
    }

    /** Như {@link #ownedLesson} nhưng bài đã xóa = không tìm thấy (luồng 1b của UC-BH-04 đến 07). */
    private static Lesson teacherLesson(Optional<Lesson> found, UUID teacherId) {
        Lesson lesson = ownedLesson(found, teacherId);
        if (lesson.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.LESSON_NOT_FOUND);
        }
        return lesson;
    }

    // ------------------------------------------------------------------ tiện ích

    private void flushLesson(Lesson lesson) {
        try {
            lessons.saveAndFlush(lesson);
        } catch (DataIntegrityViolationException ex) {
            String message = ex.getMostSpecificCause().getMessage();
            if (message != null && message.contains(UNIQUE_TITLE_INDEX)) {
                throw new BusinessException(ErrorCode.LESSON_TITLE_TAKEN);
            }
            if (message != null && message.contains(UNIQUE_VIDEO_INDEX)) {
                throw new BusinessException(ErrorCode.LESSON_VIDEO_TAKEN);
            }
            throw ex;
        }
    }

    private void audit(UUID actorId, Role role, AuditAction action, AuditEntityType type, UUID entityId,
            String entityName, Map<String, Object> diff, String note) {
        String actorName = users.findById(actorId).map(UserAccountView::displayName).orElse(null);
        auditService.record(new AuditEntryRequest(actorId, actorName, role, action, type, entityId, entityName, diff,
                note));
    }

    /** Ghi {@code {"old":..,"new":..}} vào {@code diff} khi giá trị đổi. */
    private static void change(Map<String, Object> diff, String field, Object oldValue, Object newValue) {
        if (!Objects.equals(oldValue, newValue)) {
            Map<String, Object> pair = new LinkedHashMap<>();
            pair.put("old", oldValue);
            pair.put("new", newValue);
            diff.put(field, pair);
        }
    }

    /** Tiêu đề sau khi cắt khoảng trắng hai đầu: bắt buộc, tối đa 100 ký tự (BR-BH-08). */
    static String validTitle(String raw) {
        String title = raw == null ? "" : raw.strip();
        if (title.isEmpty()) {
            throw new FieldValidationException("title", "NotBlank");
        }
        if (title.codePointCount(0, title.length()) > TITLE_MAX) {
            throw new FieldValidationException("title", "Size");
        }
        return title;
    }

    private static String strip(String text) {
        return text == null ? null : text.strip();
    }

    private static String blankToNull(String text) {
        return text == null || text.isBlank() ? null : text.strip();
    }

    private LessonManageView.Detail detailOf(UUID lessonId) {
        LessonManageRow r = manageRepository.findDetail(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        List<Sentence> rows = sentences.findByLessonIdAndDeletedAtIsNullOrderByStartMsAsc(lessonId);
        List<LessonManageView.Sentence> items = new ArrayList<>(rows.size());
        for (int i = 0; i < rows.size(); i++) {
            Sentence s = rows.get(i);
            items.add(new LessonManageView.Sentence(s.getId(), i + 1, s.getStartMs(), s.getEndMs(), s.getTextEn(),
                    s.getIpaUs(), s.getIpaUk(), s.getTextVi()));
        }
        return new LessonManageView.Detail(r.getId(), r.getTitle(), r.getYoutubeId(), youtubeUrl(r.getYoutubeId()),
                thumbnailUrl(r.getYoutubeId()), r.getDurationSec(), r.getTopicId(), r.getTopicName(),
                r.getCefrLevel(), r.getPro(), r.getStatus(), rows.size(), r.getCreatedAt(), r.getUpdatedAt(),
                r.getUnpublishReason(), r.getOwnerId(), r.getOwnerName(), r.getEverPublished(), items);
    }

    private static LessonManageView.Item toItem(LessonManageRow r) {
        return new LessonManageView.Item(r.getId(), r.getTitle(), r.getYoutubeId(), thumbnailUrl(r.getYoutubeId()),
                r.getTopicId(), r.getTopicName(), r.getCefrLevel(), r.getPro(), r.getStatus(), r.getSentenceCount(),
                r.getUpdatedAt(), r.getDeletedAt(), r.getUnpublishReason(), r.getOwnerId(), r.getOwnerName());
    }

    static String youtubeUrl(String videoId) {
        return "https://www.youtube.com/watch?v=" + videoId;
    }

    static String thumbnailUrl(String videoId) {
        return "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg";
    }

    private static long offsetOf(int page) {
        return (long) Math.max(page, 0) * PAGE_SIZE;
    }

    private static <T> PageResponse<T> pageOf(List<LessonManageRow> rows, Function<LessonManageRow, T> mapper,
            int page, long total) {
        int totalPages = (int) ((total + PAGE_SIZE - 1) / PAGE_SIZE);
        return new PageResponse<>(rows.stream().map(mapper).toList(), page, PAGE_SIZE, total, totalPages);
    }
}
