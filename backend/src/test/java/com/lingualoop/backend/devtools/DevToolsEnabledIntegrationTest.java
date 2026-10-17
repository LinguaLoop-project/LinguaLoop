package com.lingualoop.backend.devtools;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;
import com.lingualoop.backend.user.service.UserAccountService;

@SpringBootTest(properties = "app.dev-tools.enabled=true")
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class DevToolsEnabledIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private UserAccountService userAccountService;

    @Autowired
    private SubscriptionQueryService subscriptionQueryService;

    @Autowired
    private JdbcClient jdbc;

    @Test
    void newUser_isFree() throws Exception {
        UUID userId = newUser();

        mockMvc.perform(get("/api/v1/subscriptions/me").header(HttpHeaders.AUTHORIZATION, bearer(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.plan").value("free"));
    }

    @Test
    void setPlan_pro_thenFree_switchesRealPlanLookup() throws Exception {
        UUID userId = newUser();

        putPlan(userId, "pro").andExpect(status().isOk()).andExpect(jsonPath("$.data.plan").value("pro"));
        assertThat(subscriptionQueryService.isPro(userId)).isTrue();
        mockMvc.perform(get("/api/v1/subscriptions/me").header(HttpHeaders.AUTHORIZATION, bearer(userId)))
                .andExpect(jsonPath("$.data.plan").value("pro"));

        putPlan(userId, "free").andExpect(status().isOk()).andExpect(jsonPath("$.data.plan").value("free"));
        assertThat(subscriptionQueryService.isPro(userId)).isFalse();
    }

    @Test
    void setPlan_pro_twice_keepsSingleActiveSubscription() throws Exception {
        UUID userId = newUser();

        putPlan(userId, "pro").andExpect(status().isOk());
        putPlan(userId, "pro").andExpect(status().isOk());

        Integer active = jdbc.sql("SELECT count(*) FROM user_subscriptions WHERE user_id = :u AND status = 'active'")
                .param("u", userId).query(Integer.class).single();
        assertThat(active).isEqualTo(1);
        assertThat(subscriptionQueryService.isPro(userId)).isTrue();
    }

    @Test
    void setPlan_invalidValue_returns400() throws Exception {
        putPlan(newUser(), "vip").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void setPlan_withoutToken_returns401() throws Exception {
        mockMvc.perform(put("/api/v1/dev/plan").contentType(MediaType.APPLICATION_JSON).content("{\"plan\":\"pro\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void resetUsage_clearsOnlyCallersCounters() throws Exception {
        UUID me = newUser();
        UUID other = newUser();
        addUsage(me, 5);
        addUsage(other, 3);

        mockMvc.perform(post("/api/v1/dev/usage/reset").header(HttpHeaders.AUTHORIZATION, bearer(me)))
                .andExpect(status().isNoContent());

        assertThat(usedCount(me)).isZero();
        assertThat(usedCount(other)).isEqualTo(1);
    }

    private org.springframework.test.web.servlet.ResultActions putPlan(UUID userId, String plan) throws Exception {
        return mockMvc.perform(put("/api/v1/dev/plan")
                .header(HttpHeaders.AUTHORIZATION, bearer(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"plan\":\"" + plan + "\"}"));
    }

    private void addUsage(UUID userId, int used) {
        jdbc.sql("INSERT INTO usage_counters (user_id, feature, period_start, used) VALUES (:u, 'shadowing_assess', current_date, :n)")
                .param("u", userId).param("n", used).update();
    }

    private int usedCount(UUID userId) {
        return jdbc.sql("SELECT count(*) FROM usage_counters WHERE user_id = :u")
                .param("u", userId).query(Integer.class).single();
    }

    private UUID newUser() {
        return userAccountService.createLocal("dev-" + UUID.randomUUID() + "@x.com", "Dev", "bcrypt-hash").id();
    }

    private String bearer(UUID userId) {
        return "Bearer " + jwtTokenService.issueAccessToken(userId, Role.STUDENT, UUID.randomUUID()).token();
    }
}
