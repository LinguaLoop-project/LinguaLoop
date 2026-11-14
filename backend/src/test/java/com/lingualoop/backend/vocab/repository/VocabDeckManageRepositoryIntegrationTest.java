package com.lingualoop.backend.vocab.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.vocab.DeckManageTestData;
import com.lingualoop.backend.vocab.repository.VocabDeckManageRepository.DeckManageRow;

/**
 * Truy vấn danh sách bộ của giáo viên và quản trị viên (UC-BT-01, BR-BT-01, 10, 12, 14) trên Postgres thật. Giáo viên
 * luôn tạo mới nên mỗi test chỉ thấy bộ của mình; danh sách quản trị viên lọc thêm theo tiền tố tên {@link #base}.
 */
@SpringBootTest
@Import({TestcontainersConfiguration.class, DeckManageTestData.class})
class VocabDeckManageRepositoryIntegrationTest {

    private static final int PAGE_SIZE = 10;

    @Autowired private VocabDeckManageRepository repository;
    @Autowired private DeckManageTestData data;

    private final String base = "bt" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    private final Instant now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
    private final Instant deletedSince = now.minus(30, ChronoUnit.DAYS);

    private List<DeckManageRow> teacher(UUID owner, String status, String q, UUID category, boolean other,
            boolean pro, int page) {
        return repository.findTeacherDecks(owner, status, deletedSince, VocabDeckManageRepository.containsPattern(q),
                category, other, pro, PAGE_SIZE, page * PAGE_SIZE);
    }

    private List<DeckManageRow> teacher(UUID owner, String status) {
        return teacher(owner, status, null, null, false, false, 0);
    }

    private long teacherCount(UUID owner, String status) {
        return repository.countTeacherDecks(owner, status, deletedSince, null, null, false, false);
    }

    private List<DeckManageRow> admin(UUID owner, boolean system) {
        return repository.findAdminDecks(owner, system, VocabDeckManageRepository.containsPattern(base), null, false,
                false, 100, 0);
    }

    private static List<String> names(List<DeckManageRow> rows) {
        return rows.stream().map(DeckManageRow::getName).toList();
    }

    @Test
    void list_countsOnlyNonDeletedGroupsAndCards_AC_BT_01() {
        UUID owner = data.teacher("GV A");
        UUID deck = data.deck(owner, base + " deck").insert();
        UUID g1 = data.group(deck, "G1", false);
        UUID g2 = data.group(deck, "G2", false);
        data.group(deck, "G3", true);
        for (int i = 0; i < 5; i++) {
            data.card(g1, base + "a" + i, i == 0);
            data.card(g2, base + "b" + i, i == 0);
        }

        DeckManageRow row = teacher(owner, "all").get(0);

        assertThat(row.getGroupCount()).isEqualTo(2);
        assertThat(row.getCardCount()).isEqualTo(8);
    }

    @Test
    void list_sameUpdatedAt_ordersByIdDesc_AC_BT_02() {
        UUID owner = data.teacher("GV A");
        List<UUID> ids = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            ids.add(data.deck(owner, base + " same " + i).updatedAt(now).insert());
        }
        UUID newer = data.deck(owner, base + " newer").updatedAt(now.plusSeconds(1)).insert();

        List<UUID> got = teacher(owner, "all").stream().map(DeckManageRow::getId).toList();

        List<UUID> tied = ids.stream().sorted((a, b) -> b.toString().compareTo(a.toString())).toList();
        assertThat(got.get(0)).isEqualTo(newer);
        assertThat(got.subList(1, 4)).containsExactlyElementsOf(tied);
    }

    @Test
    void list_qToeicStatusDraftPro_returnsIntersection_AC_BT_03() {
        UUID owner = data.teacher("GV A");
        data.deck(owner, "TOEIC Nháp Pro").pro().insert();
        data.deck(owner, "TOEIC Nháp thường").insert();
        data.deck(owner, "TOEIC Xuất bản Pro").pro().published().insert();
        data.deck(owner, "IELTS Nháp Pro").pro().insert();

        assertThat(names(teacher(owner, "draft", "TOEIC", null, false, true, 0))).containsExactly("TOEIC Nháp Pro");
    }

    @Test
    void list_statusAll_includesDraftAndPublishedExcludesDeleted_AC_BT_03() {
        UUID owner = data.teacher("GV A");
        data.deck(owner, "Nháp").insert();
        data.deck(owner, "Đã xuất bản").published().insert();
        data.deck(owner, "Đã xóa").published().deletedAt(now.minus(1, ChronoUnit.DAYS)).insert();

        assertThat(names(teacher(owner, "all"))).containsExactlyInAnyOrder("Nháp", "Đã xuất bản");
        assertThat(names(teacher(owner, "published"))).containsExactly("Đã xuất bản");
        assertThat(names(teacher(owner, "draft"))).containsExactly("Nháp");
        assertThat(teacherCount(owner, "all")).isEqualTo(2);
    }

    @Test
    void list_statusDeleted_returnsOnlyWithin30Days_AC_BT_04() {
        UUID owner = data.teacher("GV A");
        Instant fiveDaysAgo = now.minus(5, ChronoUnit.DAYS);
        data.deck(owner, "Xóa 5 ngày").deletedAt(fiveDaysAgo).insert();
        data.deck(owner, "Xóa 40 ngày").deletedAt(now.minus(40, ChronoUnit.DAYS)).insert();
        data.deck(owner, "Nháp").insert();

        List<DeckManageRow> rows = teacher(owner, "deleted");

        assertThat(names(rows)).containsExactly("Xóa 5 ngày");
        assertThat(rows.get(0).getDeletedAt()).isEqualTo(fiveDaysAgo);
        assertThat(teacherCount(owner, "deleted")).isEqualTo(1);
    }

    @Test
    void list_statusDeleted_exactly30DaysAgo_included_AC_BT_04() {
        UUID owner = data.teacher("GV A");
        data.deck(owner, "Đúng 30 ngày").deletedAt(deletedSince).insert();

        assertThat(names(teacher(owner, "deleted"))).containsExactly("Đúng 30 ngày");
    }

    @Test
    void list_statusDeleted_30DaysAnd1SecondAgo_excluded_AC_BT_04() {
        UUID owner = data.teacher("GV A");
        data.deck(owner, "30 ngày 1 giây").deletedAt(deletedSince.minusSeconds(1)).insert();

        assertThat(teacher(owner, "deleted")).isEmpty();
    }

    @Test
    void list_qNoMatch_returnsEmpty_AC_BT_06() {
        UUID owner = data.teacher("GV A");
        data.deck(owner, "TOEIC Essential").insert();

        assertThat(teacher(owner, "all", "xyz123", null, false, false, 0)).isEmpty();
    }

    @Test
    void list_adminOwnerFilter_returnsOnlyThatOwner_AC_BT_50() {
        UUID a = data.teacher("GV A");
        UUID b = data.teacher("GV B");
        data.deck(a, base + " A1").published().insert();
        data.deck(a, base + " A2").published().insert();
        data.deck(b, base + " B1").published().insert();

        List<DeckManageRow> rows = admin(a, false);

        assertThat(names(rows)).containsExactlyInAnyOrder(base + " A1", base + " A2");
        assertThat(rows).allSatisfy(r -> assertThat(r.getOwnerName()).isEqualTo("GV A"));
    }

    @Test
    void list_admin_includesSystemDeckExcludesPersonal_AC_BT_57() {
        UUID a = data.teacher("GV A");
        UUID student = data.user(com.lingualoop.backend.security.Role.STUDENT, "HV");
        UUID system = data.deck(null, base + " hệ thống").published().insert();
        data.deck(student, base + " cá nhân").personal().published().insert();
        data.deck(a, base + " A1").published().insert();
        data.deck(a, base + " A2").published().insert();
        data.deck(a, base + " A nháp").insert();

        List<DeckManageRow> rows = admin(null, false);

        assertThat(names(rows)).containsExactlyInAnyOrder(base + " hệ thống", base + " A1", base + " A2");
        DeckManageRow systemRow = rows.stream().filter(r -> r.getId().equals(system)).findFirst().orElseThrow();
        assertThat(systemRow.getOwnerId()).isNull();
        assertThat(systemRow.getOwnerName()).isNull();
        assertThat(names(admin(null, true))).containsExactly(base + " hệ thống");
        // giáo viên A chỉ thấy bộ của mình, không thấy bộ hệ thống
        assertThat(names(teacher(a, "published"))).containsExactlyInAnyOrder(base + " A1", base + " A2");
    }

    @Test
    void list_25Decks_page0Has10_page2Has5_descOrder_AC_BT_58() {
        UUID owner = data.teacher("GV A");
        for (int i = 1; i <= 25; i++) {
            data.deck(owner, String.format("Bộ %02d", i)).updatedAt(now.minus(i, ChronoUnit.MINUTES)).insert();
        }

        List<String> page0 = names(teacher(owner, "all", null, null, false, false, 0));
        List<String> page2 = names(teacher(owner, "all", null, null, false, false, 2));

        assertThat(page0).hasSize(10).first().isEqualTo("Bộ 01");
        assertThat(page0).last().isEqualTo("Bộ 10");
        assertThat(page2).containsExactly("Bộ 21", "Bộ 22", "Bộ 23", "Bộ 24", "Bộ 25");
        assertThat(teacherCount(owner, "all")).isEqualTo(25);
    }

    @Test
    void list_exactly10Decks_singlePage_AC_BT_58() {
        UUID owner = data.teacher("GV A");
        for (int i = 1; i <= 10; i++) {
            data.deck(owner, "Bộ " + i).insert();
        }

        assertThat(teacher(owner, "all")).hasSize(10);
        assertThat(teacher(owner, "all", null, null, false, false, 1)).isEmpty();
        assertThat(teacherCount(owner, "all")).isEqualTo(10);

        data.deck(owner, "Bộ 11").insert();
        assertThat(teacher(owner, "all", null, null, false, false, 1)).hasSize(1);
        assertThat(teacherCount(owner, "all")).isEqualTo(11);
    }

    @Test
    void list_categoryAcademic_returnsOnlyThatCategory_AC_BT_59() {
        UUID owner = data.teacher("GV A");
        UUID academic = data.category("Học thuật " + base);
        data.deck(owner, "Bộ học thuật").category(academic).insert();
        data.deck(owner, "Bộ không danh mục").insert();

        List<DeckManageRow> rows = teacher(owner, "all", null, academic, false, false, 0);

        assertThat(names(rows)).containsExactly("Bộ học thuật");
        assertThat(rows.get(0).getCategoryName()).isEqualTo("Học thuật " + base);
    }

    @Test
    void list_otherTrue_returnsOnlyNullCategory_AC_BT_59() {
        UUID owner = data.teacher("GV A");
        data.deck(owner, "Bộ học thuật").category(data.category("Học thuật " + base)).insert();
        data.deck(owner, "Bộ không danh mục").insert();

        List<DeckManageRow> rows = teacher(owner, "all", null, null, true, false, 0);

        assertThat(names(rows)).containsExactly("Bộ không danh mục");
        assertThat(rows.get(0).getCategoryId()).isNull();
    }

    @Test
    void list_qLowercase_matchesCaseInsensitive_AC_BT_60() {
        UUID owner = data.teacher("GV A");
        data.deck(owner, "TOEIC Essential").insert();
        data.deck(owner, "IELTS").insert();

        assertThat(names(teacher(owner, "all", "toeic", null, false, false, 0))).containsExactly("TOEIC Essential");
    }

    @Test
    void list_qPercent_isLiteralNotWildcard_AC_BT_60() {
        UUID owner = data.teacher("GV A");
        data.deck(owner, "TOEIC Essential").insert();

        assertThat(teacher(owner, "all", "%", null, false, false, 0)).isEmpty();

        data.deck(owner, "Sale 50%").insert();
        assertThat(names(teacher(owner, "all", "%", null, false, false, 0))).containsExactly("Sale 50%");
    }

    @Test
    void list_qUnderscoreAndBackslash_areLiteral_AC_BT_60() {
        UUID owner = data.teacher("GV A");
        data.deck(owner, "A_B").insert();
        data.deck(owner, "AXB").insert();

        assertThat(names(teacher(owner, "all", "A_B", null, false, false, 0))).containsExactly("A_B");
        assertThat(teacher(owner, "all", "\\", null, false, false, 0)).isEmpty();

        data.deck(owner, "C\\D").insert();
        assertThat(names(teacher(owner, "all", "\\", null, false, false, 0))).containsExactly("C\\D");
    }
}
