package com.lingualoop.backend.credit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.AdminUserTestData;

/**
 * Cấu hình credit (UC-GA-01, UC-GA-02). Cấu hình là một dòng dùng chung cho mọi test nên mỗi test khôi phục giá trị
 * mặc định (V20261121_1000) khi kết thúc.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, AdminUserTestData.class})
class AdminCreditConfigApiIntegrationTest {

    private static final String CONFIG = "/api/v1/admin/credit-config";
    private static final ObjectMapper JSON = new ObjectMapper();

    @Autowired private MockMvc mockMvc;
    @Autowired private AdminUserTestData data;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private CreditService credits;

    private UUID admin;

    @BeforeEach
    void setUp() {
        admin = data.user(Role.ADMIN, "Lê Hùng");
        restoreDefaults();
    }

    @AfterEach
    void restoreDefaults() {
        jdbc.update("""
                UPDATE ai_settings SET credit_value_vnd = 25, gateway_fee_pct = 3, margin_pct = 40,
                    trial_credits = 100, updated_by = NULL, updated_at = now() WHERE id = 1""");
        Object[][] rows = {
            {"shadowing_feedback", 2, 19575, 97875, 0}, {"tutor_session", 3, 78300, 313200, 0},
            {"lesson_chat", 5, 78300, 313200, 0}, {"lesson_suggest", 1, 19575, 97875, 0},
            {"lesson_import", 10, 0, 0, 131}};
        for (Object[] r : rows) {
            jdbc.update("""
                    UPDATE ai_feature_prices SET credits_per_use = ?, input_price_vnd = ?, output_price_vnd = ?,
                        fixed_cost_vnd = ? WHERE feature = ?""", r[1], r[2], r[3], r[4], r[0]);
        }
    }

    private ResultActions getConfig() throws Exception {
        return mockMvc.perform(get(CONFIG).header(HttpHeaders.AUTHORIZATION, data.bearer(admin, Role.ADMIN)));
    }

    /** Cấu hình hiện hành dưới dạng thân yêu cầu sửa (đủ giá trị và phiên bản). */
    @SuppressWarnings("unchecked")
    private Map<String, Object> current() throws Exception {
        String body = getConfig().andReturn().getResponse().getContentAsString();
        Map<String, Object> view = (Map<String, Object>) JSON.readValue(body, Map.class).get("data");
        Map<String, Object> request = new LinkedHashMap<>();
        for (String key : List.of("version", "creditValueVnd", "gatewayFeePct", "marginPct", "trialCredits",
                "features")) {
            request.put(key, view.get(key));
        }
        return request;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> feature(Map<String, Object> request, String feature) {
        return ((List<Map<String, Object>>) request.get("features")).stream()
                .filter(f -> feature.equals(f.get("feature"))).findFirst().orElseThrow();
    }

    private ResultActions save(Map<String, Object> request) throws Exception {
        return mockMvc.perform(put(CONFIG).header(HttpHeaders.AUTHORIZATION, data.bearer(admin, Role.ADMIN))
                .contentType(MediaType.APPLICATION_JSON).content(JSON.writeValueAsString(request)));
    }

    private int auditCount() {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM audit_logs WHERE target_type = 'settings' AND actor_id = ?",
                Integer.class, admin);
        return n == null ? 0 : n;
    }

    // ---------------------------------------------------------------- UC-GA-01

    @Test
    void get_showsSettingsFeatureTableAndLastEditor_AC_GA_01() throws Exception {
        // Trigger set_updated_at đặt updated_at = now() khi sửa dòng, nên so với giá trị đọc lại từ DB
        jdbc.update("UPDATE ai_settings SET updated_by = ? WHERE id = 1", admin);
        String editedAt = jdbc.queryForObject("SELECT updated_at FROM ai_settings WHERE id = 1", Timestamp.class)
                .toInstant().toString();

        getConfig().andExpect(status().isOk())
                .andExpect(jsonPath("$.data.creditValueVnd").value(25))
                .andExpect(jsonPath("$.data.gatewayFeePct").value(3.0))
                .andExpect(jsonPath("$.data.marginPct").value(40.0))
                .andExpect(jsonPath("$.data.trialCredits").value(100))
                .andExpect(jsonPath("$.data.features.length()").value(5))
                .andExpect(jsonPath("$.data.features[0].feature").value("shadowing_feedback"))
                .andExpect(jsonPath("$.data.features[0].creditsPerUse").value(2))
                .andExpect(jsonPath("$.data.features[4].feature").value("lesson_import"))
                .andExpect(jsonPath("$.data.features[4].fixedCostVnd").value(131))
                .andExpect(jsonPath("$.data.updatedBy.displayName").value("Lê Hùng"))
                .andExpect(jsonPath("$.data.updatedAt").value(editedAt));
    }

    @Test
    void get_neverEdited_hasNoEditor_AC_GA_02() throws Exception {
        getConfig().andExpect(status().isOk())
                .andExpect(jsonPath("$.data.updatedBy").value(nullValue()))
                .andExpect(jsonPath("$.data.updatedAt").value(nullValue()))
                .andExpect(jsonPath("$.data.version").exists());
    }

    @Test
    void get_byTeacher_isForbidden() throws Exception {
        UUID teacher = data.teacher("Giáo viên");
        mockMvc.perform(get(CONFIG).header(HttpHeaders.AUTHORIZATION, data.bearer(teacher, Role.TEACHER)))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- UC-GA-02

    @Test
    void update_savesNewValues_recordsEditorAndKeepsGrantedTrialBalances_AC_GA_04() throws Exception {
        UUID studentA = data.user(Role.STUDENT, "Học viên A");
        assertThat(credits.balanceOf(studentA).balance()).isEqualTo(100);
        jdbc.update("UPDATE ai_wallets SET balance = 12 WHERE user_id = ?", studentA);

        Map<String, Object> request = current();
        request.put("trialCredits", 150);
        request.put("marginPct", 35);
        save(request).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trialCredits").value(150))
                .andExpect(jsonPath("$.data.marginPct").value(35))
                .andExpect(jsonPath("$.data.updatedBy.id").value(admin.toString()))
                .andExpect(jsonPath("$.data.updatedAt").exists());

        assertThat(auditCount()).isEqualTo(1);
        String changes = jdbc.queryForObject(
                "SELECT changes::text FROM audit_logs WHERE target_type = 'settings' AND actor_id = ?", String.class,
                admin);
        assertThat(changes).contains("trialCredits", "marginPct").doesNotContain("creditValueVnd");
        assertThat(credits.balanceOf(studentA).balance()).isEqualTo(12);
        UUID studentB = data.user(Role.STUDENT, "Học viên B");
        assertThat(credits.balanceOf(studentB).balance()).isEqualTo(150);
    }

    @Test
    void update_creditsPerUse_changesShownPriceAndNextCharge_AC_GA_05() throws Exception {
        UUID student = data.user(Role.STUDENT, "Học viên A");
        credits.charge(student, AiFeature.SHADOWING_FEEDBACK, AiUsage.tokens(100, 10, "m"));

        Map<String, Object> request = current();
        feature(request, "shadowing_feedback").put("creditsPerUse", 3);
        save(request).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.features[0].creditsPerUse").value(3));

        mockMvc.perform(get("/api/v1/credits/prices").header(HttpHeaders.AUTHORIZATION,
                data.bearer(student, Role.STUDENT)))
                .andExpect(jsonPath("$.data.shadowing_feedback").value(3));
        credits.charge(student, AiFeature.SHADOWING_FEEDBACK, AiUsage.tokens(100, 10, "m"));
        assertThat(jdbc.queryForList("SELECT credits_charged FROM ai_usage_logs WHERE user_id = ? ORDER BY id",
                Integer.class, student)).containsExactly(2, 3);
    }

    @Test
    void update_unitPrices_doesNotRecomputeLoggedCost_AC_GA_44() throws Exception {
        UUID student = data.user(Role.STUDENT, "Học viên B");
        credits.charge(student, AiFeature.SHADOWING_FEEDBACK, AiUsage.tokens(1200, 250, "m"));

        Map<String, Object> request = current();
        feature(request, "shadowing_feedback").put("inputPriceVnd", 39150);
        feature(request, "shadowing_feedback").put("outputPriceVnd", 195750);
        save(request).andExpect(status().isOk());
        credits.charge(student, AiFeature.SHADOWING_FEEDBACK, AiUsage.tokens(1200, 250, "m"));

        assertThat(jdbc.queryForList("SELECT cost_vnd FROM ai_usage_logs WHERE user_id = ? ORDER BY id",
                BigDecimal.class, student)).containsExactly(new BigDecimal("47.96"), new BigDecimal("95.92"));
        assertThat(jdbc.queryForList("SELECT credits_charged FROM ai_usage_logs WHERE user_id = ? ORDER BY id",
                Integer.class, student)).containsExactly(2, 2);
    }

    @Test
    void update_withoutChanges_isRefused_AC_GA_06() throws Exception {
        save(current()).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CREDIT_CONFIG_UNCHANGED"));
        assertThat(auditCount()).isZero();
        getConfig().andExpect(jsonPath("$.data.updatedBy").value(nullValue()));
    }

    @Test
    void update_invalidValues_savesNothing_AC_GA_08() throws Exception {
        Map<String, Object> request = current();
        request.put("creditValueVnd", 0);
        save(request).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("creditValueVnd"));

        request = current();
        request.put("creditValueVnd", null);
        save(request).andExpect(status().isBadRequest());

        request = current();
        request.put("gatewayFeePct", 2.55);
        save(request).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("gatewayFeePct"));

        request = current();
        feature(request, "lesson_chat").put("creditsPerUse", 0);
        save(request).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("features[2].creditsPerUse"));

        assertThat(auditCount()).isZero();
        getConfig().andExpect(jsonPath("$.data.creditValueVnd").value(25))
                .andExpect(jsonPath("$.data.features[2].creditsPerUse").value(5));
    }

    @Test
    void update_feeAndMarginReach100Percent_isRefused_AC_GA_09() throws Exception {
        Map<String, Object> request = current();
        request.put("marginPct", 97);
        save(request).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("CREDIT_CONFIG_FEE_MARGIN_TOO_HIGH"));
        getConfig().andExpect(jsonPath("$.data.marginPct").value(40.0));
    }

    @Test
    void update_twiceWithTheReturnedVersion_succeeds() throws Exception {
        Map<String, Object> request = current();
        request.put("trialCredits", 130);
        String json = save(request).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        request.put("version", com.jayway.jsonpath.JsonPath.read(json, "$.data.version"));
        request.put("trialCredits", 131);
        save(request).andExpect(status().isOk()).andExpect(jsonPath("$.data.trialCredits").value(131));
    }

    @Test
    void update_afterAnotherAdminSaved_isRefusedAndKeepsTheirValue_AC_GA_12() throws Exception {
        Map<String, Object> mine = current();
        Map<String, Object> theirs = current();
        theirs.put("trialCredits", 120);
        save(theirs).andExpect(status().isOk());

        mine.put("marginPct", 35);
        save(mine).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CREDIT_CONFIG_STALE"));
        getConfig().andExpect(jsonPath("$.data.trialCredits").value(120))
                .andExpect(jsonPath("$.data.marginPct").value(40.0));
    }

    @Test
    void update_unknownOrDuplicateFeature_isBadRequest() throws Exception {
        Map<String, Object> request = current();
        feature(request, "lesson_import").put("feature", "lesson_chat");
        save(request).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }
}
