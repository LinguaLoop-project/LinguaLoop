package com.lingualoop.backend.vocab.controller;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.vocab.DeckManageTestData;

/**
 * API danh sách bộ thẻ của quản trị viên (UC-BT-01, BR-BT-01). Danh sách quản trị viên gồm bộ của mọi test chạy trên
 * cùng cơ sở dữ liệu, nên mỗi test đặt tên bộ với tiền tố {@link #base} và lọc {@code q} theo tiền tố đó.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DeckManageTestData.class})
class AdminVocabDeckApiIntegrationTest {

    private static final String DECKS = "/api/v1/admin/vocab/decks";

    @Autowired private MockMvc mockMvc;
    @Autowired private DeckManageTestData data;

    private final String base = "bt" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

    private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.param("q", base)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(data.admin(), Role.ADMIN)));
    }

    @Test
    void listDecks_admin_returnsOnlyPublishedWithOwnerName_AC_BT_02() throws Exception {
        UUID a = data.teacher("Giáo viên A");
        UUID b = data.teacher("Giáo viên B");
        Instant now = Instant.now();
        data.deck(a, base + " A nháp").updatedAt(now).insert();
        data.deck(a, base + " A1").published().updatedAt(now.minus(3, ChronoUnit.MINUTES)).insert();
        data.deck(a, base + " A2").published().updatedAt(now.minus(1, ChronoUnit.MINUTES)).insert();
        data.deck(b, base + " B1").published().updatedAt(now.minus(2, ChronoUnit.MINUTES)).insert();

        asAdmin(get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.size").value(10))
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.items[0].name").value(base + " A2"))
                .andExpect(jsonPath("$.data.items[1].name").value(base + " B1"))
                .andExpect(jsonPath("$.data.items[2].name").value(base + " A1"))
                .andExpect(jsonPath("$.data.items[0].ownerId").value(a.toString()))
                .andExpect(jsonPath("$.data.items[0].ownerName").value("Giáo viên A"))
                .andExpect(jsonPath("$.data.items[1].ownerName").value("Giáo viên B"))
                .andExpect(jsonPath("$.data.items[*].status").value(containsInAnyOrder("published", "published",
                        "published")));
    }

    @Test
    void listDecks_ownerWithNoPublishedDecks_returnsEmpty_AC_BT_50() throws Exception {
        UUID c = data.teacher("Giáo viên C");
        data.deck(c, base + " C nháp").insert();
        data.deck(c, base + " C đã xóa").published().deletedAt(Instant.now()).insert();

        asAdmin(get(DECKS).param("ownerId", c.toString())).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isEmpty())
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void listDecks_systemTrue_returnsOnlySystemDecks_AC_BT_57() throws Exception {
        UUID a = data.teacher("Giáo viên A");
        UUID student = data.user(Role.STUDENT, "Học viên");
        UUID system = data.deck(null, base + " hệ thống").published().insert();
        data.deck(student, base + " cá nhân").personal().published().insert();
        data.deck(a, base + " A1").published().insert();
        data.deck(a, base + " A2").published().insert();

        asAdmin(get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(3));
        asAdmin(get(DECKS).param("system", "true")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(system.toString()))
                .andExpect(jsonPath("$.data.items[0].ownerId").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].ownerName").doesNotExist());
    }

    @Test
    void listDecks_adminStatusDraft_returns403_AC_BT_61() throws Exception {
        data.deck(data.teacher("Giáo viên A"), base + " nháp").insert();

        asAdmin(get(DECKS).param("status", "draft")).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.data").doesNotExist());
        // "Đã xuất bản" và "Tất cả" vẫn hợp lệ với quản trị viên
        asAdmin(get(DECKS).param("status", "published")).andExpect(status().isOk());
    }

    @Test
    void listDecks_adminStatusDeleted_returns403_AC_BT_61() throws Exception {
        data.deck(data.teacher("Giáo viên A"), base + " đã xóa").published().deletedAt(Instant.now()).insert();

        asAdmin(get(DECKS).param("status", "deleted")).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data").doesNotExist());
    }
}
