package com.lingualoop.backend.user.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.AdminUserTestData;

/** Cấp credit cho giáo viên (UC-GA-07, BR-GA-11). */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, AdminUserTestData.class})
class AdminTeacherCreditApiIntegrationTest {

    private static final String USERS = "/api/v1/admin/users/";

    @Autowired private MockMvc mockMvc;
    @Autowired private AdminUserTestData data;

    private UUID admin;

    @BeforeEach
    void setUp() {
        admin = data.admin();
    }

    private ResultActions grant(UUID userId, String body) throws Exception {
        return mockMvc.perform(post(USERS + userId + "/credits")
                .header(HttpHeaders.AUTHORIZATION, data.bearer(admin, Role.ADMIN))
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private static String body(Object credits, String note) {
        return "{\"credits\":" + credits + ",\"note\":" + (note == null ? "null" : "\"" + note + "\"") + "}";
    }

    @Test
    void grant_addsToBalance_recordsAuditAndNotifiesTeacher_AC_GA_37() throws Exception {
        UUID teacher = data.teacher("Lê Thanh");
        data.setCredits(teacher, 200);

        grant(teacher, body(500, "  Cấp credit soạn bài tháng 11 ")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.creditBalance").value(700));

        assertThat(data.walletBalance(teacher)).isEqualTo(700);
        assertThat(data.walletHasReset(teacher)).isFalse();
        assertThat(data.countAudit(teacher, "grant_credit")).isEqualTo(1);
        assertThat(data.auditNote(teacher, "grant_credit")).isEqualTo("Cấp 500 credit: Cấp credit soạn bài tháng 11");
        assertThat(data.notifications(teacher)).singleElement().asString().contains("500 credit");
    }

    @Test
    void grant_invalidAmountOrNote_grantsNothing_AC_GA_39() throws Exception {
        UUID teacher = data.teacher("Giáo viên kiểm tra");
        data.setCredits(teacher, 200);

        for (Object credits : new Object[] {"null", 0, -5, "\"abc\"", 1_000_001}) {
            grant(teacher, body(credits, "Ghi chú")).andExpect(status().isBadRequest());
        }
        grant(teacher, body(100, "   ")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("note"));
        grant(teacher, body(100, "x".repeat(501))).andExpect(status().isBadRequest());

        assertThat(data.walletBalance(teacher)).isEqualTo(200);
        assertThat(data.countAudit(teacher, "grant_credit")).isZero();
    }

    @Test
    void grant_toLockedTeacherOrStudent_isRefused_AC_GA_40() throws Exception {
        UUID locked = data.teacher("Nguyễn An");
        data.setCredits(locked, 200);
        data.lock(locked);
        UUID student = data.user(Role.STUDENT, "Học viên");

        grant(locked, body(100, "Cấp thêm")).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CREDIT_GRANT_NOT_ALLOWED"));
        grant(student, body(100, "Cấp thêm")).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CREDIT_GRANT_NOT_ALLOWED"));

        assertThat(data.walletBalance(locked)).isEqualTo(200);
        assertThat(data.countAudit(locked, "grant_credit")).isZero();
        assertThat(data.notifications(locked)).isEmpty();
    }

    @Test
    void detail_ofLockedTeacher_stillShowsBalance_AC_GA_43() throws Exception {
        UUID teacher = data.teacher("Nguyễn An");
        data.setCredits(teacher, 200);
        data.lock(teacher);

        mockMvc.perform(get(USERS + teacher).header(HttpHeaders.AUTHORIZATION, data.bearer(admin, Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.locked").value(true))
                .andExpect(jsonPath("$.data.creditBalance").value(200));
    }

    @Test
    void grant_byTeacher_isForbidden() throws Exception {
        UUID teacher = data.teacher("Giáo viên");
        mockMvc.perform(post(USERS + teacher + "/credits")
                .header(HttpHeaders.AUTHORIZATION, data.bearer(teacher, Role.TEACHER))
                .contentType(MediaType.APPLICATION_JSON).content(body(100, "Tự cấp")))
                .andExpect(status().isForbidden());
    }
}
