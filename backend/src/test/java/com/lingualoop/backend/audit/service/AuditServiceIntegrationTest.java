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
        Map<String, Object> diff = Map.of("months", Map.of("old", 3, "new", 1));

        inTransaction(() -> auditService.record(new AuditEntryRequest(actor, "Tâm", Role.ADMIN,
                AuditAction.UPDATE, AuditEntityType.PLAN, entityId, "Pro 1 tháng", diff, "đổi thời hạn")));

        Map<String, Object> row = jdbc.queryForMap(
                "SELECT actor_id, actor_name, actor_role, action, target_type, target_id, target_name, note, created_at, "
                        + "changes->'months'->>'old' AS diff_old, changes->'months'->>'new' AS diff_new "
                        + "FROM audit_logs WHERE target_id = ?", entityId);
        assertThat(row.get("actor_id")).isEqualTo(actor);
        assertThat(row.get("actor_name")).isEqualTo("Tâm");
        assertThat(row.get("actor_role")).isEqualTo("admin");
        assertThat(row.get("target_name")).isEqualTo("Pro 1 tháng");
        assertThat(row.get("note")).isEqualTo("đổi thời hạn");
        assertThat(row.get("action")).isEqualTo("update");
        assertThat(row.get("target_type")).isEqualTo("plan");
        assertThat(row.get("target_id")).isEqualTo(entityId);
        assertThat(row.get("created_at")).isNotNull();
        assertThat(row.get("diff_old")).isEqualTo("3");
        assertThat(row.get("diff_new")).isEqualTo("1");
    }

    @Test
    void record_deleteWithNullDiff_isStoredWithNullDiff() {
        UUID entityId = UUID.randomUUID();

        inTransaction(() -> auditService.record(new AuditEntryRequest(
                newUser(), null, Role.TEACHER, AuditAction.DELETE, AuditEntityType.LESSON, entityId, "Bài 1",
                null, null)));

        Map<String, Object> row = jdbc.queryForMap(
                "SELECT action, target_type, changes IS NULL AS diff_is_null "
                        + "FROM audit_logs WHERE target_id = ?", entityId);
        assertThat(row.get("action")).isEqualTo("delete");
        assertThat(row.get("target_type")).isEqualTo("lesson");
        assertThat(row.get("diff_is_null")).isEqualTo(true);
    }

    @Test
    void record_withoutActor_isStoredAsTheSystem() {
        UUID entityId = UUID.randomUUID();

        inTransaction(() -> auditService.record(new AuditEntryRequest(
                null, null, null, AuditAction.RESOLVE, AuditEntityType.REPORT, entityId, "apple", null, "Tự đóng")));

        Map<String, Object> row = jdbc.queryForMap(
                "SELECT actor_id, actor_name, actor_role FROM audit_logs WHERE target_id = ?", entityId);
        assertThat(row.get("actor_id")).isNull();
        assertThat(row.get("actor_name")).isEqualTo("Hệ thống");
        assertThat(row.get("actor_role")).isEqualTo("system");
    }

    @Test
    void record_outsideTransaction_throwsIllegalTransactionStateException() {
        UUID entityId = UUID.randomUUID();
        AuditEntryRequest entry = new AuditEntryRequest(
                newUser(), null, Role.ADMIN, AuditAction.PUBLISH, AuditEntityType.PLAN, entityId, "Pro 1 tháng",
                null, null);

        assertThatThrownBy(() -> auditService.record(entry))
                .isInstanceOf(IllegalTransactionStateException.class);

        assertThat(countLogs(entityId)).isZero();
    }

    @Test
    void record_whenBusinessTransactionRollsBack_logIsRolledBackToo() {
        UUID entityId = UUID.randomUUID();
        AuditEntryRequest entry = new AuditEntryRequest(
                newUser(), null, Role.TEACHER, AuditAction.CREATE, AuditEntityType.LESSON, entityId, "Bài 1",
                null, null);

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
        Integer n = jdbc.queryForObject("SELECT count(*) FROM audit_logs WHERE target_id = ?",
                Integer.class, entityId);
        return n == null ? 0 : n;
    }

    private UUID newUser() {
        return userAccountService.createLocal("a-" + UUID.randomUUID() + "@x.com", "Audit", "h").id();
    }
}
