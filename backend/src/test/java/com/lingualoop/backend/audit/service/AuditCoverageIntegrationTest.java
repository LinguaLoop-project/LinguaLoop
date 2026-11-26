package com.lingualoop.backend.audit.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.auth.service.LoginAttemptService;
import com.lingualoop.backend.user.AdminUserTestData;
import com.lingualoop.backend.user.service.UserAccountService;
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.CardRequest;
import com.lingualoop.backend.vocab.dto.request.CreateDeckRequest;
import com.lingualoop.backend.vocab.dto.request.GroupRequest;
import com.lingualoop.backend.vocab.service.VocabDeckContentService;
import com.lingualoop.backend.vocab.service.VocabDeckManageService;

/**
 * Phạm vi ghi nhật ký theo mức rủi ro (BR-NK-18): bộ thẻ chỉ ghi các mốc lớn kèm thông tin lúc tạo,
 * nhóm thẻ và thẻ không ghi; tạm khóa đăng nhập ghi người thực hiện là Hệ thống (BR-TK-18).
 */
@SpringBootTest
@Import({ TestcontainersConfiguration.class, AdminUserTestData.class })
class AuditCoverageIntegrationTest {

    @Autowired private VocabDeckManageService decks;
    @Autowired private VocabDeckContentService content;
    @Autowired private LoginAttemptService loginAttempts;
    @Autowired private UserAccountService users;
    @Autowired private AdminUserTestData data;
    @Autowired private JdbcTemplate jdbc;

    private static CardRequest card(String word, String meaning) {
        return new CardRequest(word, meaning, null, null, null, null, null, null, null);
    }

    private List<Map<String, Object>> logsOf(UUID target) {
        return jdbc.queryForList("""
                SELECT action, target_type, target_name, actor_name, actor_role, parent_type, parent_id,
                       changes::text AS changes, note
                FROM audit_logs WHERE target_id = ? ORDER BY id""", target);
    }

    @Test
    void deckCreateIsLoggedWithCreatedValues_groupAndCardEditsAreNot_BR_NK_18() {
        UUID teacher = data.teacher("Lê Thanh");
        String name = "TOEIC " + UUID.randomUUID().toString().substring(0, 6);
        UUID deck = decks.createDeck(teacher, new CreateDeckRequest(name, null, null, true, null)).id();
        DeckManageView.Group group = content.addGroup(teacher, deck, new GroupRequest("Office"));
        content.renameGroup(teacher, deck, group.id(), new GroupRequest("Office 2"));
        DeckManageView.Card invoice = content.addCard(teacher, deck, group.id(), card("invoice", "hóa đơn"));
        content.updateCard(teacher, deck, group.id(), invoice.id(), card("invoice", "hóa đơn thanh toán"));
        content.deleteCard(teacher, deck, group.id(), invoice.id());

        assertThat(logsOf(deck)).singleElement().satisfies(row -> {
            assertThat(row.get("action")).isEqualTo("create");
            assertThat(row.get("target_type")).isEqualTo("deck");
            assertThat(row.get("target_name")).isEqualTo(name);
            assertThat(row.get("actor_name")).isEqualTo("Lê Thanh");
            assertThat(row.get("actor_role")).isEqualTo("teacher");
            assertThat(row.get("changes").toString()).contains("\"name\"", name, "\"pro\"", "\"old\": null");
        });
        assertThat(logsOf(group.id())).isEmpty();
        assertThat(logsOf(invoice.id())).isEmpty();
    }

    @Test
    void publishUnpublishDeleteRestore_areLogged_BR_BT_16() {
        UUID teacher = data.teacher("GV");
        String name = "Bộ " + UUID.randomUUID().toString().substring(0, 6);
        UUID deck = decks.createDeck(teacher, new CreateDeckRequest(name, null, null, false, null)).id();
        DeckManageView.Group group = content.addGroup(teacher, deck, new GroupRequest("G"));
        content.addCard(teacher, deck, group.id(), card("apple", "táo"));
        decks.publish(teacher, deck);
        decks.unpublishByTeacher(teacher, deck);
        decks.deleteDeck(teacher, deck);
        decks.restoreDeck(teacher, deck, null);

        assertThat(logsOf(deck)).extracting(r -> r.get("action"))
                .containsExactly("create", "publish", "unpublish", "delete", "restore");
    }

    @Test
    void fifthWrongPassword_logsLoginLockedBySystem_BR_TK_18() {
        String email = "lock-" + UUID.randomUUID() + "@x.com";
        UUID user = users.createLocal(email, "Bị khóa", "hash").id();

        for (int i = 0; i < 5; i++) {
            loginAttempts.recordFailure(email);
        }

        assertThat(logsOf(user)).singleElement().satisfies(row -> {
            assertThat(row.get("action")).isEqualTo("login_locked");
            assertThat(row.get("target_type")).isEqualTo("user");
            assertThat(row.get("actor_role")).isEqualTo("system");
            assertThat(row.get("note").toString()).contains("tạm khóa");
        });
    }

    @Test
    void wrongPasswordsForUnknownEmail_logNothing_BR_TK_18() {
        String email = "nobody-" + UUID.randomUUID() + "@x.com";
        Integer before = jdbc.queryForObject("SELECT count(*) FROM audit_logs WHERE action = 'login_locked'",
                Integer.class);

        for (int i = 0; i < 5; i++) {
            loginAttempts.recordFailure(email);
        }

        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_logs WHERE action = 'login_locked'",
                Integer.class)).isEqualTo(before);
    }
}
