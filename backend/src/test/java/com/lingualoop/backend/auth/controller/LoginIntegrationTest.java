package com.lingualoop.backend.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, TestClockConfiguration.class })
class LoginIntegrationTest {

    private static final String PASSWORD = "password123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountService userAccountService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MutableClock clock;

    @BeforeEach
    void resetClock() {
        clock.reset();
    }

    private static String uniqueEmail() {
        return "login-" + UUID.randomUUID() + "@x.com";
    }

    private UserAccount createUser(boolean verified) {
        UserAccount account = userAccountService.createLocal(uniqueEmail(), "Minh", passwordEncoder.encode(PASSWORD));
        if (verified) {
            userAccountService.markEmailVerified(account.id());
        }
        return account;
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)));
    }

    @Test
    void login_correctCredentials_returnsAccessTokenAndProfile_AC08() throws Exception {
        UserAccount user = createUser(true);

        MvcResult result = login(user.email(), PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.expiresAt").isNotEmpty())
                .andExpect(jsonPath("$.data.user.id").value(user.id().toString()))
                .andExpect(jsonPath("$.data.user.role").value("student"))
                .andExpect(jsonPath("$.data.user.onboarded").value(false))
                .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist())
                .andReturn();

        String token = JsonPath.read(result.getResponse().getContentAsString(), "$.data.accessToken");
        mockMvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(user.email()));
    }

    @Test
    void login_emailInDifferentCase_succeeds_AC08() throws Exception {
        UserAccount user = createUser(true);

        login(user.email().toUpperCase(), PASSWORD).andExpect(status().isOk());
    }

    @Test
    void login_correctPasswordButEmailNotVerified_returns403AndNoSession_AC10() throws Exception {
        UserAccount user = createUser(false);

        login(user.email(), PASSWORD)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_EMAIL_NOT_VERIFIED"))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void login_wrongPasswordOnUnverifiedAccount_doesNotRevealUnverified_AC10() throws Exception {
        UserAccount user = createUser(false);

        login(user.email(), "wrong-password")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
    }

    @Test
    void login_wrongPassword_returns401WithRemainingAttempts_AC12() throws Exception {
        UserAccount user = createUser(true);

        login(user.email(), "wrong-password")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.details.remainingAttempts").value(4));
        login(user.email(), "wrong-again")
                .andExpect(jsonPath("$.details.remainingAttempts").value(3));
    }

    @Test
    void login_unknownEmail_getsSameResponseAsWrongPassword_AC13() throws Exception {
        UserAccount user = createUser(true);
        String unknown = uniqueEmail();

        for (int attempt = 1; attempt <= 3; attempt++) {
            String known = body(login(user.email(), "wrong-password").andExpect(status().isUnauthorized()));
            String missing = body(login(unknown, "wrong-password").andExpect(status().isUnauthorized()));

            assertThat((Object) JsonPath.read(missing, "$.code")).isEqualTo(JsonPath.read(known, "$.code"));
            assertThat((Object) JsonPath.read(missing, "$.message")).isEqualTo(JsonPath.read(known, "$.message"));
            assertThat((Object) JsonPath.read(missing, "$.details")).isEqualTo(JsonPath.read(known, "$.details"));
            assertThat((Integer) JsonPath.read(missing, "$.details.remainingAttempts")).isEqualTo(5 - attempt);
        }
    }

    @Test
    void login_googleOnlyAccountWithoutPassword_isReportedAsInvalidCredentials_AC13() throws Exception {
        UserAccount user = userAccountService.createLocal(uniqueEmail(), "Gg", null);
        userAccountService.markEmailVerified(user.id());

        login(user.email(), PASSWORD)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.details.remainingAttempts").value(4));
    }

    @Test
    void login_fifthWrongPassword_locksAccountFor15Minutes_AC14() throws Exception {
        UserAccount user = createUser(true);
        for (int i = 0; i < 4; i++) {
            login(user.email(), "wrong-password").andExpect(status().isUnauthorized());
        }

        login(user.email(), "wrong-password")
                .andExpect(status().is(423))
                .andExpect(jsonPath("$.code").value("AUTH_ACCOUNT_LOCKED"))
                .andExpect(jsonPath("$.details.lockedUntil").isNotEmpty());
    }

    @Test
    void login_whileLocked_rejectsEvenCorrectPassword_AC15() throws Exception {
        UserAccount user = createUser(true);
        for (int i = 0; i < 5; i++) {
            login(user.email(), "wrong-password");
        }

        login(user.email(), PASSWORD)
                .andExpect(status().is(423))
                .andExpect(jsonPath("$.code").value("AUTH_ACCOUNT_LOCKED"));
    }

    @Test
    void login_after15Minutes_lockExpiresAndCorrectPasswordWorks_AC14() throws Exception {
        UserAccount user = createUser(true);
        for (int i = 0; i < 5; i++) {
            login(user.email(), "wrong-password");
        }

        clock.advance(Duration.ofMinutes(15).plusSeconds(1));

        login(user.email(), PASSWORD).andExpect(status().isOk());
    }

    @Test
    void login_successResetsFailureCounter_AC08() throws Exception {
        UserAccount user = createUser(true);
        login(user.email(), "wrong-password");
        login(user.email(), "wrong-password");

        login(user.email(), PASSWORD).andExpect(status().isOk());

        login(user.email(), "wrong-password")
                .andExpect(jsonPath("$.details.remainingAttempts").value(4));
    }

    @Test
    void login_disabledAccountWithCorrectPassword_returns403_AC16() throws Exception {
        UserAccount user = createUser(true);
        jdbcTemplate.update("UPDATE users SET disabled = true WHERE id = ?", user.id());

        login(user.email(), PASSWORD)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_ACCOUNT_DISABLED"));
    }

    @Test
    void login_disabledAccountWithWrongPassword_doesNotRevealDisabled_AC16() throws Exception {
        UserAccount user = createUser(true);
        jdbcTemplate.update("UPDATE users SET disabled = true WHERE id = ?", user.id());

        login(user.email(), "wrong-password")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
    }

    @Test
    void login_passwordLongerThan72Bytes_isJustWrongCredentialsNotServerError_AC12() throws Exception {
        UserAccount user = createUser(true);

        login(user.email(), "ế".repeat(100))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
    }

    @Test
    void login_blankFields_returnsValidationFailed() throws Exception {
        login("", "")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    private String body(ResultActions actions) throws Exception {
        return actions.andReturn().getResponse().getContentAsString();
    }
}
