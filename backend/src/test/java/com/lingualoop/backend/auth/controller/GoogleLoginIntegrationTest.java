package com.lingualoop.backend.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.auth.google.GoogleIdTokenVerifier;
import com.lingualoop.backend.auth.google.GoogleIdentity;
import com.lingualoop.backend.auth.google.GoogleUnavailableException;
import com.lingualoop.backend.auth.service.RefreshTokenService;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.support.TestClockConfiguration;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

import jakarta.servlet.http.Cookie;

@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, TestClockConfiguration.class })
class GoogleLoginIntegrationTest {

    private static final String PASSWORD = "password123";
    private static final String COOKIE = "ll_refresh";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountService userAccountService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private GoogleIdTokenVerifier verifier;

    private static String uniqueEmail() {
        return "gl-" + UUID.randomUUID() + "@x.com";
    }

    private static String uniqueSub() {
        return "sub-" + UUID.randomUUID();
    }

    private ResultActions googleLogin(String idToken) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/google").contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.USER_AGENT, "JUnit-Browser/1.0")
                .content("{\"idToken\":\"%s\"}".formatted(idToken)));
    }

    private void tokenResolvesTo(GoogleIdentity identity) {
        when(verifier.verify("tok")).thenReturn(identity);
    }

    private ResultActions passwordLogin(String email) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, PASSWORD)));
    }

    private static String accessTokenOf(MvcResult result) throws Exception {
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.accessToken");
    }

    private static String claims(String accessToken) {
        return new String(Base64.getUrlDecoder().decode(accessToken.split("\\.")[1]), StandardCharsets.UTF_8);
    }

    @Test
    void google_returningGoogleUser_logsIntoSameAccountWithSessionClaim_AC17() throws Exception {
        String sub = uniqueSub();
        UserAccount user = userAccountService.createFromGoogle(sub, uniqueEmail(), "Gia", null);
        tokenResolvesTo(new GoogleIdentity(sub, user.email(), "Gia", null));

        MvcResult result = googleLogin("tok")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.id").value(user.id().toString()))
                .andExpect(jsonPath("$.data.user.googleLinked").value(true))
                .andExpect(jsonPath("$.data.user.hasPassword").value(false))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString(COOKIE + "=")))
                .andReturn();

        String claims = claims(accessTokenOf(result));
        assertThat((String) JsonPath.read(claims, "$.sub")).isEqualTo(user.id().toString());
        assertThat((String) JsonPath.read(claims, "$.sid")).isNotBlank();
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM users WHERE auth_uid = ?", Integer.class, sub))
                .isEqualTo(1);
    }

    @Test
    void google_newEmail_createsVerifiedStudentWithoutPasswordOrTerms_AC18() throws Exception {
        String sub = uniqueSub();
        String email = uniqueEmail();
        tokenResolvesTo(new GoogleIdentity(sub, email, "Hoa Tran", "https://img/h.png"));

        googleLogin("tok")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.email").value(email))
                .andExpect(jsonPath("$.data.user.displayName").value("Hoa Tran"))
                .andExpect(jsonPath("$.data.user.avatarUrl").value("https://img/h.png"))
                .andExpect(jsonPath("$.data.user.role").value("student"))
                .andExpect(jsonPath("$.data.user.emailVerified").value(true))
                .andExpect(jsonPath("$.data.user.onboarded").value(false))
                .andExpect(jsonPath("$.data.user.hasPassword").value(false));

        assertThat(jdbcTemplate.queryForObject("SELECT terms_accepted_at IS NULL FROM users WHERE auth_uid = ?",
                Boolean.class, sub)).isTrue();
    }

    @Test
    void google_emailOfVerifiedLocalAccount_linksAndKeepsPassword_AC19() throws Exception {
        UserAccount local = userAccountService.createLocal(uniqueEmail(), "Minh", passwordEncoder.encode(PASSWORD));
        userAccountService.markEmailVerified(local.id());
        String sub = uniqueSub();
        tokenResolvesTo(new GoogleIdentity(sub, local.email(), "Minh G", null));

        googleLogin("tok")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.id").value(local.id().toString()))
                .andExpect(jsonPath("$.data.user.googleLinked").value(true))
                .andExpect(jsonPath("$.data.user.hasPassword").value(true));

        passwordLogin(local.email()).andExpect(status().isOk());
    }

    @Test
    void google_emailOfUnverifiedLocalAccount_dropsPasswordAndRevokesOldSessions_AC20() throws Exception {
        UserAccount local = userAccountService.createLocal(uniqueEmail(), "Minh", passwordEncoder.encode(PASSWORD));
        String oldRefresh = refreshTokenService.startSession(local.id(), "attacker-browser").rawToken();
        tokenResolvesTo(new GoogleIdentity(uniqueSub(), local.email(), "Minh G", null));

        googleLogin("tok")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.id").value(local.id().toString()))
                .andExpect(jsonPath("$.data.user.emailVerified").value(true))
                .andExpect(jsonPath("$.data.user.hasPassword").value(false));

        passwordLogin(local.email())
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(new Cookie(COOKIE, oldRefresh)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REFRESH_INVALID"));
    }

    @Test
    void google_invalidIdToken_returns401_AC22() throws Exception {
        when(verifier.verify("bad")).thenThrow(new BusinessException(ErrorCode.AUTH_GOOGLE_TOKEN_INVALID));

        googleLogin("bad")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_GOOGLE_TOKEN_INVALID"));
    }

    @Test
    void google_jwksUnavailable_returns503_AC23() throws Exception {
        when(verifier.verify("tok")).thenThrow(new GoogleUnavailableException("down"));

        googleLogin("tok")
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("AUTH_GOOGLE_UNAVAILABLE"));
    }

    @Test
    void google_disabledAccount_returns403_AC24() throws Exception {
        String sub = uniqueSub();
        UserAccount user = userAccountService.createFromGoogle(sub, uniqueEmail(), "Gia", null);
        jdbcTemplate.update("UPDATE users SET disabled = true WHERE id = ?", user.id());
        tokenResolvesTo(new GoogleIdentity(sub, user.email(), "Gia", null));

        googleLogin("tok")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_ACCOUNT_DISABLED"));
    }

    @Test
    void google_emailAlreadyLinkedToOtherGoogleAccount_returns409_AC54() throws Exception {
        UserAccount user = userAccountService.createFromGoogle(uniqueSub(), uniqueEmail(), "Gia", null);
        tokenResolvesTo(new GoogleIdentity(uniqueSub(), user.email(), "Gia", null));

        googleLogin("tok")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AUTH_GOOGLE_LINK_CONFLICT"));
    }

    @Test
    void google_blankIdToken_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/google").contentType(MediaType.APPLICATION_JSON).content("{\"idToken\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void google_issuedAccessToken_worksOnProtectedEndpoint() throws Exception {
        tokenResolvesTo(new GoogleIdentity(uniqueSub(), uniqueEmail(), "Gia", null));

        MvcResult result = googleLogin("tok").andExpect(status().isOk()).andReturn();

        mockMvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + accessTokenOf(result)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.googleLinked").value(true));
    }
}
