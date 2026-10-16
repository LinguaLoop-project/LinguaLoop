package com.lingualoop.backend.user.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.enums.ConsentType;
import com.lingualoop.backend.user.service.ConsentService;
import com.lingualoop.backend.user.service.UserAccountService;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ConsentControllerIntegrationTest {

    private static final String BASE = "/api/v1/me/consents";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private ConsentService consentService;

    @Test
    void withoutToken_allEndpointsReturn401() throws Exception {
        mockMvc.perform(get(BASE))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        mockMvc.perform(put(BASE + "/voice_storage")).andExpect(status().isUnauthorized());
        mockMvc.perform(delete(BASE + "/voice_storage")).andExpect(status().isUnauthorized());
    }

    @Test
    void get_returnsGrantedTypesOnly() throws Exception {
        UUID user = newUser();
        consentService.grant(user, ConsentType.VOICE_STORAGE);
        consentService.grant(user, ConsentType.AI_PROCESSING);
        consentService.revoke(user, ConsentType.AI_PROCESSING);

        mockMvc.perform(get(BASE).header(HttpHeaders.AUTHORIZATION, bearer(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0]").value("voice_storage"));
    }

    @Test
    void get_forUserWithoutConsent_returnsEmptyList() throws Exception {
        mockMvc.perform(get(BASE).header(HttpHeaders.AUTHORIZATION, bearer(newUser())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void put_grantsConsentAndReturns204() throws Exception {
        UUID user = newUser();

        mockMvc.perform(put(BASE + "/ai_processing").header(HttpHeaders.AUTHORIZATION, bearer(user)))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        assertThat(consentService.hasConsent(user, ConsentType.AI_PROCESSING))
                .isTrue();
    }

    @Test
    void put_twice_isIdempotentAndStill204() throws Exception {
        String token = bearer(newUser());

        mockMvc.perform(put(BASE + "/voice_storage").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isNoContent());
        mockMvc.perform(put(BASE + "/voice_storage").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_revokesConsentAndReturns204() throws Exception {
        UUID user = newUser();
        consentService.grant(user, ConsentType.VOICE_STORAGE);

        mockMvc.perform(delete(BASE + "/voice_storage").header(HttpHeaders.AUTHORIZATION, bearer(user)))
                .andExpect(status().isNoContent());

        assertThat(consentService.hasConsent(user, ConsentType.VOICE_STORAGE))
                .isFalse();
    }

    @Test
    void delete_withoutPriorGrant_stillReturns204() throws Exception {
        mockMvc.perform(delete(BASE + "/voice_storage").header(HttpHeaders.AUTHORIZATION, bearer(newUser())))
                .andExpect(status().isNoContent());
    }

    @Test
    void unknownType_returns400WithCommonErrorFormat() throws Exception {
        String token = bearer(newUser());

        mockMvc.perform(put(BASE + "/marketing").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.path").value(BASE + "/marketing"));
        mockMvc.perform(delete(BASE + "/marketing").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    private UUID newUser() {
        return userAccountService.createLocal("cc-" + UUID.randomUUID() + "@x.com", "Consent", "h").id();
    }

    private String bearer(UUID userId) {
        return "Bearer " + jwtTokenService.issueAccessToken(userId, Role.STUDENT, UUID.randomUUID()).token();
    }
}
