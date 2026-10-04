package com.lingualoop.backend.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.common.web.RequestIdFilter;

@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, SecurityIntegrationTest.ProbeController.class })
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Test
    void healthIsPublicAndCarriesRequestId() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(header().exists(RequestIdFilter.HEADER));
    }

    @Test
    void protectedEndpointWithoutToken_returns401Json() throws Exception {
        mockMvc.perform(get("/api/v1/probe/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.traceId").exists());
    }

    @Test
    void garbageToken_returnsTokenInvalid() throws Exception {
        mockMvc.perform(get("/api/v1/probe/me").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("TOKEN_INVALID"));
    }

    @Test
    void validToken_resolvesCurrentUserId() throws Exception {
        UUID userId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/probe/me").header(HttpHeaders.AUTHORIZATION, bearer(userId, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(userId.toString()));
    }

    @Test
    void studentOnAdminPath_returns403Json() throws Exception {
        mockMvc.perform(get("/api/v1/admin/probe")
                .header(HttpHeaders.AUTHORIZATION, bearer(UUID.randomUUID(), Role.STUDENT)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void adminOnAdminPath_isAllowed() throws Exception {
        mockMvc.perform(get("/api/v1/admin/probe")
                .header(HttpHeaders.AUTHORIZATION, bearer(UUID.randomUUID(), Role.ADMIN)))
                .andExpect(status().isOk());
    }

    @Test
    void corsPreflightFromFrontendIsAllowed() throws Exception {
        mockMvc.perform(options("/api/v1/probe/me")
                .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));
    }

    @Test
    void corsPreflightFromUnknownOriginIsRejected() throws Exception {
        mockMvc.perform(options("/api/v1/probe/me")
                .header(HttpHeaders.ORIGIN, "https://evil.example")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isForbidden());
    }

    private String bearer(UUID userId, Role role) {
        return "Bearer " + jwtTokenService.issueAccessToken(userId, role).token();
    }

    @TestConfiguration
    @RestController
    static class ProbeController {

        @GetMapping("/api/v1/probe/me")
        ApiResponse<UUID> me(@CurrentUserId UUID userId) {
            return ApiResponse.ok(userId);
        }

        @GetMapping("/api/v1/admin/probe")
        ApiResponse<String> adminProbe() {
            return ApiResponse.ok("ok");
        }
    }
}
