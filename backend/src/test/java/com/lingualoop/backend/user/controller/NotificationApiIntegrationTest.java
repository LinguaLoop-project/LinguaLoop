package com.lingualoop.backend.user.controller;

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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.service.NotificationService;
import com.lingualoop.backend.user.service.UserAccountService;

/** Chuông thông báo: xem mới nhất kèm số chưa đọc, đánh dấu đã đọc từng cái hoặc tất cả, chỉ với thông báo của mình. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class NotificationApiIntegrationTest {

    private static final String URL = "/api/v1/notifications";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService users;
    @Autowired private NotificationService notifications;
    @Autowired private JdbcTemplate jdbc;

    private UUID me;
    private UUID other;

    @BeforeEach
    void setUp() {
        me = users.createLocal("n-" + UUID.randomUUID() + "@x.com", "Minh", "hash").id();
        other = users.createLocal("n-" + UUID.randomUUID() + "@x.com", "Lan", "hash").id();
    }

    private ResultActions as(UUID user, AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        String token = jwtTokenService.issueAccessToken(user, Role.STUDENT, UUID.randomUUID()).token();
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token));
    }

    private UUID idOf(UUID user, String message) {
        return jdbc.queryForObject("SELECT id FROM notifications WHERE user_id = ? AND message = ?", UUID.class, user,
                message);
    }

    @Test
    void latest_newestFirstWithUnreadCount_onlyOwn_AC_TK_53() throws Exception {
        notifications.send(me, "Thứ nhất");
        jdbc.update("UPDATE notifications SET created_at = now() - interval '1 hour' WHERE user_id = ?", me);
        notifications.send(me, "Thứ hai");
        notifications.send(other, "Của người khác");

        as(me, get(URL)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(2))
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.items[0].message").value("Thứ hai"))
                .andExpect(jsonPath("$.data.items[0].read").value(false));
    }

    @Test
    void markRead_oneThenAll_andNotOthers_AC_TK_53_AC_TK_55() throws Exception {
        notifications.send(me, "A");
        notifications.send(me, "B");
        notifications.send(other, "C");

        as(me, post(URL + "/" + idOf(me, "A") + "/read")).andExpect(status().isNoContent());
        as(me, get(URL)).andExpect(jsonPath("$.data.unreadCount").value(1));
        as(me, post(URL + "/" + idOf(other, "C") + "/read")).andExpect(status().isNotFound());
        as(me, post(URL + "/read-all")).andExpect(status().isNoContent());
        as(me, get(URL)).andExpect(jsonPath("$.data.unreadCount").value(0));
        as(other, get(URL)).andExpect(jsonPath("$.data.unreadCount").value(1));
    }

    @Test
    void latest_withoutToken_returns401() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().isUnauthorized());
    }
}
