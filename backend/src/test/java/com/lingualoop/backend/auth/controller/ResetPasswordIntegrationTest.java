package com.lingualoop.backend.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.auth.mail.AuthMailSender;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

import jakarta.servlet.http.Cookie;

@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, TestClockConfiguration.class })
class ResetPasswordIntegrationTest {

    private static final String OLD_PASSWORD = "password123";
    private static final String NEW_PASSWORD = "newpassword456";
    private static final String COOKIE = "ll_refresh";
    private static final long MAIL_WAIT_MS = 2000;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountService userAccountService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MutableClock clock;

    @MockitoBean
    private AuthMailSender authMailSender;

    @BeforeEach
    void resetClock() {
        clock.reset();
    }

    private static String uniqueEmail() {
        return "reset-" + UUID.randomUUID() + "@x.com";
    }

    private UserAccount verifiedUser() {
        UserAccount user = userAccountService.createLocal(uniqueEmail(), "Minh", passwordEncoder.encode(OLD_PASSWORD));
        userAccountService.markEmailVerified(user.id());
        return user;
    }

    /** Yêu cầu quên mật khẩu qua API rồi trả token thô trong thư đặt lại. */
    private String requestResetToken(String email) throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\"}".formatted(email))).andExpect(status().isAccepted());
        ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);
        verify(authMailSender, timeout(MAIL_WAIT_MS)).sendResetPassword(eq(email), any(), token.capture(),
                anyBoolean());
        return token.getValue();
    }

    private ResultActions reset(String token, String newPassword) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"%s\",\"newPassword\":\"%s\"}".formatted(token, newPassword)));
    }

    private ResultActions validate(String token) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/reset-password/validate").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"%s\"}".formatted(token)));
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)));
    }

    private String loginAndGetRefreshCookie(UserAccount user) throws Exception {
        MvcResult result = login(user.email(), OLD_PASSWORD).andExpect(status().isOk()).andReturn();
        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        return setCookie.split(";", 2)[0].substring(COOKIE.length() + 1);
    }

    private ResultActions refresh(String cookie) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/refresh").cookie(new Cookie(COOKIE, cookie)));
    }

    @Test
    void reset_validToken_changesPasswordAndEndsEverySession_AC35() throws Exception {
        UserAccount user = verifiedUser();
        String sessionA = loginAndGetRefreshCookie(user);
        String sessionB = loginAndGetRefreshCookie(user);
        String token = requestResetToken(user.email());

        reset(token, NEW_PASSWORD).andExpect(status().isNoContent());

        login(user.email(), OLD_PASSWORD).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
        login(user.email(), NEW_PASSWORD).andExpect(status().isOk());
        refresh(sessionA).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REFRESH_INVALID"));
        refresh(sessionB).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REFRESH_INVALID"));
    }

    @Test
    void reset_doesNotIssueSessionOrCookie_AC35() throws Exception {
        UserAccount user = verifiedUser();
        String token = requestResetToken(user.email());

        MvcResult result = reset(token, NEW_PASSWORD).andExpect(status().isNoContent()).andReturn();

        assertThat(result.getResponse().getHeader(HttpHeaders.SET_COOKIE)).isNull();
        assertThat(result.getResponse().getContentAsString()).isEmpty();
    }

    @Test
    void reset_unverifiedAccount_becomesVerifiedAndCanLogin_AC35() throws Exception {
        UserAccount user = userAccountService.createLocal(uniqueEmail(), "Minh", passwordEncoder.encode(OLD_PASSWORD));
        assertThat(user.emailVerified()).isFalse();
        String token = requestResetToken(user.email());

        reset(token, NEW_PASSWORD).andExpect(status().isNoContent());

        assertThat(userAccountService.findById(user.id()).orElseThrow().emailVerified()).isTrue();
        login(user.email(), NEW_PASSWORD).andExpect(status().isOk());
    }

    @Test
    void reset_lockedAccount_canLoginRightAway_AC35() throws Exception {
        UserAccount user = verifiedUser();
        for (int i = 0; i < 5; i++) {
            login(user.email(), "wrong-password");
        }
        login(user.email(), OLD_PASSWORD).andExpect(status().is(423))
                .andExpect(jsonPath("$.code").value("AUTH_ACCOUNT_LOCKED"));
        String token = requestResetToken(user.email());

        reset(token, NEW_PASSWORD).andExpect(status().isNoContent());

        login(user.email(), NEW_PASSWORD).andExpect(status().isOk());
    }

    @Test
    void reset_googleOnlyAccount_canLoginWithEmailPasswordAndStaysGoogleLinked_AC36() throws Exception {
        String email = uniqueEmail();
        userAccountService.createFromGoogle("sub-" + UUID.randomUUID(), email, "Gia", null);
        mockMvc.perform(post("/api/v1/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\"}".formatted(email))).andExpect(status().isAccepted());
        ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);
        verify(authMailSender, timeout(MAIL_WAIT_MS)).sendResetPassword(eq(email), any(), token.capture(), eq(false));

        reset(token.getValue(), NEW_PASSWORD).andExpect(status().isNoContent());

        login(email, NEW_PASSWORD).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.hasPassword").value(true))
                .andExpect(jsonPath("$.data.user.googleLinked").value(true));
    }

    @Test
    void validate_usableToken_returnsValidAndDoesNotConsumeIt_AC39() throws Exception {
        UserAccount user = verifiedUser();
        String token = requestResetToken(user.email());

        validate(token).andExpect(status().isOk()).andExpect(jsonPath("$.data.valid").value(true));
        validate(token).andExpect(status().isOk());

        reset(token, NEW_PASSWORD).andExpect(status().isNoContent());
    }

    @Test
    void validateAndReset_unknownToken_returnLinkInvalid_AC39() throws Exception {
        validate("not-a-real-token").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_LINK_INVALID"));
        reset("not-a-real-token", NEW_PASSWORD).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_LINK_INVALID"));
    }

    @Test
    void validateAndReset_tokenAlreadyUsed_returnLinkInvalidAndKeepsNewPassword_AC39() throws Exception {
        UserAccount user = verifiedUser();
        String token = requestResetToken(user.email());
        reset(token, NEW_PASSWORD).andExpect(status().isNoContent());

        validate(token).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("AUTH_LINK_INVALID"));
        reset(token, "anotherpassword789").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_LINK_INVALID"));

        login(user.email(), NEW_PASSWORD).andExpect(status().isOk());
    }

    @Test
    void validateAndReset_tokenOlderThan30Minutes_returnLinkInvalid_AC39() throws Exception {
        UserAccount user = verifiedUser();
        String token = requestResetToken(user.email());
        clock.advance(Duration.ofMinutes(30).plusSeconds(1));

        validate(token).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("AUTH_LINK_INVALID"));
        reset(token, NEW_PASSWORD).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_LINK_INVALID"));

        login(user.email(), OLD_PASSWORD).andExpect(status().isOk());
    }

    @Test
    void reset_tokenJustInsideTtl_isAccepted_AC35() throws Exception {
        UserAccount user = verifiedUser();
        String token = requestResetToken(user.email());

        clock.advance(Duration.ofMinutes(29).plusSeconds(59));

        reset(token, NEW_PASSWORD).andExpect(status().isNoContent());
    }

    @Test
    void reset_verificationTokenCannotBeUsedAsResetToken_AC39() throws Exception {
        String email = uniqueEmail();
        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(
                "{\"email\":\"%s\",\"password\":\"password123\",\"displayName\":\"Minh\",\"acceptTerms\":true}"
                        .formatted(email)))
                .andExpect(status().isCreated());
        ArgumentCaptor<String> verifyToken = ArgumentCaptor.forClass(String.class);
        verify(authMailSender).sendVerifyEmail(eq(email), any(), verifyToken.capture());

        reset(verifyToken.getValue(), NEW_PASSWORD).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_LINK_INVALID"));
    }

    @Test
    void reset_passwordTooShort_returns400AndKeepsLinkUsable_AC40() throws Exception {
        UserAccount user = verifiedUser();
        String token = requestResetToken(user.email());

        reset(token, "1234567").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("newPassword"))
                .andExpect(jsonPath("$.errors[0].code").value("Size"));

        login(user.email(), OLD_PASSWORD).andExpect(status().isOk());
        reset(token, NEW_PASSWORD).andExpect(status().isNoContent());
    }

    @Test
    void reset_passwordOver72Bytes_returns400_AC40() throws Exception {
        UserAccount user = verifiedUser();
        String token = requestResetToken(user.email());

        reset(token, "a".repeat(73)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("newPassword"));
    }

    @Test
    void reset_passwordWithMultibyteCharsOver72Bytes_returns400_AC40() throws Exception {
        UserAccount user = verifiedUser();
        String token = requestResetToken(user.email());

        // 40 ký tự nhưng 80 byte UTF-8: qua @Size(max=72) mà vẫn phải bị @MaxBytes chặn
        reset(token, "é".repeat(40)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("newPassword"));
    }

    @Test
    void reset_blankToken_returns400ValidationFailed() throws Exception {
        reset("", NEW_PASSWORD).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("token"));
    }
}
