package com.lingualoop.backend.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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

import jakarta.servlet.http.Cookie;

@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, TestClockConfiguration.class })
class SessionIntegrationTest {

    private static final String PASSWORD = "password123";
    private static final String COOKIE = "ll_refresh";

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

    private UserAccount verifiedUser() {
        UserAccount user = userAccountService.createLocal("sess-" + UUID.randomUUID() + "@x.com", "Minh",
                passwordEncoder.encode(PASSWORD));
        userAccountService.markEmailVerified(user.id());
        return user;
    }

    /** Đăng nhập và trả về header Set-Cookie của ll_refresh. */
    private String loginAndGetSetCookie(UserAccount user) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.USER_AGENT, "JUnit-Browser/1.0")
                .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(user.email(), PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();
        return result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
    }

    private MvcResult loginFull(UserAccount user) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(user.email(), PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();
    }

    private static String cookieValue(String setCookieHeader) {
        String pair = setCookieHeader.split(";", 2)[0];
        return pair.substring(pair.indexOf('=') + 1);
    }

    private ResultActions refresh(String cookie) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/refresh")
                .cookie(new Cookie(COOKIE, cookie)));
    }

    @Test
    void login_setsHttpOnlyRefreshCookieScopedToAuthPath_AC08() throws Exception {
        UserAccount user = verifiedUser();

        String setCookie = loginAndGetSetCookie(user);

        assertThat(setCookie).startsWith(COOKIE + "=")
                .contains("HttpOnly")
                .contains("Path=/api/v1/auth")
                .contains("Max-Age=2592000")
                .contains("SameSite=Lax")
                .doesNotContain("Secure");
        assertThat(cookieValue(setCookie)).hasSize(43);
    }

    @Test
    void login_storesRefreshTokenHashNotRawTokenWithUserAgent_AC08() throws Exception {
        UserAccount user = verifiedUser();

        String raw = cookieValue(loginAndGetSetCookie(user));

        var rows = jdbcTemplate.queryForList("SELECT token_hash, user_agent FROM auth_refresh_tokens WHERE user_id = ?",
                user.id());
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).get("token_hash")).isNotEqualTo(raw).asString().hasSize(64);
        assertThat(rows.get(0).get("user_agent")).isEqualTo("JUnit-Browser/1.0");
    }

    @Test
    void login_failedAttempt_setsNoCookie_AC12() throws Exception {
        UserAccount user = verifiedUser();

        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"nope\"}".formatted(user.email())))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));
    }

    @Test
    void refresh_validCookie_rotatesCookieAndReturnsNewSession_AC27() throws Exception {
        UserAccount user = verifiedUser();
        String oldCookie = cookieValue(loginAndGetSetCookie(user));

        MvcResult result = refresh(oldCookie)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.id").value(user.id().toString()))
                .andReturn();

        String newSetCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(cookieValue(newSetCookie)).isNotEqualTo(oldCookie);
        assertThat(newSetCookie).contains("HttpOnly").contains("Max-Age=2592000");
    }

    @Test
    void refresh_withoutCookie_returns401AndClearsCookie_AC27() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REFRESH_INVALID"))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("Max-Age=0")));
    }

    @Test
    void refresh_garbageCookie_returns401AndClearsCookie_AC27() throws Exception {
        refresh("garbage")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REFRESH_INVALID"))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("Max-Age=0")));
    }

    @Test
    void refresh_afterThirtyDaysUnused_returns401_AC27() throws Exception {
        String cookie = cookieValue(loginAndGetSetCookie(verifiedUser()));

        clock.advance(Duration.ofDays(30).plusMinutes(1));

        refresh(cookie).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REFRESH_INVALID"));
    }

    @Test
    void refresh_oldCookieReusedAfterGrace_returns401AndKillsNewCookieToo_AC27() throws Exception {
        String oldCookie = cookieValue(loginAndGetSetCookie(verifiedUser()));
        String newCookie = cookieValue(
                refresh(oldCookie).andExpect(status().isOk()).andReturn().getResponse().getHeader(HttpHeaders.SET_COOKIE));
        clock.advance(Duration.ofSeconds(11));

        refresh(oldCookie).andExpect(status().isUnauthorized());

        refresh(newCookie).andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_oldCookieReusedWithinGrace_stillSucceedsForConcurrentTabs_AC27() throws Exception {
        String oldCookie = cookieValue(loginAndGetSetCookie(verifiedUser()));
        refresh(oldCookie).andExpect(status().isOk());

        refresh(oldCookie).andExpect(status().isOk());
    }

    @Test
    void refresh_disabledUser_returns403AndKillsSession_AC16() throws Exception {
        UserAccount user = verifiedUser();
        String cookie = cookieValue(loginAndGetSetCookie(user));
        jdbcTemplate.update("UPDATE users SET disabled = true WHERE id = ?", user.id());

        refresh(cookie).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_ACCOUNT_DISABLED"));

        refresh(cookie).andExpect(status().isUnauthorized());
    }

    @Test
    void logout_revokesSessionClearsCookieAndRefreshFails_AC25() throws Exception {
        String cookie = cookieValue(loginAndGetSetCookie(verifiedUser()));

        mockMvc.perform(post("/api/v1/auth/logout")
                .cookie(new Cookie(COOKIE, cookie)))
                .andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("Max-Age=0")));

        refresh(cookie).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REFRESH_INVALID"));
    }

    @Test
    void afterLogout_sessionCannotBeRestoredAndProtectedDataNeedsLogin_AC26() throws Exception {
        MvcResult login = loginFull(verifiedUser());
        String cookie = cookieValue(login.getResponse().getHeader(HttpHeaders.SET_COOKIE));
        mockMvc.perform(post("/api/v1/auth/logout")
                .cookie(new Cookie(COOKIE, cookie)))
                .andExpect(status().isNoContent());

        // trình duyệt quay lại / F5: không còn access token trong bộ nhớ và cookie refresh đã chết
        refresh(cookie).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REFRESH_INVALID"));
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    /**
     * Ghi lại giới hạn đã biết của JWT stateless: logout không thu hồi access token đã cấp, nên token cũ dùng được
     * tới khi hết hạn (1 giờ). AC-26 chỉ đúng khi frontend xoá access token khỏi bộ nhớ lúc đăng xuất.
     */
    @Test
    void afterLogout_alreadyIssuedAccessTokenStaysValidUntilItExpires_AC26() throws Exception {
        MvcResult login = loginFull(verifiedUser());
        String cookie = cookieValue(login.getResponse().getHeader(HttpHeaders.SET_COOKIE));
        String accessToken = JsonPath.read(login.getResponse().getContentAsString(), "$.data.accessToken");
        mockMvc.perform(post("/api/v1/auth/logout")
                .cookie(new Cookie(COOKIE, cookie)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    @Test
    void logout_withoutCookie_stillReturns204_AC25() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isNoContent());
    }

    @Test
    void refresh_fromUnknownOrigin_isRejectedByCors_AC27() throws Exception {
        String cookie = cookieValue(loginAndGetSetCookie(verifiedUser()));

        // CSRF: trang lạ gửi form/fetch kèm cookie của nạn nhân; trình duyệt luôn gửi Origin nên CORS chặn (403)
        mockMvc.perform(post("/api/v1/auth/refresh").header(HttpHeaders.ORIGIN, "https://evil.example")
                .cookie(new Cookie(COOKIE, cookie)))
                .andExpect(status().isForbidden());

        // cookie chưa bị tiêu hao: lần refresh hợp lệ từ frontend vẫn thành công
        refresh(cookie).andExpect(status().isOk());
    }

    @Test
    void logout_fromUnknownOrigin_isRejectedByCorsAndSessionSurvives_AC25() throws Exception {
        String cookie = cookieValue(loginAndGetSetCookie(verifiedUser()));

        mockMvc.perform(post("/api/v1/auth/logout").header(HttpHeaders.ORIGIN, "https://evil.example")
                .cookie(new Cookie(COOKIE, cookie)))
                .andExpect(status().isForbidden());

        refresh(cookie).andExpect(status().isOk());
    }

    @Test
    void cors_preflightForRefreshFromFrontendAllowsCredentials_AC27() throws Exception {
        mockMvc.perform(options("/api/v1/auth/refresh")
                .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
    }
}
