package com.lingualoop.backend.credit;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import com.lingualoop.backend.user.service.UserAccountService;

/** GET /api/v1/credits/balance: học viên Free mới có 20 credit và mốc đặt lại ở tương lai. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class CreditControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;

    @Test
    void balance_ofANewFreeStudent_is20WithAResetTime() throws Exception {
        UUID user = userAccountService.createLocal("bal-" + UUID.randomUUID() + "@x.com", "Bal", "h").id();

        mockMvc.perform(get("/api/v1/credits/balance").header(HttpHeaders.AUTHORIZATION, bearer(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.balance").value(20))
                .andExpect(jsonPath("$.data.kind").value("free"))
                .andExpect(jsonPath("$.data.resetsAt").isNotEmpty());
    }

    @Test
    void balance_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/credits/balance")).andExpect(status().isUnauthorized());
    }

    private String bearer(UUID userId) {
        return "Bearer " + jwtTokenService.issueAccessToken(userId, Role.STUDENT, UUID.randomUUID()).token();
    }
}
