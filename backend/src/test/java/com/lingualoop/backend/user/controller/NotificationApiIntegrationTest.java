package com.lingualoop.backend.user.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.service.NotificationService;
import com.lingualoop.backend.user.service.NotificationType;
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

    @Test
    void typedNotification_returnsTypeParamsAndLink_legacyOnesHaveNone_AC_TK_74() throws Exception {
        notifications.send(me, "Cũ không có loại");
        jdbc.update("UPDATE notifications SET created_at = now() - interval '1 hour' WHERE user_id = ?", me);
        notifications.send(me, NotificationType.PRO_EXPIRING, "Gói Pro sắp hết hạn", "/student/subscription",
                Map.of("days", "7", "endsAt", "2026-12-01T00:00:00Z"), null);

        as(me, get(URL)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].type").value("PRO_EXPIRING"))
                .andExpect(jsonPath("$.data.items[0].link").value("/student/subscription"))
                .andExpect(jsonPath("$.data.items[0].params.days").value("7"))
                .andExpect(jsonPath("$.data.items[0].message").value("Gói Pro sắp hết hạn"))
                .andExpect(jsonPath("$.data.items[1].type").doesNotExist())
                .andExpect(jsonPath("$.data.items[1].link").doesNotExist())
                .andExpect(jsonPath("$.data.items[1].params").isEmpty());
        as(me, get(URL + "/all")).andExpect(jsonPath("$.data.items[0].type").value("PRO_EXPIRING"));
    }

    @Test
    void dedupeKey_sendsOncePerUser_butDifferentUsersAndKeysStillSend_AC_TK_74() {
        assertThat(notifications.send(me, NotificationType.PRO_EXPIRED, "A", null, Map.of(), "k1")).isTrue();
        assertThat(notifications.send(me, NotificationType.PRO_EXPIRED, "A", null, Map.of(), "k1")).isFalse();
        assertThat(notifications.send(me, NotificationType.PRO_EXPIRED, "A", null, Map.of(), "k2")).isTrue();
        assertThat(notifications.send(other, NotificationType.PRO_EXPIRED, "A", null, Map.of(), "k1")).isTrue();
        assertThat(notifications.send(me, NotificationType.PRO_EXPIRED, "B", null, Map.of(), null)).isTrue();
        assertThat(notifications.send(me, NotificationType.PRO_EXPIRED, "B", null, Map.of(), null)).isTrue();

        assertThat(jdbc.queryForObject("SELECT count(*) FROM notifications WHERE user_id = ?", Long.class, me))
                .isEqualTo(4);
    }

    @Test
    void preferences_listConfigurableTypesDefaultOn_andToggleOnlyForTheCaller_AC_TK_76() throws Exception {
        as(me, get(URL + "/preferences")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(3))
                .andExpect(jsonPath("$.data.items[0].type").value("REVIEW_DUE"))
                .andExpect(jsonPath("$.data.items[*].enabled").value(org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is(true))));

        as(me, put(URL + "/preferences/REVIEW_DUE").contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":false}")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].enabled").value(false))
                .andExpect(jsonPath("$.data.items[1].enabled").value(true));

        assertThat(notifications.send(me, NotificationType.REVIEW_DUE, "A", null, Map.of(), null)).isFalse();
        assertThat(notifications.send(other, NotificationType.REVIEW_DUE, "A", null, Map.of(), null)).isTrue();
        // Loại luôn gửi không bị tắt được dù học viên tắt loại khác
        assertThat(notifications.send(me, NotificationType.PRO_ACTIVATED, "A", null, Map.of(), null)).isTrue();

        as(me, put(URL + "/preferences/REVIEW_DUE").contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":true}")).andExpect(status().isOk());
        assertThat(notifications.send(me, NotificationType.REVIEW_DUE, "A", null, Map.of(), null)).isTrue();
    }

    @Test
    void preferences_rejectUnknownOrAlwaysOnTypesAndMissingBody_AC_TK_76() throws Exception {
        as(me, put(URL + "/preferences/PRO_ACTIVATED").contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":false}")).andExpect(status().isBadRequest());
        as(me, put(URL + "/preferences/NO_SUCH_TYPE").contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":false}")).andExpect(status().isBadRequest());
        as(me, put(URL + "/preferences/REVIEW_DUE").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        as(me, get(URL + "/preferences")).andExpect(jsonPath("$.data.items[*].enabled")
                .value(org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is(true))));
    }
}
