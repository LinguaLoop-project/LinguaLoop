package com.lingualoop.backend.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.auth.entity.EmailToken;
import com.lingualoop.backend.auth.mail.AuthMailSender;
import com.lingualoop.backend.auth.repository.EmailTokenRepository;
import com.lingualoop.backend.auth.service.SecureTokens;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class RegisterIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountService userAccountService;

    @Autowired
    private EmailTokenRepository emailTokenRepository;

    @MockitoBean
    private AuthMailSender authMailSender;

    private static String uniqueEmail() {
        return "reg-" + UUID.randomUUID() + "@x.com";
    }

    private ResultActions register(String email, String password, String displayName, boolean acceptTerms)
            throws Exception {
        String body = """
                {"email":"%s","password":"%s","displayName":"%s","acceptTerms":%s}"""
                .formatted(email, password, displayName, acceptTerms);
        return mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private List<EmailToken> tokensOf(UUID userId) {
        return emailTokenRepository.findAll().stream().filter(t -> t.getUserId().equals(userId)).toList();
    }

    @Test
    void register_validRequest_createsUnverifiedStudentAndVerifyToken_AC01() throws Exception {
        String email = uniqueEmail();

        register(email, "password123", "Minh", true)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.mailSent").value(true))
                .andExpect(jsonPath("$.data.accessToken").doesNotExist())
                .andExpect(header().doesNotExist("Set-Cookie"));

        UserAccount user = userAccountService.findByEmail(email).orElseThrow();
        assertThat(user.role()).isEqualTo(Role.STUDENT);
        assertThat(user.emailVerified()).isFalse();
        assertThat(user.displayName()).isEqualTo("Minh");
        assertThat(user.passwordHash()).startsWith("$2").isNotEqualTo("password123");

        List<EmailToken> tokens = tokensOf(user.id());
        assertThat(tokens).hasSize(1);
        assertThat(tokens.get(0).getPurpose()).isEqualTo("verify_email");
        assertThat(tokens.get(0).getUsedAt()).isNull();

        ArgumentCaptor<String> rawToken = ArgumentCaptor.forClass(String.class);
        verify(authMailSender).sendVerifyEmail(eq(email), any(), rawToken.capture());
        assertThat(tokens.get(0).getTokenHash()).isEqualTo(SecureTokens.sha256(rawToken.getValue()));
        assertThat(tokens.get(0).getTokenHash()).isNotEqualTo(rawToken.getValue());
    }

    @Test
    void register_invalidFields_returnsFieldErrorsAndCreatesNothing_AC02() throws Exception {
        register("not-an-email", "short", " ", true)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[?(@.field=='email')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field=='password')].code").value("Size"))
                .andExpect(jsonPath("$.errors[?(@.field=='displayName')]").exists());

        verify(authMailSender, never()).sendVerifyEmail(any(), any(), any());
    }

    @Test
    void register_passwordLongerThan72Bytes_isRejectedNotServerError_AC02() throws Exception {
        // 40 ký tự nhưng 120 byte UTF-8: BCrypt chỉ nhận tối đa 72 byte
        register(uniqueEmail(), "ế".repeat(40), "Minh", true)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field=='password')]").exists());
    }

    @Test
    void register_termsNotAccepted_returns400AndCreatesNothing_AC03() throws Exception {
        String email = uniqueEmail();

        register(email, "password123", "Minh", false)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("acceptTerms"));

        assertThat(userAccountService.findByEmail(email)).isEmpty();
    }

    @Test
    void register_duplicateEmailCaseInsensitive_returns409_AC04() throws Exception {
        String email = uniqueEmail();
        register(email, "password123", "Minh", true).andExpect(status().isCreated());

        register(email.toUpperCase(), "password123", "Khac", true)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AUTH_EMAIL_TAKEN"));
    }

    @Test
    void register_concurrentSameEmail_oneCreatedOtherConflict_AC04() throws Exception {
        String email = uniqueEmail();
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<Integer>> results = List.of(
                    pool.submit(() -> registerAfter(start, email)),
                    pool.submit(() -> registerAfter(start, email.toUpperCase())));
            start.countDown();

            List<Integer> statuses = List.of(results.get(0).get(), results.get(1).get());
            assertThat(statuses).containsExactlyInAnyOrder(201, 409);
        } finally {
            pool.shutdownNow();
        }
    }

    private int registerAfter(CountDownLatch start, String email) throws Exception {
        start.await();
        return register(email, "password123", "Race", true).andReturn().getResponse().getStatus();
    }

    @Test
    void register_sameDisplayNameDifferentEmail_isAllowed_AC05() throws Exception {
        register(uniqueEmail(), "password123", "Minh", true).andExpect(status().isCreated());
        register(uniqueEmail(), "password123", "Minh", true).andExpect(status().isCreated());
    }

    @Test
    void register_mailSendFails_stillCreatesAccountWithMailSentFalse_AC07() throws Exception {
        String email = uniqueEmail();
        doThrow(new IllegalStateException("smtp down")).when(authMailSender).sendVerifyEmail(any(), any(), any());

        register(email, "password123", "Minh", true)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.mailSent").value(false));

        assertThat(userAccountService.findByEmail(email)).isPresent();
    }
}
