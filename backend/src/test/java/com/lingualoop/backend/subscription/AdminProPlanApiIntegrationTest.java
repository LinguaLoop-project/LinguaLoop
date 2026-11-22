package com.lingualoop.backend.subscription;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.AdminUserTestData;

/**
 * Quản lý gói Pro (UC-GA-03 đến 06). Bảng gói dùng chung giữa các test nên mỗi test đặt tên gói với tiền tố
 * {@link #base} và chỉ xét các gói có tiền tố đó.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, AdminUserTestData.class})
class AdminProPlanApiIntegrationTest {

    private static final String PLANS = "/api/v1/admin/pro-plans";

    @Autowired private MockMvc mockMvc;
    @Autowired private AdminUserTestData data;
    @Autowired private JdbcTemplate jdbc;

    private final String base = "ga" + UUID.randomUUID().toString().substring(0, 8) + " ";
    private UUID admin;

    @BeforeEach
    void setUp() {
        admin = data.admin();
    }

    private ResultActions asAdmin(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request)
            throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, data.bearer(admin, Role.ADMIN)));
    }

    private static String body(String version, String name, Object months, Object price, Object credits) {
        return "{" + (version == null ? "" : "\"version\":\"" + version + "\",")
                + "\"name\":" + (name == null ? "null" : "\"" + name + "\"")
                + ",\"months\":" + months + ",\"priceVnd\":" + price + ",\"creditsPerMonth\":" + credits + "}";
    }

    private ResultActions create(String name, Object months, Object price, Object credits) throws Exception {
        return asAdmin(post(PLANS).contentType(MediaType.APPLICATION_JSON)
                .content(body(null, name, months, price, credits)));
    }

    /** Thêm gói và trả về {@code [id, version]}. */
    private String[] created(String name, int months, int price, int credits) throws Exception {
        String json = create(name, months, price, credits).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return new String[] {JsonPath.read(json, "$.data.id"), JsonPath.read(json, "$.data.version")};
    }

    private ResultActions update(String[] plan, String name, Object months, Object price, Object credits)
            throws Exception {
        return asAdmin(put(PLANS + "/" + plan[0]).contentType(MediaType.APPLICATION_JSON)
                .content(body(plan[1], name, months, price, credits)));
    }

    private ResultActions onSale(String id, boolean onSale) throws Exception {
        return asAdmin(post(PLANS + "/" + id + "/on-sale").contentType(MediaType.APPLICATION_JSON)
                .content("{\"onSale\":" + onSale + "}"));
    }

    private void paidOrder(String planId, String planName, int amount) {
        UUID student = data.user(Role.STUDENT, "Học viên");
        Instant start = Instant.now().minusSeconds(3600);
        jdbc.update("""
                INSERT INTO pro_orders (user_id, plan_id, plan_name, months, credits_per_month, amount_vnd, status,
                                        expires_at, paid_at, starts_at, ends_at)
                VALUES (?, ?, ?, 1, 1000, ?, 'paid', ?, ?, ?, ?)""", student, UUID.fromString(planId), planName,
                amount, Timestamp.from(start), Timestamp.from(start), Timestamp.from(start),
                Timestamp.from(start.plusSeconds(30L * 24 * 3600)));
    }

    private int audits(String planId, String action) {
        Integer n = jdbc.queryForObject(
                "SELECT count(*) FROM audit_logs WHERE target_type = 'plan' AND target_id = ? AND action = ?",
                Integer.class, UUID.fromString(planId), action);
        return n == null ? 0 : n;
    }

    // ---------------------------------------------------------------- UC-GA-03

    @Test
    void list_sortedByMonthsWithPurchaseCounts_AC_GA_14() throws Exception {
        String[] year = created(base + "Pro 1 năm", 12, 500_000, 1000);
        String[] month = created(base + "Pro 1 tháng", 1, 50_000, 1000);
        created(base + "Pro 3 tháng", 3, 129_000, 1000);
        onSale(year[0], true).andExpect(status().isOk());
        onSale(month[0], true).andExpect(status().isOk());
        for (int i = 0; i < 12; i++) {
            paidOrder(month[0], base + "Pro 1 tháng", 50_000);
        }
        for (int i = 0; i < 3; i++) {
            paidOrder(year[0], base + "Pro 1 năm", 500_000);
        }

        String json = asAdmin(get(PLANS)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        List<String> names = JsonPath.read(json, "$.data[?(@.name =~ /" + base.trim() + ".*/)].name");
        assertThat(names).containsExactly(base + "Pro 1 tháng", base + "Pro 3 tháng", base + "Pro 1 năm");
        List<Integer> purchases = JsonPath.read(json, "$.data[?(@.name =~ /" + base.trim() + ".*/)].purchases");
        assertThat(purchases).containsExactly(12, 0, 3);
        List<Boolean> onSale = JsonPath.read(json, "$.data[?(@.name =~ /" + base.trim() + ".*/)].onSale");
        assertThat(onSale).containsExactly(true, false, true);
    }

    @Test
    void list_byTeacher_isForbidden() throws Exception {
        UUID teacher = data.teacher("Giáo viên");
        mockMvc.perform(get(PLANS).header(HttpHeaders.AUTHORIZATION, data.bearer(teacher, Role.TEACHER)))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- UC-GA-04

    @Test
    void create_savesPlanNotOnSale_AC_GA_17() throws Exception {
        create("  " + base + "Pro 1 tháng ", 1, 50_000, 1000).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value(base + "Pro 1 tháng"))
                .andExpect(jsonPath("$.data.months").value(1))
                .andExpect(jsonPath("$.data.priceVnd").value(50_000))
                .andExpect(jsonPath("$.data.creditsPerMonth").value(1000))
                .andExpect(jsonPath("$.data.onSale").value(false))
                .andExpect(jsonPath("$.data.purchases").value(0));
        String id = jdbc.queryForObject("SELECT id::text FROM pro_plans WHERE name = ?", String.class,
                base + "Pro 1 tháng");
        assertThat(audits(id, "create")).isEqualTo(1);
    }

    @Test
    void create_freePlan_isAllowed_AC_GA_42() throws Exception {
        create(base + "Pro dùng thử", 1, 0, 100).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.priceVnd").value(0))
                .andExpect(jsonPath("$.data.onSale").value(false));
    }

    @Test
    void create_invalidValues_savesNothing_AC_GA_20() throws Exception {
        create("   ", 1, 50_000, 1000).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"));
        create(base + "x".repeat(50), 1, 50_000, 1000).andExpect(status().isBadRequest());
        create(base + "A", 0, 50_000, 1000).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("months"));
        create(base + "A", 37, 50_000, 1000).andExpect(status().isBadRequest());
        create(base + "A", 1, -1, 1000).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("priceVnd"));
        create(base + "A", 1, 50_000, 1_000_001).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("creditsPerMonth"));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pro_plans WHERE name LIKE ?", Integer.class,
                base + "%")).isZero();
    }

    @Test
    void create_duplicateNameIgnoringCase_isRefused_AC_GA_21() throws Exception {
        created(base + "Pro 1 tháng", 1, 50_000, 1000);
        create(base.toUpperCase() + "pro 1 THÁNG", 1, 60_000, 1000).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PRO_PLAN_NAME_TAKEN"));
    }

    // ---------------------------------------------------------------- UC-GA-05

    @Test
    void update_price_keepsPaidOrdersAsBought_AC_GA_23() throws Exception {
        String[] plan = created(base + "Pro 1 tháng", 1, 50_000, 1000);
        paidOrder(plan[0], base + "Pro 1 tháng", 50_000);

        update(plan, base + "Pro 1 tháng", 1, 60_000, 1000).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.priceVnd").value(60_000))
                .andExpect(jsonPath("$.data.purchases").value(1));
        assertThat(jdbc.queryForObject("SELECT amount_vnd FROM pro_orders WHERE plan_id = ?", Integer.class,
                UUID.fromString(plan[0]))).isEqualTo(50_000);
        assertThat(audits(plan[0], "update")).isEqualTo(1);
    }

    @Test
    void update_nameAndMonths_AC_GA_24() throws Exception {
        String[] plan = created(base + "Pro 1 tháng", 1, 50_000, 1000);
        update(plan, base + "Pro 1 năm", 12, 500_000, 1000).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value(base + "Pro 1 năm"))
                .andExpect(jsonPath("$.data.months").value(12));
    }

    @Test
    void update_withoutChanges_isRefused_AC_GA_26() throws Exception {
        String[] plan = created(base + "Pro 1 tháng", 1, 50_000, 1000);
        update(plan, base + "Pro 1 tháng", 1, 50_000, 1000).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PRO_PLAN_UNCHANGED"));
        assertThat(audits(plan[0], "update")).isZero();
    }

    @Test
    void update_invalidValues_isRefused_AC_GA_27() throws Exception {
        String[] plan = created(base + "Pro 3 tháng", 3, 129_000, 1000);
        update(plan, base + "Pro 3 tháng", 3, null, 1000).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("priceVnd"));
        update(plan, base + "Pro 3 tháng", 3, 129_000, 1_000_001).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("creditsPerMonth"));
    }

    @Test
    void update_toAnotherPlansName_isRefused_AC_GA_28() throws Exception {
        created(base + "Pro 1 tháng", 1, 50_000, 1000);
        String[] three = created(base + "Pro 3 tháng", 3, 129_000, 1000);
        update(three, base + "Pro 1 tháng", 3, 129_000, 1000).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PRO_PLAN_NAME_TAKEN"));
    }

    @Test
    void update_afterAnotherAdminSaved_isRefused_AC_GA_29() throws Exception {
        String[] plan = created(base + "Pro 1 tháng", 1, 50_000, 1000);
        update(plan, base + "Pro 1 tháng", 1, 55_000, 1000).andExpect(status().isOk());
        update(plan, base + "Pro 1 tháng", 1, 70_000, 1000).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PRO_PLAN_STALE"));
        assertThat(jdbc.queryForObject("SELECT price_vnd FROM pro_plans WHERE id = ?", Integer.class,
                UUID.fromString(plan[0]))).isEqualTo(55_000);
    }

    @Test
    void update_againWithTheReturnedVersion_succeeds() throws Exception {
        String[] plan = created(base + "Pro 1 tháng", 1, 50_000, 1000);
        String json = update(plan, base + "Pro 1 tháng", 1, 55_000, 1000).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String[] next = {plan[0], JsonPath.read(json, "$.data.version")};
        update(next, base + "Pro 1 tháng", 1, 60_000, 1000).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.priceVnd").value(60_000));
    }

    @Test
    void update_unknownPlan_isNotFound() throws Exception {
        update(new String[] {UUID.randomUUID().toString(), Instant.now().toString()}, base + "X", 1, 1, 1)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PRO_PLAN_NOT_FOUND"));
    }

    // ---------------------------------------------------------------- UC-GA-06

    @Test
    void onSale_thenStopSelling_keepsPaidOrders_AC_GA_31_32() throws Exception {
        String[] plan = created(base + "Pro 3 tháng", 3, 129_000, 1000);
        onSale(plan[0], true).andExpect(status().isOk()).andExpect(jsonPath("$.data.onSale").value(true));
        paidOrder(plan[0], base + "Pro 3 tháng", 129_000);

        onSale(plan[0], false).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.onSale").value(false))
                .andExpect(jsonPath("$.data.purchases").value(1));
        assertThat(jdbc.queryForObject("SELECT status FROM pro_orders WHERE plan_id = ?", String.class,
                UUID.fromString(plan[0]))).isEqualTo("paid");
        assertThat(audits(plan[0], "publish")).isEqualTo(1);
        assertThat(audits(plan[0], "unpublish")).isEqualTo(1);
    }

    @Test
    void onSale_alreadyInThatState_isRefusedWithCurrentState_AC_GA_35() throws Exception {
        String[] plan = created(base + "Pro 1 tháng", 1, 50_000, 1000);
        onSale(plan[0], false).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PRO_PLAN_STATUS_UNCHANGED"))
                .andExpect(jsonPath("$.details.onSale").value(false));
        assertThat(audits(plan[0], "unpublish")).isZero();
    }
}
