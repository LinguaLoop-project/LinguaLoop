package com.lingualoop.backend.stats.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.AdminUserTestData;

/** Quyền và tham số mặc định của API thống kê hệ thống (BR-NK-01, BR-NK-07). Số liệu kiểm ở test của service. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, AdminUserTestData.class })
class AdminStatsApiIntegrationTest {

    private static final String STATS = "/api/v1/admin/stats";

    @Autowired private MockMvc mockMvc;
    @Autowired private AdminUserTestData data;

    @Test
    void admin_getsEveryStatsPageWithDefaultThirtyDays() throws Exception {
        String bearer = data.bearer(data.admin(), Role.ADMIN);

        mockMvc.perform(get(STATS + "/overview").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.period").value("D30"))
                .andExpect(jsonPath("$.data.daily.days.length()").value(30))
                .andExpect(jsonPath("$.data.computedAt").exists());
        mockMvc.perform(get(STATS + "/practice").param("period", "D7").param("plan", "PRO")
                .header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.plan").value("PRO"))
                .andExpect(jsonPath("$.data.daily.days.length()").value(7));
        mockMvc.perform(get(STATS + "/ai-usage").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.features.length()").value(5));
    }

    @Test
    void teacher_isForbidden_BR_NK_01() throws Exception {
        UUID teacher = data.teacher("GV");
        mockMvc.perform(get(STATS + "/overview").header(HttpHeaders.AUTHORIZATION, data.bearer(teacher, Role.TEACHER)))
                .andExpect(status().isForbidden());
    }

    @Test
    void invalidPeriod_isRejected() throws Exception {
        mockMvc.perform(get(STATS + "/overview").param("period", "D14")
                .header(HttpHeaders.AUTHORIZATION, data.bearer(data.admin(), Role.ADMIN)))
                .andExpect(status().isBadRequest());
    }
}
