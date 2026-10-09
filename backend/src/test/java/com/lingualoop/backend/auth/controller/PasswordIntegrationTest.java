package com.lingualoop.backend.auth.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.auth.service.RefreshTokenService;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

import jakarta.servlet.http.Cookie;

@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, TestClockConfiguration.class })
class PasswordIntegrationTest {

    private static final String PASSWORD = "password123";
    private static final String NEW_PASSWORD = "newpassword456";
    private static final String COOKIE = "ll_refresh";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountService userAccountService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MutableClock clock;

    @BeforeEach
    void resetClock() {
        clock.reset();
    }

    private UserAccount verifiedUser() {
        UserAccount user = userAccountService.createLocal("pw-" + UUID.randomUUID() + "@x.com", "Minh",
                passwordEncoder.encode(PASSWORD));
        userAccountService.markEmailVerified(user.id());
        return user;
    }

    private ResultActions loginRequest(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)));
    }

    /** Một phiên đăng nhập: access token (có sid) và cookie refresh của phiên đó. */
    private record Login(String accessToken, String refreshCookie) {
    }

    private Login login(UserAccount user) throws Exception {
        MvcResult result = loginRequest(user.email(), PASSWORD).andExpect(status().isOk()).andReturn();
        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        String cookie = setCookie.split(";", 2)[0].substring(COOKIE.length() + 1);
        return new Login(JsonPath.read(result.getResponse().getContentAsString(), "$.data.accessToken"), cookie);
    }

    private ResultActions changePassword(String accessToken, String body) throws Exception {
        return mockMvc.perform(put("/api/v1/users/me/password").contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .content(body));
    }

    private static String body(String current, String next) {
        return current == null
                ? "{\"newPassword\":\"%s\"}".formatted(next)
                : "{\"currentPassword\":\"%s\",\"newPassword\":\"%s\"}".formatted(current, next);
    }

    private ResultActions refresh(String cookie) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/refresh").cookie(new Cookie(COOKIE, cookie)));
    }

    @Test
    void changePassword_keepsCurrentSessionAndRevokesTheOthers_AC41() throws Exception {
        UserAccount user = verifiedUser();
        Login a = login(user);
        Login b = login(user);

        changePassword(a.accessToken(), body(PASSWORD, NEW_PASSWORD)).andExpect(status().isNoContent());

        refresh(b.refreshCookie()).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REFRESH_INVALID"));
        refresh(a.refreshCookie()).andExpect(status().isOk());
        loginRequest(user.email(), PASSWORD).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
        loginRequest(user.email(), NEW_PASSWORD).andExpect(status().isOk());
    }

    @Test
    void changePassword_googleOnlyUserCreatesPasswordWithoutCurrentOne_AC42() throws Exception {
        UserAccount google = userAccountService.createFromGoogle("sub-" + UUID.randomUUID(),
                "pwg-" + UUID.randomUUID() + "@x.com", "Gia", null);
        UUID sid = refreshTokenService.startSession(google.id(), "ua").familyId();
        String token = jwtTokenService.issueAccessToken(google.id(), Role.STUDENT, sid).token();

        changePassword(token, body(null, NEW_PASSWORD)).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hasPassword").value(true))
                .andExpect(jsonPath("$.data.googleLinked").value(true));
    }

    @Test
    void changePassword_afterCreatingOne_googleUserCanLoginWithEmailAndPassword_AC43() throws Exception {
        UserAccount google = userAccountService.createFromGoogle("sub-" + UUID.randomUUID(),
                "pwl-" + UUID.randomUUID() + "@x.com", "Gia", null);
        UUID sid = refreshTokenService.startSession(google.id(), "ua").familyId();
        String token = jwtTokenService.issueAccessToken(google.id(), Role.STUDENT, sid).token();

        changePassword(token, body(null, NEW_PASSWORD)).andExpect(status().isNoContent());

        loginRequest(google.email(), NEW_PASSWORD).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.id").value(google.id().toString()));
    }

    @Test
    void changePassword_wrongCurrentPassword_reportsRemainingAttempts_AC44() throws Exception {
        UserAccount user = verifiedUser();
        Login a = login(user);

        changePassword(a.accessToken(), body("wrong-password", NEW_PASSWORD))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_CURRENT_PASSWORD_WRONG"))
                .andExpect(jsonPath("$.details.remainingAttempts").value(4));

        // mật khẩu không đổi, phiên còn nguyên
        refresh(a.refreshCookie()).andExpect(status().isOk());
        loginRequest(user.email(), PASSWORD).andExpect(status().isOk());
    }

    @Test
    void changePassword_fifthWrongCurrentPassword_locksAccount_AC44() throws Exception {
        UserAccount user = verifiedUser();
        Login a = login(user);

        for (int i = 0; i < 4; i++) {
            changePassword(a.accessToken(), body("wrong-password", NEW_PASSWORD)).andExpect(status().isBadRequest());
        }
        changePassword(a.accessToken(), body("wrong-password", NEW_PASSWORD))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.code").value("AUTH_ACCOUNT_LOCKED"))
                .andExpect(jsonPath("$.details.lockedUntil").isNotEmpty());

        // đang khoá thì đúng mật khẩu cũng không đổi được, và đăng nhập cũng bị khoá
        changePassword(a.accessToken(), body(PASSWORD, NEW_PASSWORD)).andExpect(status().isLocked());
        loginRequest(user.email(), PASSWORD).andExpect(status().isLocked());
    }

    @Test
    void changePassword_missingCurrentPasswordWhenAccountHasOne_isValidationError_AC45() throws Exception {
        Login a = login(verifiedUser());

        changePassword(a.accessToken(), body(null, NEW_PASSWORD))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("currentPassword"))
                .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
    }

    @Test
    void changePassword_newPasswordTooShort_isValidationError_AC45() throws Exception {
        UserAccount user = verifiedUser();
        Login a = login(user);

        changePassword(a.accessToken(), body(PASSWORD, "short12"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("newPassword"))
                .andExpect(jsonPath("$.errors[0].code").value("Size"));

        loginRequest(user.email(), PASSWORD).andExpect(status().isOk());
    }

    @Test
    void changePassword_newPasswordOver72Bytes_isValidationError_AC45() throws Exception {
        Login a = login(verifiedUser());

        // 40 ký tự nhưng 80 byte UTF-8: BCrypt sẽ cắt, nên phải chặn theo byte
        changePassword(a.accessToken(), body(PASSWORD, "\u00e9".repeat(40)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("newPassword"))
                .andExpect(jsonPath("$.errors[0].code").value("MaxBytes"));
    }

    @Test
    void changePassword_missingNewPassword_isValidationError_AC45() throws Exception {
        Login a = login(verifiedUser());

        changePassword(a.accessToken(), "{\"currentPassword\":\"%s\"}".formatted(PASSWORD))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("newPassword"))
                .andExpect(jsonPath("$.errors[0].code").value("NotNull"));
    }

    @Test
    void changePassword_withoutToken_isUnauthorized() throws Exception {
        mockMvc.perform(put("/api/v1/users/me/password").contentType(MediaType.APPLICATION_JSON)
                .content(body(PASSWORD, NEW_PASSWORD)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changePassword_tokenWithoutSessionClaim_revokesEverySession_AC41() throws Exception {
        UserAccount user = verifiedUser();
        Login a = login(user);
        String legacyToken = jwtTokenService.issueAccessToken(user.id(), Role.STUDENT, null).token();

        changePassword(legacyToken, body(PASSWORD, NEW_PASSWORD)).andExpect(status().isNoContent());

        refresh(a.refreshCookie()).andExpect(status().isUnauthorized());
    }
}
