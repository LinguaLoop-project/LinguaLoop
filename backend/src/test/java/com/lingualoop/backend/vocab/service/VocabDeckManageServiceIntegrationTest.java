package com.lingualoop.backend.vocab.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.common.exception.ConflictException;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.storage.dto.StoredObject;
import com.lingualoop.backend.storage.service.FileStorageService;
import com.lingualoop.backend.storage.service.UploadPurpose;
import com.lingualoop.backend.vocab.DeckManageTestData;
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.CreateDeckRequest;

/**
 * Tạo bộ thẻ trên Postgres thật (UC-BT-02, BR-BT-02, 03, 13): trùng tên, tạo đồng thời, bỏ ảnh khi lưu lỗi. Kho
 * tệp S3 được thay bằng mock: ảnh coi như đã tải lên đúng thư mục của giáo viên.
 */
@SpringBootTest
@Import({TestcontainersConfiguration.class, DeckManageTestData.class})
class VocabDeckManageServiceIntegrationTest {

    @Autowired private VocabDeckManageService service;
    @Autowired private VocabDeckService studentDecks;
    @Autowired private DeckManageTestData data;
    @Autowired private JdbcTemplate jdbc;
    @MockitoBean private FileStorageService storage;

    @BeforeEach
    void stubStorage() {
        when(storage.confirmUpload(any(), any(), anyString()))
                .thenAnswer(inv -> new StoredObject(inv.getArgument(2), "image/jpeg", 500 * 1024));
        when(storage.readHead(anyString(), anyInt())).thenReturn(DeckImageValidatorTest.jpgHead());
        when(storage.publicUrl(anyString())).thenAnswer(inv -> "https://cdn.test/" + inv.getArgument(0));
    }

    private static CreateDeckRequest named(String name) {
        return new CreateDeckRequest(name, null, false, null);
    }

    private static String imageKeyOf(UUID teacher) {
        return "vocab-decks/" + teacher + "/" + UUID.randomUUID() + ".jpg";
    }

    @Test
    void createDeck_persistsLibraryDraftOwnedByTeacher_notVisibleToStudents_AC_BT_07() {
        UUID teacher = data.teacher("GV A");
        UUID academic = data.category("Học thuật " + UUID.randomUUID());

        String key = imageKeyOf(teacher);
        DeckManageView.Item item = service.createDeck(teacher, new CreateDeckRequest("IELTS 1", academic, true, key));

        var row = jdbc.queryForMap("""
                SELECT owner_id, kind, status, is_pro, category_id, image_url, deleted_at
                FROM vocab_decks WHERE id = ?""", item.id());
        assertThat(row.get("owner_id")).isEqualTo(teacher);
        assertThat(row.get("kind")).isEqualTo("library");
        assertThat(row.get("status")).isEqualTo("draft");
        assertThat(row.get("is_pro")).isEqualTo(true);
        assertThat(row.get("category_id")).isEqualTo(academic);
        assertThat(row.get("image_url")).isEqualTo(key);
        assertThat(item.imageUrl()).isEqualTo("https://cdn.test/" + key);
        assertThat(row.get("deleted_at")).isNull();
        assertThat(item.groupCount()).isZero();
        assertThat(item.cardCount()).isZero();

        // học viên không thấy bộ Nháp, kể cả khi bộ đã có thẻ
        UUID group = data.group(item.id(), "G1", false);
        data.card(group, "word", false);
        UUID student = data.user(Role.STUDENT, "HV");
        assertThat(studentDecks.list(student).decks()).noneMatch(d -> d.id().equals(item.id()));
    }

    @Test
    void createDeck_sameNameDifferentCase_throwsConflict_AC_BT_11() {
        UUID teacher = data.teacher("GV A");
        service.createDeck(teacher, named("TOEIC Essential 1000"));

        assertThatThrownBy(() -> service.createDeck(teacher, named("toeic essential 1000")))
                .isInstanceOf(ConflictException.class)
                .hasMessage(VocabDeckManageServiceImpl.DUPLICATE_NAME);
        assertThat(data.countDecks(teacher)).isEqualTo(1);
    }

    @Test
    void createDeck_sameNameAsOtherTeachersDeck_succeeds_AC_BT_67() {
        UUID a = data.teacher("GV A");
        UUID b = data.teacher("GV B");
        data.deck(b, "TOEIC 1").published().insert();

        DeckManageView.Item item = service.createDeck(a, named("toeic 1"));

        assertThat(item.name()).isEqualTo("toeic 1");
        assertThat(data.countDecks(a)).isEqualTo(1);
    }

    @Test
    void createDeck_sameNameAsOwnDeletedDeck_succeeds_AC_BT_67() {
        UUID a = data.teacher("GV A");
        data.deck(a, "TOEIC 1").published().deletedAt(Instant.now().minus(5, ChronoUnit.DAYS)).insert();

        service.createDeck(a, named("toeic 1"));

        assertThat(data.countDecks(a)).isEqualTo(2);
    }

    @Test
    void createDeck_twoConcurrentSameName_oneSavedOtherConflict_AC_BT_68() throws Exception {
        UUID teacher = data.teacher("GV A");
        CountDownLatch start = new CountDownLatch(1);
        Callable<DeckManageView.Item> create = () -> {
            start.await();
            return service.createDeck(teacher, named("IELTS 1"));
        };
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<DeckManageView.Item>> futures = List.of(pool.submit(create), pool.submit(create));
            start.countDown();

            int ok = 0;
            List<Throwable> failures = new ArrayList<>();
            for (Future<DeckManageView.Item> f : futures) {
                try {
                    f.get(30, TimeUnit.SECONDS);
                    ok++;
                } catch (ExecutionException ex) {
                    failures.add(ex.getCause());
                }
            }

            assertThat(ok).isEqualTo(1);
            assertThat(failures).singleElement().isInstanceOf(ConflictException.class)
                    .hasFieldOrPropertyWithValue("message", VocabDeckManageServiceImpl.DUPLICATE_NAME);
            assertThat(data.countDecks(teacher)).isEqualTo(1);
        } finally {
            pool.shutdownNow();
        }
    }

    /**
     * Lưu DB lỗi thật sau khi ảnh đã kiểm: danh mục bị xóa ngay sau bước kiểm tra (giả lập quản trị viên xóa danh mục
     * cùng lúc), nên INSERT vi phạm khóa ngoại. Ảnh đã tải lên phải bị bỏ và không có bộ nào được ghi.
     */
    @Test
    void createDeck_dbFailureAfterImageVerified_discardsImage_AC_BT_13() {
        UUID teacher = data.teacher("GV A");
        UUID category = data.category("Tạm " + UUID.randomUUID());
        String key = imageKeyOf(teacher);
        when(storage.readHead(anyString(), anyInt())).thenAnswer(inv -> {
            jdbc.update("DELETE FROM deck_categories WHERE id = ?", category);
            return DeckImageValidatorTest.jpgHead();
        });

        assertThatThrownBy(() -> service.createDeck(teacher, new CreateDeckRequest("Bộ lỗi", category, false, key)))
                .isInstanceOf(DataIntegrityViolationException.class);

        verify(storage).discardUpload(teacher, UploadPurpose.DECK_IMAGE, key);
        assertThat(data.countDecks(teacher)).isZero();
    }
}
