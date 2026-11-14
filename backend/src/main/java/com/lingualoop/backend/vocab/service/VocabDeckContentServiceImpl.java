package com.lingualoop.backend.vocab.service;

import java.time.Clock;
import java.time.Instant;
import java.text.Normalizer;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.ForbiddenException;
import com.lingualoop.backend.vocab.dto.CardImagesView;
import com.lingualoop.backend.vocab.dto.CardImportView;
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.AttachCardImagesRequest;
import com.lingualoop.backend.vocab.dto.request.CardRequest;
import com.lingualoop.backend.vocab.dto.request.GroupRequest;
import com.lingualoop.backend.vocab.entity.VocabDeck;
import com.lingualoop.backend.dictionary.service.DictionaryQueryService;
import com.lingualoop.backend.vocab.repository.VocabDeckContentRepository;
import com.lingualoop.backend.vocab.repository.VocabDeckContentRepository.CardAudio;
import com.lingualoop.backend.vocab.repository.VocabDeckContentRepository.CardImageRow;
import com.lingualoop.backend.vocab.repository.VocabDeckManageRepository;
import com.lingualoop.backend.vocab.repository.VocabDeckManageRepository.DeckStateRow;
import com.lingualoop.backend.vocab.service.CardSheetReader.Column;
import com.lingualoop.backend.vocab.service.CardSheetReader.SheetRow;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;

/**
 * Mọi lệnh ghi khóa dòng bộ ({@code FOR UPDATE}) trước khi kiểm, nên hai yêu cầu trên cùng một bộ chạy lần lượt: kiểm
 * trùng tên nhóm, trùng từ và điều kiện xuất bản (BR-NT-05) không bị chen ngang.
 */
@Service
@RequiredArgsConstructor
class VocabDeckContentServiceImpl implements VocabDeckContentService {

    static final int IMPORT_MAX_ROWS = 500;
    static final long IMPORT_MAX_BYTES = 2L * 1024 * 1024;

    static final String REASON_EMPTY_GROUP = "EMPTY_GROUP";
    static final String REASON_LAST_GROUP = "LAST_GROUP";
    static final String REASON_LAST_CARD = "LAST_CARD";
    static final String CODE_DUPLICATE_IN_DECK = "DuplicateInDeck";
    static final String CODE_DUPLICATE_IN_FILE = "DuplicateInFile";

    private final VocabDeckManageRepository decks;
    private final VocabDeckContentRepository repository;
    private final CardSheetReader reader;
    private final CardImportTemplate template;
    private final Validator validator;
    private final DictionaryQueryService dictionary;
    private final CardImages images;
    private final CardAudioUrls audio;
    private final Clock clock;

    // ------------------------------------------------------------------ nhóm thẻ (UC-NT-01, 02, 03)

    @Override
    @Transactional
    public DeckManageView.Group addGroup(UUID teacherId, UUID deckId, GroupRequest request) {
        DeckStateRow deck = lockTeacherDeck(teacherId, deckId);
        if (isPublished(deck)) {
            throw mustStayPublishable(REASON_EMPTY_GROUP);
        }
        if (repository.existsGroupName(deckId, request.name(), null)) {
            throw new BusinessException(ErrorCode.VOCAB_GROUP_NAME_TAKEN);
        }
        Instant now = now();
        UUID id = repository.insertGroup(deckId, request.name(), now);
        repository.touchDeck(deckId, now);
        return new DeckManageView.Group(id, request.name(), 0);
    }

    @Override
    @Transactional
    public DeckManageView.Group renameGroup(UUID teacherId, UUID deckId, UUID groupId, GroupRequest request) {
        lockTeacherDeck(teacherId, deckId);
        DeckManageView.Group group = group(deckId, groupId);
        if (repository.existsGroupName(deckId, request.name(), groupId)) {
            throw new BusinessException(ErrorCode.VOCAB_GROUP_NAME_TAKEN);
        }
        Instant now = now();
        repository.renameGroup(groupId, request.name(), now);
        repository.touchDeck(deckId, now);
        return new DeckManageView.Group(groupId, request.name(), group.cardCount());
    }

    @Override
    @Transactional
    public void deleteGroup(UUID teacherId, UUID deckId, UUID groupId) {
        DeckStateRow deck = lockTeacherDeck(teacherId, deckId);
        group(deckId, groupId);
        if (isPublished(deck) && decks.countGroups(deckId) <= 1) {
            throw mustStayPublishable(REASON_LAST_GROUP);
        }
        Instant now = now();
        repository.softDeleteGroup(groupId, now);
        repository.touchDeck(deckId, now);
    }

    // ------------------------------------------------------------------ thẻ (UC-NT-04, 05, 06)

    @Override
    @Transactional
    public DeckManageView.Card addCard(UUID teacherId, UUID deckId, UUID groupId, CardRequest request) {
        images.discardOnRollback(teacherId, request.imageKey());
        lockTeacherDeck(teacherId, deckId);
        group(deckId, groupId);
        requireWordFree(deckId, request.word(), null);
        if (request.imageKey() != null) {
            images.verify(teacherId, request.imageKey());
        }
        Instant now = now();
        UUID id = repository.insertCard(deckId, groupId, request, audioOf(request), request.imageKey(), now);
        repository.touchDeck(deckId, now);
        return card(deckId, groupId, id);
    }

    @Override
    @Transactional
    public DeckManageView.Card updateCard(UUID teacherId, UUID deckId, UUID groupId, UUID cardId,
            CardRequest request) {
        images.discardOnRollback(teacherId, request.imageKey());
        lockTeacherDeck(teacherId, deckId);
        String oldImage = repository.findCard(deckId, groupId, cardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_CARD_NOT_FOUND)).imageUrl();
        requireWordFree(deckId, request.word(), cardId);
        if (request.imageKey() != null) {
            images.verify(teacherId, request.imageKey());
        }
        String image = request.imageKey() != null ? request.imageKey()
                : (Boolean.TRUE.equals(request.removeImage()) ? null : oldImage);
        Instant now = now();
        repository.updateCard(cardId, request, audioOf(request), image, now);
        repository.touchDeck(deckId, now);
        if (oldImage != null && !oldImage.equals(image)) {
            images.discardAfterCommit(teacherId, oldImage);
        }
        return card(deckId, groupId, cardId);
    }

    @Override
    @Transactional
    public void deleteCard(UUID teacherId, UUID deckId, UUID groupId, UUID cardId) {
        DeckStateRow deck = lockTeacherDeck(teacherId, deckId);
        card(deckId, groupId, cardId);
        if (isPublished(deck) && group(deckId, groupId).cardCount() <= 1) {
            throw mustStayPublishable(REASON_LAST_CARD);
        }
        Instant now = now();
        repository.softDeleteCard(cardId, now);
        repository.touchDeck(deckId, now);
    }

    /**
     * Âm thanh của thẻ chép từ từ điển theo từ vựng và loại từ, tính lại mỗi lần lưu vì từ hoặc loại từ có thể vừa đổi
     * (BR-NT-08). Từ không có trong từ điển thì không có âm thanh; học viên nghe giọng đọc của trình duyệt.
     */
    private CardAudio audioOf(CardRequest card) {
        return dictionary.findAudio(card.word(), card.pos())
                .map(a -> new CardAudio(a.audioUk(), a.audioUs()))
                .orElse(CardAudio.NONE);
    }

    private void requireWordFree(UUID deckId, String word, UUID excludeCardId) {
        Optional<VocabDeckContentRepository.WordOwner> owner = repository.findCardWithWord(deckId, word,
                excludeCardId);
        if (owner.isPresent()) {
            VocabDeckContentRepository.WordOwner o = owner.get();
            throw new BusinessException(ErrorCode.VOCAB_CARD_WORD_TAKEN, Map.of("cardId", o.cardId(),
                    "groupId", o.groupId(), "groupName", o.groupName(), "word", o.word()));
        }
    }

    // ------------------------------------------------------------------ gắn ảnh hàng loạt (UC-NT-08)

    /**
     * Ghép từng ảnh với thẻ của nhóm theo tên tệp (BR-NT-09). Ảnh không khớp, trùng thẻ với ảnh trước trong cùng lần gửi
     * hoặc không phải JPG/PNG thật bị bỏ khỏi kho tệp và báo lại theo tên tệp; ảnh hợp lệ thay ảnh cũ của thẻ.
     */
    @Override
    @Transactional
    public CardImagesView.Result attachImages(UUID teacherId, UUID deckId, UUID groupId,
            AttachCardImagesRequest request) {
        request.items().forEach(item -> images.discardOnRollback(teacherId, item.imageKey()));
        lockTeacherDeck(teacherId, deckId);
        group(deckId, groupId);
        Map<String, CardImageRow> byWord = new HashMap<>();
        for (CardImageRow row : repository.findGroupCardImages(groupId)) {
            byWord.putIfAbsent(matchKey(row.word()), row);
        }
        Set<UUID> done = new HashSet<>();
        List<CardImagesView.Attached> attached = new ArrayList<>();
        List<String> unmatched = new ArrayList<>();
        List<String> duplicated = new ArrayList<>();
        List<String> invalid = new ArrayList<>();
        Instant now = now();
        for (AttachCardImagesRequest.Item item : request.items()) {
            CardImageRow card = byWord.get(matchKey(baseName(item.fileName())));
            List<String> rejectedAs = card == null ? unmatched : (done.contains(card.id()) ? duplicated : null);
            if (rejectedAs == null && !verified(teacherId, item.imageKey())) {
                rejectedAs = invalid;
            }
            if (rejectedAs != null) {
                rejectedAs.add(item.fileName());
                images.discard(teacherId, item.imageKey());
                continue;
            }
            repository.setCardImage(card.id(), item.imageKey(), now);
            if (card.imageUrl() != null && !card.imageUrl().equals(item.imageKey())) {
                images.discardAfterCommit(teacherId, card.imageUrl());
            }
            done.add(card.id());
            attached.add(new CardImagesView.Attached(card.id(), card.word(), item.fileName()));
        }
        if (!attached.isEmpty()) {
            repository.touchDeck(deckId, now);
        }
        return new CardImagesView.Result(attached, unmatched, duplicated, invalid);
    }

    private boolean verified(UUID teacherId, String key) {
        try {
            images.verify(teacherId, key);
            return true;
        } catch (BusinessException ex) {
            return false;
        }
    }

    /** Tên tệp bỏ thư mục và đuôi: {@code "C:\\anh\\sustain.jpg"} thành {@code "sustain"}. */
    static String baseName(String fileName) {
        String name = fileName.substring(Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\')) + 1);
        int dot = name.lastIndexOf('.');
        return dot > 0 ? name.substring(0, dot) : name;
    }

    /**
     * Khóa so khớp tên tệp với từ vựng: không phân biệt hoa thường, dấu gạch dưới và gạch nối coi như khoảng trắng,
     * khoảng trắng thừa bị bỏ ({@code "Phrasal_Verb"} khớp {@code "phrasal verb"}).
     */
    static String matchKey(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFC).replaceAll("[_\\-]+", " ").strip()
                .replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    // ------------------------------------------------------------------ nhập từ tệp (UC-NT-07)

    @Override
    @Transactional(readOnly = true)
    public CardImportView.Preview previewImport(UUID teacherId, UUID deckId, UUID groupId, String filename,
            byte[] content) {
        teacherDeck(decks.findState(deckId), teacherId);
        group(deckId, groupId);
        return new CardImportView.Preview(parseCards(deckId, filename, content).size());
    }

    @Override
    @Transactional
    public CardImportView.Result importCards(UUID teacherId, UUID deckId, UUID groupId, String filename,
            byte[] content) {
        lockTeacherDeck(teacherId, deckId);
        group(deckId, groupId);
        List<CardRequest> cards = parseCards(deckId, filename, content);
        Instant start = now();
        for (int i = 0; i < cards.size(); i++) {
            // thời điểm tạo tăng dần 1 micro giây để thẻ giữ đúng thứ tự dòng trong tệp (BR-NT-07)
            CardRequest card = cards.get(i);
            repository.insertCard(deckId, groupId, card, audioOf(card), null, start.plus(i, ChronoUnit.MICROS));
        }
        repository.touchDeck(deckId, start);
        return new CardImportView.Result(cards.size());
    }

    @Override
    public byte[] importTemplate(TemplateFormat format) {
        return format == TemplateFormat.CSV ? template.csv() : template.xlsx();
    }

    /** Đọc tệp, kiểm từng dòng theo BR-NT-03 và trùng từ (trong tệp và với bộ); có lỗi thì báo mọi dòng lỗi. */
    private List<CardRequest> parseCards(UUID deckId, String filename, byte[] content) {
        if (content.length > IMPORT_MAX_BYTES) {
            throw new BusinessException(ErrorCode.VOCAB_IMPORT_FILE_INVALID, Map.of("reason", "TOO_LARGE"));
        }
        List<SheetRow> rows = reader.read(filename, content);
        if (rows.size() > IMPORT_MAX_ROWS) {
            throw new BusinessException(ErrorCode.VOCAB_IMPORT_TOO_MANY_ROWS, Map.of("max", IMPORT_MAX_ROWS));
        }
        Set<String> deckWords = repository.findActiveWordKeys(deckId);
        Map<String, Integer> fileWords = new HashMap<>();
        List<CardRequest> cards = new ArrayList<>(rows.size());
        List<Map<String, Object>> errors = new ArrayList<>();
        for (SheetRow row : rows) {
            CardRequest card = toCard(row);
            for (ConstraintViolation<CardRequest> v : validator.validate(card)) {
                errors.add(rowError(row.line(), v.getPropertyPath().toString(),
                        v.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName()));
            }
            if (card.word() != null && !card.word().isEmpty()) {
                String key = card.word().toLowerCase(Locale.ROOT);
                if (deckWords.contains(key)) {
                    errors.add(rowError(row.line(), "word", CODE_DUPLICATE_IN_DECK));
                } else if (fileWords.containsKey(key)) {
                    Map<String, Object> error = rowError(row.line(), "word", CODE_DUPLICATE_IN_FILE);
                    error.put("otherRow", fileWords.get(key));
                    errors.add(error);
                } else {
                    fileWords.put(key, row.line());
                }
            }
            cards.add(card);
        }
        if (!errors.isEmpty()) {
            errors.sort(Comparator.comparingInt(e -> (Integer) e.get("row")));
            throw new BusinessException(ErrorCode.VOCAB_IMPORT_ROWS_INVALID, Map.of("errors", errors));
        }
        return cards;
    }

    private static CardRequest toCard(SheetRow row) {
        return new CardRequest(row.get(Column.WORD), row.get(Column.MEANING_VI), row.get(Column.IPA_UK),
                row.get(Column.IPA_US), CardPos.fromCell(row.get(Column.POS)).orElse(null),
                row.get(Column.DEFINITION_EN), row.get(Column.DEFINITION_VI), row.get(Column.EXAMPLE_EN),
                row.get(Column.EXAMPLE_VI));
    }

    private static Map<String, Object> rowError(int line, String field, String code) {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("row", line);
        error.put("field", field);
        error.put("code", code);
        return error;
    }

    // ------------------------------------------------------------------ quyền và tra cứu (BR-NT-01)

    private DeckStateRow lockTeacherDeck(UUID teacherId, UUID deckId) {
        return teacherDeck(decks.lockState(deckId), teacherId);
    }

    /** Bộ thư viện chưa xóa của chính giáo viên; bộ khác loại, không tồn tại hoặc đã xóa = không tìm thấy. */
    private static DeckStateRow teacherDeck(Optional<DeckStateRow> found, UUID teacherId) {
        DeckStateRow deck = found.filter(d -> VocabDeck.KIND_LIBRARY.equals(d.getKind()) && d.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND));
        if (!teacherId.equals(deck.getOwnerId())) {
            throw new ForbiddenException("Bạn không có quyền sửa bộ thẻ này");
        }
        return deck;
    }

    private DeckManageView.Group group(UUID deckId, UUID groupId) {
        return repository.findGroup(deckId, groupId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_GROUP_NOT_FOUND));
    }

    /** Thẻ để trả về client: ảnh đổi từ S3 key sang URL đọc. */
    private DeckManageView.Card card(UUID deckId, UUID groupId, UUID cardId) {
        DeckManageView.Card c = repository.findCard(deckId, groupId, cardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_CARD_NOT_FOUND));
        return new DeckManageView.Card(c.id(), c.word(), c.pos(), c.ipaUk(), c.ipaUs(), c.meaningVi(),
                c.definitionEn(), c.definitionVi(), c.exampleEn(), c.exampleVi(), images.url(c.imageUrl()),
                audio.resolve(c.audioUk()), audio.resolve(c.audioUs()));
    }

    private static boolean isPublished(DeckStateRow deck) {
        return VocabDeck.STATUS_PUBLISHED.equals(deck.getStatus());
    }

    private static BusinessException mustStayPublishable(String reason) {
        return new BusinessException(ErrorCode.VOCAB_DECK_MUST_STAY_PUBLISHABLE, Map.of("reason", reason));
    }

    /** Thời điểm hiện tại cắt tới micro giây, đúng độ chính xác của {@code timestamptz}. */
    private Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.MICROS);
    }
}
