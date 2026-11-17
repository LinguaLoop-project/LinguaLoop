package com.lingualoop.backend.user.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.test.web.servlet.MockMvc;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private UserAccountService userAccountService;

    @Test
    void me_withValidToken_returnsProfile() throws Exception {
        UserAccountView account = userAccountService.createLocal(
                "me-" + UUID.randomUUID() + "@x.com", "Minh", "bcrypt-hash");

        mockMvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, bearer(account.id())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(account.id().toString()))
                .andExpect(jsonPath("$.data.email").value(account.email()))
                .andExpect(jsonPath("$.data.displayName").value("Minh"))
                .andExpect(jsonPath("$.data.role").value("student"))
                .andExpect(jsonPath("$.data.emailVerified").value(false))
                .andExpect(jsonPath("$.data.onboarded").value(false))
                .andExpect(jsonPath("$.data.hasPassword").value(true))
                .andExpect(jsonPath("$.data.googleLinked").value(false))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
    }

    @Test
    void me_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void me_tokenOfDeletedUser_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, bearer(UUID.randomUUID())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_exposesLearningProfileDefaults() throws Exception {
        UserAccountView account = userAccountService.createLocal(
                "me-" + UUID.randomUUID() + "@x.com", "Minh", "bcrypt-hash");

        mockMvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, bearer(account.id())))
                .andExpect(jsonPath("$.data.dailyMinutes").value(15))
                .andExpect(jsonPath("$.data.uiLanguage").value("vi"))
                .andExpect(jsonPath("$.data.timezone").value("Asia/Ho_Chi_Minh"))
                .andExpect(jsonPath("$.data.termsAccepted").value(true));
    }

    @Test
    void saveLearningProfile_valid_marksOnboardedAndReturnsProfile() throws Exception {
        UserAccountView account = userAccountService.createFromGoogle(
                "sub-" + UUID.randomUUID(), "lp-" + UUID.randomUUID() + "@x.com", "Linh", null);

        mockMvc.perform(put("/api/v1/users/me/learning-profile")
                        .header(HttpHeaders.AUTHORIZATION, bearer(account.id()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":" Linh Tran ","dailyMinutes":30,"uiLanguage":"en",
                                 "timezone":"Asia/Tokyo","acceptTerms":true}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.displayName").value("Linh Tran"))
                .andExpect(jsonPath("$.data.onboarded").value(true))
                .andExpect(jsonPath("$.data.dailyMinutes").value(30))
                .andExpect(jsonPath("$.data.uiLanguage").value("en"))
                .andExpect(jsonPath("$.data.timezone").value("Asia/Tokyo"))
                .andExpect(jsonPath("$.data.termsAccepted").value(true));
    }

    @Test
    void saveLearningProfile_blankName_returns400WithFieldError() throws Exception {
        UserAccountView account = userAccountService.createLocal(
                "lp-" + UUID.randomUUID() + "@x.com", "Minh", "bcrypt-hash");

        mockMvc.perform(put("/api/v1/users/me/learning-profile")
                        .header(HttpHeaders.AUTHORIZATION, bearer(account.id()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"  ","dailyMinutes":15,"uiLanguage":"vi",
                                 "timezone":"Asia/Ho_Chi_Minh","acceptTerms":false}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("displayName"));
    }

    @Test
    void saveLearningProfile_invalidMinutes_returns400() throws Exception {
        UserAccountView account = userAccountService.createLocal(
                "lp-" + UUID.randomUUID() + "@x.com", "Minh", "bcrypt-hash");

        mockMvc.perform(put("/api/v1/users/me/learning-profile")
                        .header(HttpHeaders.AUTHORIZATION, bearer(account.id()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"Minh","dailyMinutes":25,"uiLanguage":"vi",
                                 "timezone":"Asia/Ho_Chi_Minh","acceptTerms":true}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("dailyMinutes"));
    }

    @Test
    void saveLearningProfile_googleUserWithoutTerms_returns400() throws Exception {
        UserAccountView account = userAccountService.createFromGoogle(
                "sub-" + UUID.randomUUID(), "lp-" + UUID.randomUUID() + "@x.com", "Linh", null);

        mockMvc.perform(put("/api/v1/users/me/learning-profile")
                        .header(HttpHeaders.AUTHORIZATION, bearer(account.id()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"Linh","dailyMinutes":15,"uiLanguage":"vi",
                                 "timezone":"Asia/Ho_Chi_Minh","acceptTerms":false}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("acceptTerms"));
    }

    @Test
    void saveLearningProfile_withoutToken_returns401() throws Exception {
        mockMvc.perform(put("/api/v1/users/me/learning-profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    private String bearer(UUID userId) {
        return "Bearer " + jwtTokenService.issueAccessToken(userId, Role.STUDENT, UUID.randomUUID()).token();
    }
}
