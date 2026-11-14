package com.lingualoop.backend.storage.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;

/** Xin URL tải lên qua API thật. Ký URL không gọi mạng nên credential giả là đủ, không cần S3. */
@SpringBootTest(properties = {
        "app.storage.s3.bucket=test-bucket",
        "app.storage.s3.access-key=AKIATEST",
        "app.storage.s3.secret-key=secret"})
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class UploadApiIntegrationTest {

    private static final String PRESIGN = "/api/v1/uploads/presign";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;

    private ResultActions presign(UUID userId, Role role, String body) throws Exception {
        String token = jwtTokenService.issueAccessToken(userId, role, UUID.randomUUID()).token();
        return mockMvc.perform(post(PRESIGN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    @Test
    void teacher_getsSignedPutUrl() throws Exception {
        UUID teacher = UUID.randomUUID();

        presign(teacher, Role.TEACHER, """
                {"purpose":"DECK_IMAGE","contentType":"image/png","size":2048}""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.key", Matchers.startsWith("vocab-decks/" + teacher + "/")))
                .andExpect(jsonPath("$.data.method").value("PUT"))
                .andExpect(jsonPath("$.data.uploadUrl", Matchers.containsString("X-Amz-Signature=")))
                .andExpect(jsonPath("$.data.headers['Content-Type']").value("image/png"))
                .andExpect(jsonPath("$.data.expiresAt").isNotEmpty());
    }

    @Test
    void student_isForbiddenForDeckImage() throws Exception {
        presign(UUID.randomUUID(), Role.STUDENT, """
                {"purpose":"DECK_IMAGE","contentType":"image/png","size":2048}""")
                .andExpect(status().isForbidden());
    }

    @Test
    void wrongTypeOrSize_isValidationError() throws Exception {
        presign(UUID.randomUUID(), Role.TEACHER, """
                {"purpose":"DECK_IMAGE","contentType":"application/pdf","size":2048}""")
                .andExpect(status().isBadRequest());
        presign(UUID.randomUUID(), Role.TEACHER, """
                {"purpose":"DECK_IMAGE","contentType":"image/png","size":3000000}""")
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingFields_isValidationError() throws Exception {
        presign(UUID.randomUUID(), Role.TEACHER, "{\"contentType\":\"image/png\"}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void anonymous_isUnauthorized() throws Exception {
        mockMvc.perform(post(PRESIGN).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
