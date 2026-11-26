package com.lingualoop.backend.audit.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.AdminUserTestData;

/**
 * API nhật ký của quản trị viên (UC-NK-01). Nhật ký dùng chung cơ sở dữ liệu với mọi test khác, nên mỗi test đặt
 * tên đối tượng với một tiền tố riêng và tìm theo tiền tố đó.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, AdminUserTestData.class })
class AdminAuditLogApiIntegrationTest {

    private static final String LOGS = "/api/v1/admin/audit-logs";

    @Autowired private MockMvc mockMvc;
    @Autowired private AdminUserTestData data;
    @Autowired private JdbcTemplate jdbc;

    private final String base = "nk" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    private UUID admin;

    @BeforeEach
    void setUp() {
        admin = data.admin();
    }

    private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, data.bearer(admin, Role.ADMIN)));
    }

    /** Một mục nhật ký ghi thẳng bằng SQL để đặt tùy ý thời điểm. */
    private long log(String actorName, String role, String action, String type, UUID target, String name,
            Instant at) {
        return log(actorName, role, action, type, target, name, null, null, null, at);
    }

    private long log(String actorName, String role, String action, String type, UUID target, String name,
            String parentType, UUID parentId, String changes, Instant at) {
        return jdbc.queryForObject("""
                INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, target_type, target_id, target_name,
                                        parent_type, parent_id, changes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?) RETURNING id""", Long.class,
                "system".equals(role) ? null : UUID.randomUUID(), actorName, role, action, type, target, name,
                parentType, parentId, changes, Timestamp.from(at));
    }

    private static Instant daysAgo(int days) {
        return Instant.now().minus(Duration.ofDays(days));
    }

    // ---------------------------------------------------------------- UC-NK-01

    @Test
    void list_defaultsToLastSevenDaysNewestFirst_AC_NK_01() throws Exception {
        for (int i = 0; i < 3; i++) {
            log("Lê Thanh", "teacher", "update", "lesson", UUID.randomUUID(), base + " hôm nay " + i,
                    Instant.now().minusSeconds(60L * (i + 1)));
        }
        for (int i = 0; i < 2; i++) {
            log("Lê Thanh", "teacher", "update", "lesson", UUID.randomUUID(), base + " 5 ngày", daysAgo(5));
        }
        for (int i = 0; i < 4; i++) {
            log("Lê Thanh", "teacher", "update", "lesson", UUID.randomUUID(), base + " 20 ngày", daysAgo(20));
        }

        asAdmin(get(LOGS).param("q", base)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.size").value(50))
                .andExpect(jsonPath("$.data.totalElements").value(5))
                .andExpect(jsonPath("$.data.items[0].targetName").value(base + " hôm nay 0"))
                .andExpect(jsonPath("$.data.items[0].action").value("UPDATE"))
                .andExpect(jsonPath("$.data.items[0].targetType").value("LESSON"))
                .andExpect(jsonPath("$.data.items[0].actorName").value("Lê Thanh"))
                .andExpect(jsonPath("$.data.items[0].actorRole").value("teacher"))
                .andExpect(jsonPath("$.data.items[0].createdAt").exists());
    }

    @Test
    void list_combinesActionTypePeriodAndKeyword_AC_NK_02() throws Exception {
        String tam = base + " Tâm";
        log(tam, "admin", "delete", "lesson", UUID.randomUUID(), "Bài A", daysAgo(10));
        log(tam, "admin", "delete", "lesson", UUID.randomUUID(), "Bài B", daysAgo(3));
        log(tam, "admin", "unpublish", "lesson", UUID.randomUUID(), "Bài C", daysAgo(2));
        log(base + " Lê Thanh", "teacher", "delete", "lesson", UUID.randomUUID(), "Bài D", daysAgo(2));
        log(base + " Lê Thanh", "teacher", "delete", "deck", UUID.randomUUID(), "Bộ E", daysAgo(2));

        asAdmin(get(LOGS).param("action", "DELETE").param("targetType", "LESSON").param("period", "D30")
                .param("q", tam)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.items[0].targetName").value("Bài B"))
                .andExpect(jsonPath("$.data.items[1].targetName").value("Bài A"));
    }

    @Test
    void list_noMatch_isEmpty_AC_NK_06() throws Exception {
        asAdmin(get(LOGS).param("q", base + "zzz").param("period", "ALL")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void list_filtersByActorRoleIncludingSystem_AC_NK_08() throws Exception {
        log("Hệ thống", "system", "resolve", "report", UUID.randomUUID(), base + " r1", daysAgo(1));
        log("Hệ thống", "system", "reject", "report", UUID.randomUUID(), base + " r2", daysAgo(1));
        for (int i = 0; i < 3; i++) {
            log("Lê Thanh", "teacher", "publish", "lesson", UUID.randomUUID(), base + " b" + i, daysAgo(1));
        }

        asAdmin(get(LOGS).param("q", base).param("actorRole", "SYSTEM")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.items[0].actorName").value("Hệ thống"))
                .andExpect(jsonPath("$.data.items[0].actorId").doesNotExist());
    }

    @Test
    void detail_showsOldAndNewValuesOfEachChangedField_AC_NK_03() throws Exception {
        long id = log(base + " Tâm", "admin", "update", "plan", UUID.randomUUID(), base + " Pro 1 tháng",
                null, null, """
                        {"priceVnd":{"old":50000,"new":59000},
                         "creditsPerMonth":{"old":1000,"new":1200}}""", Instant.now());

        asAdmin(get(LOGS + "/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.entry.actorName").value(base + " Tâm"))
                .andExpect(jsonPath("$.data.entry.hasChanges").value(true))
                .andExpect(jsonPath("$.data.changes.priceVnd.old").value(50000))
                .andExpect(jsonPath("$.data.changes.priceVnd.new").value(59000))
                .andExpect(jsonPath("$.data.changes.creditsPerMonth.old").value(1000))
                .andExpect(jsonPath("$.data.changes.creditsPerMonth.new").value(1200));
    }

    @Test
    void list_nonAdmin_isForbidden_BR_NK_01() throws Exception {
        UUID teacher = data.teacher("GV");
        mockMvc.perform(get(LOGS).header(HttpHeaders.AUTHORIZATION, data.bearer(teacher, Role.TEACHER)))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- mở đối tượng (UC-NK-01 luồng 6a)

    @Test
    void detail_existingLesson_canBeOpened_deletedOneCannot_AC_NK_04() throws Exception {
        UUID teacher = data.teacher(base + " GV");
        UUID airport = data.lesson(teacher, base + " Airport Check-in", true);
        UUID interview = data.lesson(teacher, base + " Job Interview", true);
        data.deleteLesson(interview);
        long open = log("GV", "teacher", "publish", "lesson", airport, base + " Airport Check-in", daysAgo(1));
        long gone = log("Tâm", "admin", "delete", "lesson", interview, base + " Job Interview", daysAgo(1));

        asAdmin(get(LOGS + "/" + open)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.open.type").value("LESSON"))
                .andExpect(jsonPath("$.data.open.id").value(airport.toString()));
        asAdmin(get(LOGS + "/" + gone)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.open").doesNotExist());
    }

    @Test
    void detail_report_showsContainerNameAndOpensContainer_BR_NK_17() throws Exception {
        UUID teacher = data.teacher(base + " GV");
        UUID deck = data.deck(teacher, base + " TOEIC 1", true);
        long id = log("GV", "teacher", "reject", "report", UUID.randomUUID(), "invoice", "deck", deck,
                "{\"status\":{\"old\":\"waiting_teacher\",\"new\":\"rejected\"}}", daysAgo(1));

        asAdmin(get(LOGS + "/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.parentName").value(base + " TOEIC 1"))
                .andExpect(jsonPath("$.data.open.type").value("DECK"))
                .andExpect(jsonPath("$.data.open.id").value(deck.toString()))
                .andExpect(jsonPath("$.data.changes.status.old").value("waiting_teacher"));
    }

    @Test
    void detail_userAndCreditSettings_canAlwaysBeOpened_BR_NK_17() throws Exception {
        UUID user = data.teacher(base + " An");
        long locked = log("Tâm", "admin", "lock", "user", user, base + " An", daysAgo(1));
        long settings = log("Tâm", "admin", "update", "settings", null, "Cấu hình credit", daysAgo(1));

        asAdmin(get(LOGS + "/" + locked)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.open.type").value("USER"))
                .andExpect(jsonPath("$.data.open.id").value(user.toString()));
        asAdmin(get(LOGS + "/" + settings)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.open.type").value("SETTINGS"));
    }
}
