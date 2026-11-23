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

    private void insertAt(UUID user, String message, int minutesAgo) {
        jdbc.update("INSERT INTO notifications (user_id, message, created_at) VALUES (?, ?, now() - (? * interval '1 minute'))",
                user, message, minutesAgo);
    }

    @Test
    void all_pagesBy20NewestFirstAndOnlyOwn_AC_TK_59() throws Exception {
        for (int i = 0; i < 25; i++) {
            insertAt(me, "M" + i, i);                  // M0 mới nhất
        }
        insertAt(other, "Của người khác", 0);

        as(me, get(URL + "/all")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(20))
                .andExpect(jsonPath("$.data.items[0].message").value("M0"))
                .andExpect(jsonPath("$.data.items[19].message").value("M19"))
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(20))
                .andExpect(jsonPath("$.data.totalElements").value(25))
                .andExpect(jsonPath("$.data.totalPages").value(2));
        as(me, get(URL + "/all").param("page", "1")).andExpect(jsonPath("$.data.items.length()").value(5))
                .andExpect(jsonPath("$.data.items[4].message").value("M24"));
        as(me, get(URL + "/all").param("page", "9")).andExpect(jsonPath("$.data.items.length()").value(0));
    }

    @Test
    void all_unreadFilterListsOnlyUnreadAndFollowsMarkRead_AC_TK_60() throws Exception {
        insertAt(me, "A", 3);
        insertAt(me, "B", 2);
        insertAt(me, "C", 1);
        as(me, post(URL + "/" + idOf(me, "B") + "/read")).andExpect(status().isNoContent());

        as(me, get(URL + "/all").param("filter", "unread")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.items[0].message").value("C"))
                .andExpect(jsonPath("$.data.items[1].message").value("A"));
        as(me, get(URL + "/all").param("filter", "all")).andExpect(jsonPath("$.data.totalElements").value(3));
        as(me, post(URL + "/read-all")).andExpect(status().isNoContent());
        as(me, get(URL + "/all").param("filter", "unread")).andExpect(jsonPath("$.data.items.length()").value(0))
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void all_rejectsAnUnknownFilter_andNeedsAToken_AC_TK_59() throws Exception {
        as(me, get(URL + "/all").param("filter", "old")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        mockMvc.perform(get(URL + "/all")).andExpect(status().isUnauthorized());
    }

    @Test
    void latest_withoutToken_returns401() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().isUnauthorized());
    }
}
