package com.lingualoop.backend.audit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.service.UserAccountService;


@SpringBootTest
@Import(TestcontainersConfiguration.class)
class AuditServiceIntegrationTest {

    @Autowired private AuditService auditService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void record_inTransaction_storesAllFieldsAndDiffAsJson() {
        UUID actor = newUser();
        UUID entityId = UUID.randomUUID();
        Map<String, Object> diff = Map.of("title", Map.of("from", "Old", "to", "New"));

        inTransaction(() -> auditService.record(new AuditEntryRequest(
                actor, Role.INSTRUCTOR, AuditAction.UPDATE, AuditEntityType.LESSON, entityId, diff)));

        Map<String, Object> row = jdbc.queryForMap(
                "SELECT actor_id, actor_role, action, entity_type, entity_id, created_at, "
                        + "diff->'title'->>'from' AS diff_from, diff->'title'->>'to' AS diff_to "
                        + "FROM content_audit_log WHERE entity_id = ?", entityId);
        assertThat(row.get("actor_id")).isEqualTo(actor);
        assertThat(row.get("actor_role")).isEqualTo("instructor");
        assertThat(row.get("action")).isEqualTo("update");
        assertThat(row.get("entity_type")).isEqualTo("lesson");
        assertThat(row.get("entity_id")).isEqualTo(entityId);
        assertThat(row.get("created_at")).isNotNull();
        assertThat(row.get("diff_from")).isEqualTo("Old");
        assertThat(row.get("diff_to")).isEqualTo("New");
    }

    @Test
    void record_deleteWithNullDiff_isStoredWithNullDiff() {
        UUID entityId = UUID.randomUUID();

        inTransaction(() -> auditService.record(new AuditEntryRequest(
                newUser(), Role.ADMIN, AuditAction.DELETE, AuditEntityType.SENTENCE, entityId, null)));

        Map<String, Object> row = jdbc.queryForMap(
                "SELECT action, entity_type, diff IS NULL AS diff_is_null "
                        + "FROM content_audit_log WHERE entity_id = ?", entityId);
        assertThat(row.get("action")).isEqualTo("delete");
        assertThat(row.get("entity_type")).isEqualTo("sentence");
        assertThat(row.get("diff_is_null")).isEqualTo(true);
    }

    @Test
    void record_outsideTransaction_throwsIllegalTransactionStateException() {
        UUID entityId = UUID.randomUUID();
        AuditEntryRequest entry = new AuditEntryRequest(
                newUser(), Role.ADMIN, AuditAction.PUBLISH, AuditEntityType.TOPIC, entityId, null);

        assertThatThrownBy(() -> auditService.record(entry))
                .isInstanceOf(IllegalTransactionStateException.class);

        assertThat(countLogs(entityId)).isZero();
    }

    @Test
    void record_whenBusinessTransactionRollsBack_logIsRolledBackToo() {
        UUID entityId = UUID.randomUUID();
        AuditEntryRequest entry = new AuditEntryRequest(
                newUser(), Role.INSTRUCTOR, AuditAction.CREATE, AuditEntityType.LESSON, entityId, null);

        assertThatThrownBy(() -> inTransaction(() -> {
            auditService.record(entry);
            throw new IllegalStateException("business failure");
        })).isInstanceOf(IllegalStateException.class).hasMessage("business failure");

        assertThat(countLogs(entityId)).isZero();
    }

    private void inTransaction(Runnable action) {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> action.run());
    }

    private int countLogs(UUID entityId) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM content_audit_log WHERE entity_id = ?",
                Integer.class, entityId);
        return n == null ? 0 : n;
    }

    private UUID newUser() {
        return userAccountService.createLocal("a-" + UUID.randomUUID() + "@x.com", "Audit", "h").id();
    }
}
