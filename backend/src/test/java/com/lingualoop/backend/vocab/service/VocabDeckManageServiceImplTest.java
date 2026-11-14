package com.lingualoop.backend.vocab.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ConflictException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.storage.dto.StoredObject;
import com.lingualoop.backend.storage.service.FileStorageService;
import com.lingualoop.backend.storage.service.UploadPurpose;
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.CreateDeckRequest;
import com.lingualoop.backend.vocab.entity.VocabDeck;
import com.lingualoop.backend.vocab.repository.VocabDeckManageRepository;
import com.lingualoop.backend.vocab.repository.VocabDeckRepository;

/** Tạo bộ (UC-BT-02): tên (BR-BT-03) và ảnh đã tải lên S3 (BR-BT-13). */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VocabDeckManageServiceImplTest {

    private static final String BASE_URL = "https://cdn.test/";

    @Mock private VocabDeckManageRepository repository;
    @Mock private VocabDeckRepository deckRepository;
    @Mock private FileStorageService storage;

    private VocabDeckManageServiceImpl service;
    private final UUID teacher = UUID.randomUUID();
    private final String imageKey = "vocab-decks/" + teacher + "/a.jpg";

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-11-13T03:30:00Z"), ZoneOffset.UTC);
        service = new VocabDeckManageServiceImpl(repository, deckRepository, new DeckImageValidator(), storage,
                new DeckImageUrls(storage), new CardAudioUrls(null), clock);
        when(repository.existsActiveName(any(), anyString())).thenReturn(false);
        when(deckRepository.saveAndFlush(any(VocabDeck.class))).thenAnswer(inv -> inv.getArgument(0));
        when(storage.publicUrl(anyString())).thenAnswer(inv -> BASE_URL + inv.getArgument(0));
        when(storage.confirmUpload(any(), any(), anyString()))
                .thenAnswer(inv -> new StoredObject(inv.getArgument(2), "image/jpeg", 1000));
        when(storage.readHead(anyString(), anyInt())).thenReturn(DeckImageValidatorTest.jpgHead());
    }

    private static CreateDeckRequest named(String name) {
        return new CreateDeckRequest(name, null, false, null);
    }

    private CreateDeckRequest withImage(String name) {
        return new CreateDeckRequest(name, null, false, imageKey);
    }

    private VocabDeck savedDeck() {
        ArgumentCaptor<VocabDeck> captor = ArgumentCaptor.forClass(VocabDeck.class);
        verify(deckRepository).saveAndFlush(captor.capture());
        return captor.getValue();
    }

    @Test
    void createDeck_name100Chars_accepted_AC_BT_65() {
        String name = "a".repeat(100);

        DeckManageView.Item item = service.createDeck(teacher, named(name));

        assertThat(item.name()).isEqualTo(name);
        assertThat(item.imageUrl()).isNull();
        VocabDeck deck = savedDeck();
        assertThat(deck.getName()).hasSize(100);
        assertThat(deck.getOwnerId()).isEqualTo(teacher);
        assertThat(deck.getStatus()).isEqualTo("draft");
        assertThat(deck.getKind()).isEqualTo("library");
        verify(storage, never()).confirmUpload(any(), any(), any());
    }

    @Test
    void createDeck_name101Chars_throwsFieldValidation_AC_BT_65() {
        FieldValidationException ex = catchThrowableOfType(FieldValidationException.class,
                () -> service.createDeck(teacher, named("a".repeat(101))));

        assertThat(ex.fieldErrors().get(0).field()).isEqualTo("name");
        assertThat(ex.fieldErrors().get(0).code()).isEqualTo("Size");
        verify(deckRepository, never()).saveAndFlush(any());
    }

    @Test
    void createDeck_whitespaceOnlyName_throwsRequired_AC_BT_66() {
        FieldValidationException ex = catchThrowableOfType(FieldValidationException.class,
                () -> service.createDeck(teacher, named("    ")));

        assertThat(ex.fieldErrors().get(0).field()).isEqualTo("name");
        assertThat(ex.fieldErrors().get(0).code()).isEqualTo("NotBlank");
        verify(deckRepository, never()).saveAndFlush(any());

        // tên null cũng coi là trống
        FieldValidationException nullName = catchThrowableOfType(FieldValidationException.class,
                () -> service.createDeck(teacher, named(null)));
        assertThat(nullName.fieldErrors().get(0).code()).isEqualTo("NotBlank");
    }

    @Test
    void createDeck_name100CharsPlusPaddingSpaces_accepted_AC_BT_66() {
        String core = "b".repeat(100);

        service.createDeck(teacher, named("  " + core + "\t "));

        assertThat(savedDeck().getName()).isEqualTo(core);
        verify(repository).existsActiveName(eq(teacher), eq(core));
    }

    @Test
    void createDeck_uploadedJpg_savesKeyAndReturnsPublicUrl_AC_BT_07() {
        DeckManageView.Item item = service.createDeck(teacher, withImage("Bộ 1"));

        assertThat(savedDeck().getImageUrl()).isEqualTo(imageKey);
        assertThat(item.imageUrl()).isEqualTo(BASE_URL + imageKey);
        verify(storage).confirmUpload(teacher, UploadPurpose.DECK_IMAGE, imageKey);
        verify(storage).readHead(imageKey, DeckImageValidator.HEAD_BYTES);
        verify(storage, never()).discardUpload(any(), any(), any());
    }

    @Test
    void createDeck_uploadedPdf_rejectedOnImageFieldAndDiscarded_AC_BT_12() {
        when(storage.readHead(anyString(), anyInt())).thenReturn(DeckImageValidatorTest.pdfHead());

        FieldValidationException ex = catchThrowableOfType(FieldValidationException.class,
                () -> service.createDeck(teacher, withImage("Bộ 1")));

        assertThat(ex.fieldErrors().get(0).field()).isEqualTo("image");
        assertThat(ex.fieldErrors().get(0).code()).isEqualTo(DeckImageValidator.CODE_TYPE);
        verify(storage).discardUpload(teacher, UploadPurpose.DECK_IMAGE, imageKey);
        verify(deckRepository, never()).saveAndFlush(any());
    }

    @Test
    void createDeck_storageRejectsTypeOrSize_mappedToImageField_AC_BT_12() {
        when(storage.confirmUpload(any(), any(), anyString()))
                .thenThrow(new BusinessException(ErrorCode.STORAGE_FILE_INVALID));

        FieldValidationException ex = catchThrowableOfType(FieldValidationException.class,
                () -> service.createDeck(teacher, withImage("Bộ 1")));

        assertThat(ex.fieldErrors().get(0).field()).isEqualTo("image");
        verify(deckRepository, never()).saveAndFlush(any());
    }

    @Test
    void createDeck_imageNotUploaded_keepsStorageError() {
        when(storage.confirmUpload(any(), any(), anyString()))
                .thenThrow(new BusinessException(ErrorCode.STORAGE_UPLOAD_NOT_FOUND));

        BusinessException ex = catchThrowableOfType(BusinessException.class,
                () -> service.createDeck(teacher, withImage("Bộ 1")));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.STORAGE_UPLOAD_NOT_FOUND);
        verify(deckRepository, never()).saveAndFlush(any());
    }

    @Test
    void createDeck_duplicateNameWithImage_discardsUpload_AC_BT_11() {
        when(repository.existsActiveName(any(), anyString())).thenReturn(true);

        catchThrowableOfType(ConflictException.class, () -> service.createDeck(teacher, withImage("Bộ 1")));

        verify(storage).discardUpload(teacher, UploadPurpose.DECK_IMAGE, imageKey);
        verify(storage, never()).confirmUpload(any(), any(), any());
    }
}
