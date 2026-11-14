package com.lingualoop.backend.vocab.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ConflictException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.common.exception.ForbiddenException;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.storage.service.FileStorageService;
import com.lingualoop.backend.storage.service.UploadPurpose;
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.CreateDeckRequest;
import com.lingualoop.backend.vocab.dto.request.DeckListQuery;
import com.lingualoop.backend.vocab.dto.request.DeckStatusFilter;
import com.lingualoop.backend.vocab.dto.request.RestoreDeckRequest;
import com.lingualoop.backend.vocab.dto.request.UnpublishDeckRequest;
import com.lingualoop.backend.vocab.dto.request.UpdateDeckRequest;
import com.lingualoop.backend.vocab.entity.VocabDeck;
import com.lingualoop.backend.vocab.repository.VocabDeckManageRepository;
import com.lingualoop.backend.vocab.repository.VocabDeckManageRepository.DeckManageRow;
import com.lingualoop.backend.vocab.repository.VocabDeckManageRepository.DeckStateRow;
import com.lingualoop.backend.vocab.repository.VocabDeckRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
class VocabDeckManageServiceImpl implements VocabDeckManageService {

    static final int PAGE_SIZE = 10;
    static final int NAME_MAX = 100;
    static final int CARD_PAGE_SIZE = 20;
    static final int REASON_MAX = 500;
    static final Duration DELETED_RETENTION = Duration.ofDays(30);
    static final String DUPLICATE_NAME = "Bạn đã có bộ thẻ cùng tên";

    /** Chỉ mục duy nhất của tên bộ trong V1; vi phạm khi hai yêu cầu cùng tên lọt qua bước kiểm tra (AC-BT-68). */
    private static final String UNIQUE_NAME_INDEX = "uq_vocab_decks_name";

    private final VocabDeckManageRepository repository;
    private final VocabDeckRepository deckRepository;
    private final DeckImageValidator imageValidator;
    private final FileStorageService storage;
    private final DeckImageUrls images;
    private final CardAudioUrls audio;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DeckManageView.Item> listForTeacher(UUID teacherId, DeckListQuery query, int page) {
        Instant deletedSince = clock.instant().minus(DELETED_RETENTION);
        String status = query.status().sqlValue();
        String pattern = VocabDeckManageRepository.containsPattern(query.q());
        List<DeckManageRow> rows = repository.findTeacherDecks(teacherId, status, deletedSince, pattern,
                query.categoryId(), query.other(), query.pro(), PAGE_SIZE, offsetOf(page));
        long total = repository.countTeacherDecks(teacherId, status, deletedSince, pattern, query.categoryId(),
                query.other(), query.pro());
        return pageOf(rows, this::toItem, page, total);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DeckManageView.AdminItem> listForAdmin(DeckListQuery query, int page) {
        if (query.status() == DeckStatusFilter.DRAFT || query.status() == DeckStatusFilter.DELETED) {
            throw new ForbiddenException("Quản trị viên chỉ xem được bộ thẻ Đã xuất bản");
        }
        String pattern = VocabDeckManageRepository.containsPattern(query.q());
        List<DeckManageRow> rows = repository.findAdminDecks(query.ownerId(), query.system(), pattern,
                query.categoryId(), query.other(), query.pro(), PAGE_SIZE, offsetOf(page));
        long total = repository.countAdminDecks(query.ownerId(), query.system(), pattern, query.categoryId(),
                query.other(), query.pro());
        return pageOf(rows, this::toAdminItem, page, total);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckManageView.Category> listCategories() {
        return repository.findCategories().stream()
                .map(c -> new DeckManageView.Category(c.getId(), c.getName()))
                .toList();
    }

    /**
     * Không bọc trong một transaction: mỗi lệnh ghi tự commit, nên khi hai yêu cầu cùng tên chạy đồng thời, yêu cầu sau
     * nhận lỗi chỉ mục duy nhất ngay tại {@code saveAndFlush} và được đổi thành lỗi trùng tên (409). Mọi lỗi đều bỏ ảnh
     * client vừa tải lên (AC-BT-13); lần gửi lại frontend tải ảnh mới.
     */
    @Override
    public DeckManageView.Item createDeck(UUID teacherId, CreateDeckRequest request) {
        String imageKey = request.imageKey();
        try {
            String name = validName(request.name());
            String categoryName = request.categoryId() == null ? null
                    : repository.findCategoryName(request.categoryId())
                            .orElseThrow(() -> new FieldValidationException("categoryId", "Exists"));
            if (repository.existsActiveName(teacherId, name)) {
                throw new ConflictException(DUPLICATE_NAME);
            }
            if (imageKey != null) {
                verifyImage(teacherId, imageKey);
            }
            VocabDeck saved = saveDraft(VocabDeck.newDraft(teacherId, name, request.categoryId(), imageKey,
                    request.pro()));
            return new DeckManageView.Item(saved.getId(), saved.getName(), images.resolve(saved.getImageUrl()),
                    saved.getCategoryId(), categoryName, 0, 0, saved.isPro(), saved.getStatus(), saved.getUpdatedAt(),
                    null, null);
        } catch (RuntimeException ex) {
            if (imageKey != null) {
                storage.discardUpload(teacherId, UploadPurpose.DECK_IMAGE, imageKey);
            }
            throw ex;
        }
    }

    // ------------------------------------------------------------------ xem chi tiết (UC-BT-04)

    @Override
    @Transactional(readOnly = true)
    public DeckManageView.Detail getForTeacher(UUID teacherId, UUID deckId) {
        teacherDeck(repository.findState(deckId), teacherId);
        return detailOf(deckId);
    }

    @Override
    @Transactional(readOnly = true)
    public DeckManageView.Detail getForAdmin(UUID deckId) {
        adminViewableDeck(deckId);
        return detailOf(deckId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DeckManageView.Card> listCardsForTeacher(UUID teacherId, UUID deckId, UUID groupId, String q,
            int page) {
        teacherDeck(repository.findState(deckId), teacherId);
        return cardsOf(deckId, groupId, q, page);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DeckManageView.Card> listCardsForAdmin(UUID deckId, UUID groupId, String q, int page) {
        adminViewableDeck(deckId);
        return cardsOf(deckId, groupId, q, page);
    }

    // ------------------------------------------------------------------ sửa (UC-BT-03)

    /**
     * Không bọc trong transaction vì có gọi S3, giống {@link #createDeck}: lệnh UPDATE tự commit, trùng tên đồng thời
     * được đổi thành 409. Ảnh mới chỉ bị bỏ khi chưa lưu được; ảnh cũ chỉ bị bỏ sau khi đã lưu.
     */
    @Override
    public DeckManageView.Detail updateDeck(UUID teacherId, UUID deckId, UpdateDeckRequest request) {
        String newKey = request.imageKey();
        String oldImage;
        String image;
        boolean saved = false;
        try {
            DeckStateRow deck = teacherDeck(repository.findState(deckId), teacherId);
            String name = validName(request.name());
            if (request.categoryId() != null && repository.findCategoryName(request.categoryId()).isEmpty()) {
                throw new FieldValidationException("categoryId", "Exists");
            }
            if (repository.existsOtherActiveName(teacherId, name, deckId)) {
                throw new ConflictException(DUPLICATE_NAME);
            }
            if (newKey != null) {
                verifyImage(teacherId, newKey);
            }
            oldImage = deck.getImageUrl();
            image = newKey != null ? newKey : (request.removeImage() ? null : oldImage);
            int updated = saveInfo(deckId, name, request.categoryId(), image, request.pro());
            if (updated == 0) {
                throw new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND);
            }
            saved = true;
        } catch (RuntimeException ex) {
            if (newKey != null && !saved) {
                storage.discardUpload(teacherId, UploadPurpose.DECK_IMAGE, newKey);
            }
            throw ex;
        }
        if (oldImage != null && !oldImage.equals(image)) {
            dropOldImage(teacherId, oldImage);
        }
        return detailOf(deckId);
    }

    private int saveInfo(UUID deckId, String name, UUID categoryId, String image, boolean pro) {
        try {
            return repository.updateInfo(deckId, name, categoryId, image, pro, clock.instant());
        } catch (DataIntegrityViolationException ex) {
            if (isDuplicateName(ex)) {
                throw new ConflictException(DUPLICATE_NAME);
            }
            throw ex;
        }
    }

    /** Ảnh cũ của giáo viên trên S3; key ngoài thư mục của giáo viên (vd URL đầy đủ của dữ liệu mẫu) được giữ nguyên. */
    private void dropOldImage(UUID teacherId, String oldImage) {
        try {
            storage.discardUpload(teacherId, UploadPurpose.DECK_IMAGE, oldImage);
        } catch (RuntimeException ex) {
            log.warn("Không xóa được ảnh cũ của bộ thẻ: {}", oldImage, ex);
        }
    }

    // ------------------------------------------------------------------ xuất bản, gỡ xuất bản (UC-BT-05, 06)

    @Override
    @Transactional
    public void publish(UUID teacherId, UUID deckId) {
        DeckStateRow deck = teacherDeck(repository.lockState(deckId), teacherId);
        if (VocabDeck.STATUS_PUBLISHED.equals(deck.getStatus())) {
            throw new BusinessException(ErrorCode.VOCAB_DECK_ALREADY_PUBLISHED);
        }
        boolean noGroups = repository.countGroups(deckId) == 0;
        List<String> emptyGroups = repository.findEmptyGroupNames(deckId);
        if (noGroups || !emptyGroups.isEmpty()) {
            throw new BusinessException(ErrorCode.VOCAB_DECK_NOT_PUBLISHABLE,
                    Map.of("noGroups", noGroups, "emptyGroups", emptyGroups));
        }
        repository.updateStatus(deckId, VocabDeck.STATUS_PUBLISHED, null);
    }

    @Override
    @Transactional
    public void unpublishByTeacher(UUID teacherId, UUID deckId) {
        DeckStateRow deck = teacherDeck(repository.lockState(deckId), teacherId);
        requirePublished(deck);
        repository.updateStatus(deckId, VocabDeck.STATUS_DRAFT, null);
    }

    @Override
    @Transactional
    public void unpublishByAdmin(UUID deckId, UnpublishDeckRequest request) {
        String reason = request == null || request.reason() == null ? "" : request.reason().strip();
        if (reason.isEmpty()) {
            throw new FieldValidationException("reason", "NotBlank");
        }
        if (reason.codePointCount(0, reason.length()) > REASON_MAX) {
            throw new FieldValidationException("reason", "Size");
        }
        DeckStateRow deck = repository.lockState(deckId)
                .filter(d -> VocabDeck.KIND_LIBRARY.equals(d.getKind()) && d.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND));
        requirePublished(deck);
        repository.updateStatus(deckId, VocabDeck.STATUS_DRAFT, reason);
    }

    private static void requirePublished(DeckStateRow deck) {
        if (!VocabDeck.STATUS_PUBLISHED.equals(deck.getStatus())) {
            throw new BusinessException(ErrorCode.VOCAB_DECK_NOT_PUBLISHED);
        }
    }

    // ------------------------------------------------------------------ xóa, khôi phục (UC-BT-07, 08)

    @Override
    @Transactional
    public void deleteDeck(UUID teacherId, UUID deckId) {
        teacherDeck(repository.lockState(deckId), teacherId);
        repository.softDelete(deckId, clock.instant());
    }

    @Override
    @Transactional
    public void restoreDeck(UUID teacherId, UUID deckId, RestoreDeckRequest request) {
        DeckStateRow deck = ownedDeck(repository.lockState(deckId), teacherId);
        if (deck.getDeletedAt() == null) {
            throw new BusinessException(ErrorCode.VOCAB_DECK_NOT_DELETED);
        }
        Instant now = clock.instant();
        if (deck.getDeletedAt().isBefore(now.minus(DELETED_RETENTION))) {
            throw new BusinessException(ErrorCode.VOCAB_DECK_RESTORE_EXPIRED);
        }
        String requested = request == null ? null : request.name();
        String name = requested == null || requested.isBlank() ? deck.getName() : validName(requested);
        if (repository.existsOtherActiveName(teacherId, name, deckId)) {
            throw new BusinessException(ErrorCode.VOCAB_DECK_NAME_TAKEN);
        }
        try {
            repository.restore(deckId, name, now);
        } catch (DataIntegrityViolationException ex) {
            if (isDuplicateName(ex)) {
                throw new BusinessException(ErrorCode.VOCAB_DECK_NAME_TAKEN);
            }
            throw ex;
        }
    }

    // ------------------------------------------------------------------ quyền (BR-BT-01)

    /** Bộ thư viện của chính giáo viên, kể cả đã xóa; bộ khác loại hoặc không tồn tại = không tìm thấy. */
    private static DeckStateRow ownedDeck(Optional<DeckStateRow> found, UUID teacherId) {
        DeckStateRow deck = found.filter(d -> VocabDeck.KIND_LIBRARY.equals(d.getKind()))
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND));
        if (!teacherId.equals(deck.getOwnerId())) {
            throw new ForbiddenException("Bạn không có quyền với bộ thẻ này");
        }
        return deck;
    }

    /** Như {@link #ownedDeck} nhưng bộ đã xóa = không tìm thấy (UC-BT-03, 04, 05, 06, 07 luồng 1b). */
    private static DeckStateRow teacherDeck(Optional<DeckStateRow> found, UUID teacherId) {
        DeckStateRow deck = ownedDeck(found, teacherId);
        if (deck.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND);
        }
        return deck;
    }

    /** Quản trị viên chỉ xem bộ thư viện Đã xuất bản chưa xóa (BR-BT-01, AC-BT-52). */
    private void adminViewableDeck(UUID deckId) {
        DeckStateRow deck = repository.findState(deckId)
                .filter(d -> VocabDeck.KIND_LIBRARY.equals(d.getKind()) && d.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND));
        if (!VocabDeck.STATUS_PUBLISHED.equals(deck.getStatus())) {
            throw new ForbiddenException("Quản trị viên chỉ xem được bộ thẻ Đã xuất bản");
        }
    }

    private DeckManageView.Detail detailOf(UUID deckId) {
        DeckManageRow r = repository.findDetail(deckId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND));
        List<DeckManageView.Group> groups = repository.findGroups(deckId).stream()
                .map(g -> new DeckManageView.Group(g.getId(), g.getName(), g.getCardCount()))
                .toList();
        return new DeckManageView.Detail(r.getId(), r.getName(), images.resolve(r.getImageUrl()), r.getCategoryId(),
                r.getCategoryName(), r.getPro(), r.getStatus(), r.getUpdatedAt(), r.getOwnerId(), r.getOwnerName(),
                r.getUnpublishReason(), r.getCardCount(), groups);
    }

    private PageResponse<DeckManageView.Card> cardsOf(UUID deckId, UUID groupId, String q, int page) {
        if (!repository.existsGroup(deckId, groupId)) {
            throw new BusinessException(ErrorCode.VOCAB_GROUP_NOT_FOUND);
        }
        String pattern = VocabDeckManageRepository.containsPattern(q);
        int safePage = Math.max(page, 0);
        List<DeckManageView.Card> cards = repository.findCards(deckId, groupId, pattern, CARD_PAGE_SIZE,
                (long) safePage * CARD_PAGE_SIZE).stream()
                .map(c -> new DeckManageView.Card(c.getId(), c.getWord(), c.getPos(), c.getIpaUk(), c.getIpaUs(),
                        c.getMeaningVi(), c.getDefinitionEn(), c.getDefinitionVi(), c.getExampleEn(),
                        c.getExampleVi(), images.resolve(c.getImageUrl()), audio.resolve(c.getAudioUk()),
                        audio.resolve(c.getAudioUs())))
                .toList();
        long total = repository.countCards(deckId, groupId, pattern);
        int totalPages = (int) ((total + CARD_PAGE_SIZE - 1) / CARD_PAGE_SIZE);
        return new PageResponse<>(cards, safePage, CARD_PAGE_SIZE, total, totalPages);
    }

    /**
     * Ảnh phải nằm trong thư mục của giáo viên, đúng loại và dung lượng (kiểm trên S3), và nội dung thật là JPG/PNG theo
     * chữ ký đầu tệp (BR-BT-13). Tệp sai loại báo trên trường {@code image}.
     */
    private void verifyImage(UUID teacherId, String imageKey) {
        try {
            storage.confirmUpload(teacherId, UploadPurpose.DECK_IMAGE, imageKey);
        } catch (BusinessException ex) {
            if (ex.getErrorCode() == ErrorCode.STORAGE_FILE_INVALID) {
                throw new FieldValidationException(DeckImageValidator.FIELD, DeckImageValidator.CODE_TYPE);
            }
            throw ex;
        }
        imageValidator.validate(storage.readHead(imageKey, DeckImageValidator.HEAD_BYTES));
    }

    private VocabDeck saveDraft(VocabDeck deck) {
        try {
            return deckRepository.saveAndFlush(deck);
        } catch (DataIntegrityViolationException ex) {
            if (isDuplicateName(ex)) {
                throw new ConflictException(DUPLICATE_NAME);
            }
            throw ex;
        }
    }

    /** Tên sau khi cắt khoảng trắng hai đầu: bắt buộc, tối đa 100 ký tự (BR-BT-03). */
    private static String validName(String raw) {
        String name = raw == null ? "" : raw.strip();
        if (name.isEmpty()) {
            throw new FieldValidationException("name", "NotBlank");
        }
        if (name.codePointCount(0, name.length()) > NAME_MAX) {
            throw new FieldValidationException("name", "Size");
        }
        return name;
    }

    private static boolean isDuplicateName(DataIntegrityViolationException ex) {
        String message = ex.getMostSpecificCause().getMessage();
        return message != null && message.contains(UNIQUE_NAME_INDEX);
    }

    private static long offsetOf(int page) {
        return (long) Math.max(page, 0) * PAGE_SIZE;
    }

    private static <T> PageResponse<T> pageOf(List<DeckManageRow> rows, Function<DeckManageRow, T> mapper, int page,
            long total) {
        int totalPages = (int) ((total + PAGE_SIZE - 1) / PAGE_SIZE);
        return new PageResponse<>(rows.stream().map(mapper).toList(), page, PAGE_SIZE, total, totalPages);
    }

    private DeckManageView.Item toItem(DeckManageRow r) {
        return new DeckManageView.Item(r.getId(), r.getName(), images.resolve(r.getImageUrl()), r.getCategoryId(),
                r.getCategoryName(), r.getGroupCount(), r.getCardCount(), r.getPro(), r.getStatus(), r.getUpdatedAt(),
                r.getDeletedAt(), r.getUnpublishReason());
    }

    private DeckManageView.AdminItem toAdminItem(DeckManageRow r) {
        return new DeckManageView.AdminItem(r.getId(), r.getName(), images.resolve(r.getImageUrl()), r.getCategoryId(),
                r.getCategoryName(), r.getGroupCount(), r.getCardCount(), r.getPro(), r.getStatus(), r.getUpdatedAt(),
                r.getOwnerId(), r.getOwnerName());
    }
}
